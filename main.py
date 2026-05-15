import os
import re
import logging
from typing import Literal
from datetime import datetime, timezone

from fastapi import FastAPI, Request, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address


def _get_real_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import declarative_base, Session
from starlette.middleware.base import BaseHTTPMiddleware

from recipe import find_top_matches, calculate_nutrition
from spoonacular import get_recipe_info, SpoonacularError

logger = logging.getLogger(__name__)

if not os.getenv("SPOONACULAR_API_KEY"):
    raise RuntimeError("SPOONACULAR_API_KEY is not set. Add it to your .env file.")

# ── Rate limiter & DB ─────────────────────────────────────────────────────────

limiter  = Limiter(key_func=_get_real_ip)
_DB_PATH = os.path.join(os.path.dirname(__file__), "pantry.db")
engine   = create_engine(f"sqlite:///{_DB_PATH}", connect_args={"check_same_thread": False})
Base     = declarative_base()

class SearchHistory(Base):
    __tablename__ = "search_history"
    id           = Column(Integer, primary_key=True, index=True)
    ingredients  = Column(JSON)
    recipe_title = Column(String(300))
    recipe_id    = Column(Integer)
    match_pct    = Column(Float)
    searched_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(engine)

# ── App & middleware ──────────────────────────────────────────────────────────

app = FastAPI(title="PantryChef API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"]  = "nosniff"
        response.headers["X-Frame-Options"]         = "DENY"
        response.headers["Referrer-Policy"]         = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"]        = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Permissions-Policy"]      = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'none'; "
            "script-src 'none'; "
            "style-src 'none'; "
            "img-src 'none'; "
            "connect-src 'none';"
        )
        return response

_MAX_BODY = 10_000

class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        cl = request.headers.get("Content-Length")
        if cl:
            try:
                if int(cl) > _MAX_BODY:
                    return JSONResponse(status_code=413, content={"error": "Request body too large."})
            except ValueError:
                return JSONResponse(status_code=400, content={"error": "Invalid Content-Length header."})
        if len(await request.body()) > _MAX_BODY:
            return JSONResponse(status_code=413, content={"error": "Request body too large."})
        return await call_next(request)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(BodySizeLimitMiddleware)

_cors_origins = [
    o.strip() for o in
    os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
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
# Positive character allowlists block script/SQL/command injection payloads.

_INGREDIENT_RE = re.compile(r"^[a-zA-Z\xc0-\xff0-9][a-zA-Z\xc0-\xff0-9 '\-.,()/%]*$")
_DIET_RE       = re.compile(r"^[a-zA-Z\xc0-\xff][a-zA-Z\xc0-\xff \-]*$")
_VALID_MEALS   = Literal['breakfast','brunch','lunch','dinner','snack','appetizer','dessert','soup','salad']

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

class RecipeRequest(BaseModel):
    ingredients:          list[str]            = Field(min_length=1, max_length=20)
    dietary_restrictions: list[str] | None      = Field(default=None, max_length=10)
    meal:                 _VALID_MEALS | None   = None
    serving:              int                   = Field(default=1, ge=1, le=20)
    expirations:          dict[str, str] | None = None  # ingredient → YYYY-MM-DD

    @field_validator("ingredients")
    @classmethod
    def clean_ingredients(cls, items):
        cleaned = [i.strip() for i in items if i.strip()]
        if not cleaned:
            raise ValueError("Ingredients list cannot be empty.")
        for item in cleaned:
            if len(item) > 60:
                raise ValueError(f"Ingredient '{item[:30]}' is too long (max 60 chars).")
            if not _INGREDIENT_RE.match(item):
                raise ValueError(f"Ingredient '{item[:30]}' contains invalid characters.")
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
                raise ValueError("Dietary restriction too long (max 50 chars).")
            if not _DIET_RE.match(item):
                raise ValueError(f"Dietary restriction '{item[:30]}' contains invalid characters.")
            cleaned.append(item)
        return cleaned

    @field_validator("expirations")
    @classmethod
    def clean_expirations(cls, v):
        if not v:
            return None
        cleaned = {}
        for raw_key, raw_val in list(v.items())[:50]:   # cap at 50 entries
            key = str(raw_key).strip().lower()
            val = str(raw_val).strip()
            # Silently drop malformed entries — attacker gets no feedback
            if not key or len(key) > 60 or not _INGREDIENT_RE.match(key):
                continue
            if not _DATE_RE.match(val):
                continue
            cleaned[key] = val
        return cleaned or None

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "PantryChef API is running."}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/recipes/suggest")
@limiter.limit("10/minute")
def suggest_recipes(request: Request, body: RecipeRequest):
    pantry = set(i.strip().lower() for i in body.ingredients)
    try:
        results = find_top_matches(pantry, body.dietary_restrictions, body.meal, body.serving, body.expirations)
    except SpoonacularError as e:
        logger.error("Spoonacular error on suggest: %s", e)
        return JSONResponse(status_code=502, content={"error": "Recipe service temporarily unavailable. Please try again."})

    if not results:
        return JSONResponse(status_code=404, content={"error": "No matching recipes found."})

    best = results[0]
    try:
        with Session(engine) as s:
            s.add(SearchHistory(
                ingredients=list(body.ingredients),
                recipe_title=best["recipe"].get("title"),
                recipe_id=best["recipe"].get("id"),
                match_pct=round(best["match_percentage"], 2),
            ))
            s.commit()
    except Exception as e:
        logger.error("History write failed: %s", e)

    return {"results": results}


@app.get("/recipes/{recipe_id}/detail")
@limiter.limit("20/minute")
def get_recipe_detail(
    request: Request,
    recipe_id: int = Path(ge=1, le=1_000_000),
    serving:   int = Query(default=1, ge=1, le=20),
):
    try:
        recipe_info = get_recipe_info(recipe_id)
    except SpoonacularError as e:
        logger.error("Spoonacular error on detail %s: %s", recipe_id, e)
        return JSONResponse(status_code=502, content={"error": "Recipe service temporarily unavailable. Please try again."})
    return {"recipe": recipe_info, "nutrition": calculate_nutrition(recipe_info, serving)}


@app.get("/history")
@limiter.limit("30/minute")
def get_history(request: Request, limit: int = Query(default=20, ge=1, le=50)):
    with Session(engine) as s:
        rows = s.query(SearchHistory).order_by(SearchHistory.searched_at.desc()).limit(limit).all()
        return [
            {"id": r.id, "ingredients": r.ingredients, "recipe_title": r.recipe_title,
             "recipe_id": r.recipe_id, "match_pct": r.match_pct,
             "searched_at": r.searched_at.isoformat()}
            for r in rows
        ]


@app.delete("/history/{entry_id}")
@limiter.limit("30/minute")
def delete_history_entry(request: Request, entry_id: int):
    with Session(engine) as s:
        row = s.get(SearchHistory, entry_id)
        if not row:
            return JSONResponse(status_code=404, content={"error": "Entry not found."})
        s.delete(row)
        s.commit()
    return {"deleted": entry_id}
