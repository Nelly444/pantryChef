import os

from fastapi import FastAPI, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import declarative_base, Session
from datetime import datetime, timezone

from recipe import calculate_match, calculate_nutrition, missing_ingredients
from spoonacular import get_recipe_info, SpoonacularError

# Fail fast if the API key is missing — better than a confusing 401 on first request
if not os.getenv("SPOONACULAR_API_KEY"):
    raise RuntimeError("SPOONACULAR_API_KEY is not set. Add it to your .env file.")

# ── Rate limiter ──────────────────────────────────────────────────
# get_remote_address pulls the client's IP from the request.
# Every endpoint we want to protect gets a @limiter.limit() decorator.
limiter = Limiter(key_func=get_remote_address)

# ── Database ──────────────────────────────────────────────────────
# SQLite stores data in a single file (pantry.db) in the project folder.
# No separate database server needed — perfect for a portfolio project.
# SQLAlchemy is the ORM (Object Relational Mapper) — it lets us work with
# the database using Python classes instead of raw SQL strings.
engine = create_engine("sqlite:///pantry.db", connect_args={"check_same_thread": False})
Base = declarative_base()

class SearchHistory(Base):
    """One row per recipe search. Stored forever until the user deletes it."""
    __tablename__ = "search_history"

    id        = Column(Integer, primary_key=True, index=True)
    ingredients  = Column(JSON)          # list of strings
    recipe_title = Column(String)
    recipe_id    = Column(Integer)
    match_pct    = Column(Float)
    searched_at  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(engine)  # creates pantry.db and the table if they don't exist yet

# ── App setup ─────────────────────────────────────────────────────
app = FastAPI(title="PantryChef API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_default_origins = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Input validation ──────────────────────────────────────────────
# Pydantic models are how FastAPI validates incoming JSON.
# Field() lets us add constraints: min/max length, min/max value.
# @field_validator runs custom logic before the data is accepted.
class RecipeRequest(BaseModel):
    ingredients: list[str] = Field(min_length=1, max_length=20)
    dietary_restrictions: list[str] | None = None
    meal: str | None = None
    serving: int = Field(default=1, ge=1, le=20)

    @field_validator("ingredients")
    @classmethod
    def clean_ingredients(cls, items):
        cleaned = [i.strip() for i in items if i.strip()]
        if not cleaned:
            raise ValueError("Ingredients list cannot be empty.")
        for item in cleaned:
            if len(item) > 60:
                raise ValueError(f"Ingredient name too long: '{item[:30]}...'")
        return cleaned


# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "PantryChef API is running."}


@app.post("/recipes/suggest")
@limiter.limit("10/minute")  # max 10 searches per minute per IP
def suggest_recipes(request: Request, body: RecipeRequest):
    """
    Main endpoint. Finds the best recipe from the user's pantry ingredients.
    Rate limited to protect the Spoonacular API quota.
    """
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

    # Save to database
    with Session(engine) as session:
        session.add(SearchHistory(
            ingredients=list(body.ingredients),
            recipe_title=recipe_info.get("title"),
            recipe_id=recipe_info.get("id"),
            match_pct=round(best_pct, 2),
        ))
        session.commit()

    return {
        "recipe": recipe_info,
        "match_percentage": round(best_pct, 2),
        "nutrition": nutrition_info,
        "missing_ingredients": missing,
    }


@app.get("/history")
@limiter.limit("30/minute")
def get_history(request: Request, limit: int = Query(default=20, ge=1, le=50)):
    """Returns the last N searches, newest first. Max 50."""
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
    """Deletes a single history entry by its database ID."""
    with Session(engine) as session:
        row = session.get(SearchHistory, entry_id)
        if not row:
            return JSONResponse(status_code=404, content={"error": "Entry not found."})
        session.delete(row)
        session.commit()
    return {"deleted": entry_id}
