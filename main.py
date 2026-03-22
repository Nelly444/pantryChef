from fastapi import FastAPI
from pydantic import BaseModel #This is so we can define data models
from recipe import calculate_match, calculate_nutrition, missing_ingredients
from spoonacular import get_recipe_info


app = FastAPI()

class RecipeRequest(BaseModel):
    ingredients: list[str]
    dietary_restrictions: list[str] | None = None
    meal: str | None = None
    serving: int | None = None

@app.post("/recipes/suggest")
def suggest_recipes(request: RecipeRequest):
    pantry_items = set(
        item.strip().lower()
        for item in request.ingredients
        if item.strip()  # filters out empty items
    )
    # Find the best matching recipe
    best_match, best_pct = calculate_match(pantry_items)
    if best_match is None:
        return {"error": "No matching recipes found."}

    # Gets detailed recipe info from Spoonacular
    recipe_info = get_recipe_info(best_match['id'])

    # Nutrition information feature
    nutrition_info = calculate_nutrition(recipe_info, request.serving)

    # Missing Ingredients feature
    missing = missing_ingredients(recipe_info, pantry_items)

    return {
        "recipe": recipe_info,
        "match_percentage": round(best_pct, 2),
        "nutrition": nutrition_info,
        "missing_ingredients": missing
    }
