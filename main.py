import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from recipe import calculate_match, calculate_nutrition, missing_ingredients
from spoonacular import get_recipe_info

app = FastAPI()

# comma-separated override via CORS_ORIGINS
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

class RecipeRequest(BaseModel):
    ingredients: list[str]
    dietary_restrictions: list[str] | None = None
    meal: str | None = None
    serving: int = 1

@app.post("/recipes/suggest")
def suggest_recipes(request: RecipeRequest):
    pantry_items = set(
        item.strip().lower()
        for item in request.ingredients
        if item.strip()  # skip blanks
    )
    best_match, best_pct = calculate_match(pantry_items)
    if best_match is None:
        return {"error": "No matching recipes found."}

    recipe_info = get_recipe_info(best_match['id'])
    nutrition_info = calculate_nutrition(recipe_info, request.serving)
    missing = missing_ingredients(recipe_info, pantry_items)

    return {
        "recipe": recipe_info,
        "match_percentage": round(best_pct, 2),
        "nutrition": nutrition_info,
        "missing_ingredients": missing
    }
@app.get("/")
def home():
    return {"message": "Welcome to the Pantry Chef API!"}
