import os
import re
import logging
from typing import Literal

from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import declarative_base, Session
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timezone

from recipe import calculate_match, calculate_nutrition, missing_ingredients
from spoonacular import get_recipe_info, SpoonacularError

logger = logging.getLogger(__name__)

# Fail fast if the API key is missing — better than a confusing 401 on first request
if not os.getenv("SPOONACULAR_API_KEY"):
    raise RuntimeError("SPOONACULAR_API_KEY is not set. Add it to your .env file.")

# ── Rate limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Database ──────────────────────────────────────────────────────────────────
# Use an absolute path so the DB file is always next to main.py,
# regardless of what directory the server is started from.
_DB_PATH = os.path.join(os.path.dirname(__file__), "pantry.db")
engine = create_engine(f"sqlite:///{_DB_PATH}", connect_args={"check_same_thread": False})
Base = declarative_base()

class SearchHistory(Base):
    __tablename__ = "search_history"
    id           = Column(Integer, primary_key=True, index=True)
    ingredients  = Column(JSON)
    recipe_title = Column(String(300))
    recipe_id    = Column(Integer)
    match_pct    = Column(Float)
    searched_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="PantryChef API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Security headers middleware ───────────────────────────────────────────────
# These headers tell browsers how to handle the response safely.
# X-Content-Type-Options: prevents MIME-sniffing attacks
# X-Frame-Options: prevents clickjacking (loading your app in an iframe)
# Referrer-Policy: controls how much URL info is sent to third parties
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

# ── Body size limit middleware ────────────────────────────────────────────────
# Without this, an attacker can send a multi-MB payload.
# 10KB is generous for our API — a valid request is ~200 bytes.
_MAX_BODY_BYTES = 10_000

class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Check Content-Length header first (fast path).
        # Wrap in try/except in case the header value is malformed (e.g. "Content-Length: abc").
        content_length = request.headers.get("Content-Length")
        if content_length:
            try:
                if int(content_length) > _MAX_BODY_BYTES:
                    return JSONResponse(status_code=413, content={"error": "Request body too large."})
            except ValueError:
                return JSONResponse(status_code=400, content={"error": "Invalid Content-Length header."})

        # Also read and cap the actual body bytes to catch chunked requests
        # that omit Content-Length entirely.
        body = await request.body()
        if len(body) > _MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"error": "Request body too large."})

        return await call_next(request)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BodySizeLimitMiddleware)

# CORS — restrict to only the methods and headers the app actually uses.
# allow_credentials is False because we use no cookies or HTTP auth.
_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)

# ── Input validation ──────────────────────────────────────────────────────────
# Positive character allowlists — only chars that appear in real food names.
# Letters (a-z, A-Z, accented À-ÿ), digits, space, and safe punctuation.
# This blocks angle brackets, semicolons, pipes, backticks, dollar signs, etc.
# that appear in script-injection, SQL-injection, and command-injection payloads.
_INGREDIENT_RE = re.compile(r"^[a-zA-Z\xc0-\xff0-9][a-zA-Z\xc0-\xff0-9 '\-.,()/%]*$")
_DIET_RE       = re.compile(r"^[a-zA-Z\xc0-\xff][a-zA-Z\xc0-\xff \-]*$")

_VALID_MEALS = Literal[
    'breakfast', 'brunch', 'lunch', 'dinner',
    'snack', 'appetizer', 'dessert', 'soup', 'salad',
]


class RecipeRequest(BaseModel):
    ingredients: list[str] = Field(min_length=1, max_length=20)
    dietary_restrictions: list[str] | None = Field(default=None, max_length=10)
    # Literal enum — rejects any string not in the known list.
    meal: _VALID_MEALS | None = None
    serving: int = Field(default=1, ge=1, le=20)

    @field_validator("ingredients")
    @classmethod
    def clean_ingredients(cls, items):
        cleaned = [i.strip() for i in items if i.strip()]
        if not cleaned:
            raise ValueError("Ingredients list cannot be empty.")
        for item in cleaned:
            if len(item) > 60:
                raise ValueError(f"Ingredient '{item[:30]}' is too long (max 60 characters).")
            if not _INGREDIENT_RE.match(item):
                raise ValueError(
                    f"Ingredient '{item[:30]}' contains invalid characters. "
                    "Only letters, digits, spaces, and basic punctuation are allowed."
                )
        return cleaned

    @field_validator("dietary_restrictions")
    @classmethod
    def clean_dietary(cls, items):
        if items is None:
            return items
        cleaned = []
        for raw in items:
            item = raw.strip()
            if not item:
                continue
            if len(item) > 50:
                raise ValueError("Dietary restriction string too long (max 50 characters).")
            if not _DIET_RE.match(item):
                raise ValueError(
                    f"Dietary restriction '{item[:30]}' contains invalid characters. "
                    "Only letters, spaces, and hyphens are allowed."
                )
            cleaned.append(item)
        return cleaned


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "PantryChef API is running."}


@app.post("/recipes/suggest")
@limiter.limit("10/minute")
def suggest_recipes(request: Request, body: RecipeRequest):
    pantry_items = set(item.strip().lower() for item in body.ingredients)

    try:
        best_match, best_pct = calculate_match(
            pantry_items,
            dietary_restrictions=body.dietary_restrictions,
            meal_type=body.meal,
        )
    except SpoonacularError as e:
        return JSONResponse(status_code=502, content={"error": str(e)})

    if best_match is None:
        return JSONResponse(status_code=404, content={"error": "No matching recipes found."})

    try:
        recipe_info = get_recipe_info(best_match["id"])
    except SpoonacularError as e:
        return JSONResponse(status_code=502, content={"error": str(e)})

    nutrition_info = calculate_nutrition(recipe_info, body.serving)
    missing = missing_ingredients(recipe_info, pantry_items)

    # History write is best-effort — a DB failure should not fail the main response.
    # We log the error so it's visible in server logs but the user still gets their recipe.
    try:
        with Session(engine) as session:
            session.add(SearchHistory(
                ingredients=list(body.ingredients),
                recipe_title=recipe_info.get("title"),
                recipe_id=recipe_info.get("id"),
                match_pct=round(best_pct, 2),
            ))
            session.commit()
    except Exception as e:
        logger.error("Failed to save search history: %s", e)

    return {
        "recipe": recipe_info,
        "match_percentage": round(best_pct, 2),
        "nutrition": nutrition_info,
        "missing_ingredients": missing,
    }


@app.get("/history")
@limiter.limit("30/minute")
def get_history(request: Request, limit: int = Query(default=20, ge=1, le=50)):
    with Session(engine) as session:
        rows = (
            session.query(SearchHistory)
            .order_by(SearchHistory.searched_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": r.id,
                "ingredients": r.ingredients,
                "recipe_title": r.recipe_title,
                "recipe_id": r.recipe_id,
                "match_pct": r.match_pct,
                "searched_at": r.searched_at.isoformat(),
            }
            for r in rows
        ]


@app.delete("/history/{entry_id}")
@limiter.limit("30/minute")
def delete_history_entry(request: Request, entry_id: int):
    with Session(engine) as session:
        row = session.get(SearchHistory, entry_id)
        if not row:
            return JSONResponse(status_code=404, content={"error": "Entry not found."})
        session.delete(row)
        session.commit()
    return {"deleted": entry_id}
