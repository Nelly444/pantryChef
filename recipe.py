from spoonacular import find_recipes


def find_top_matches(
    pantry_items: set,
    dietary_restrictions: list[str] | None = None,
    meal_type: str | None = None,
    servings: int | None = None,
    limit: int = 6,
) -> list[dict]:
    """
    Return the top `limit` recipes scored by ingredient match percentage.
    Each entry has recipe, match_percentage, nutrition, and missing_ingredients.
    """
    recipes = find_recipes(
        list(pantry_items),
        dietary_restrictions=dietary_restrictions,
        meal_type=meal_type,
        servings=servings,
    )
    scored = []
    for recipe in recipes:
        used = recipe.get("usedIngredientCount", 0)
        missed = recipe.get("missedIngredientCount", 0)
        total = used + missed
        if total == 0:
            continue
        pct = round(used / total * 100, 2)
        nutrition = calculate_nutrition(recipe, servings or 1)
        missing = [
            ing.get("name", "")
            for ing in recipe.get("missedIngredients", [])
            if ing.get("name")
        ]
        scored.append({
            "recipe": recipe,
            "match_percentage": pct,
            "nutrition": nutrition,
            "missing_ingredients": missing,
        })
    scored.sort(key=lambda x: x["match_percentage"], reverse=True)
    return scored[:limit]


def missing_ingredients(recipe: dict, pantry: set) -> list[str]:
    """Return ingredient names from a recipe that are not in the pantry."""
    return [
        ing.get("name", "")
        for ing in recipe.get("extendedIngredients", [])
        if ing.get("name", "").lower() not in pantry
    ]


def calculate_nutrition(recipe: dict, servings: int) -> dict:
    """Scale nutrients by the requested serving count."""
    nutrients = recipe.get("nutrition", {}).get("nutrients", [])
    nutrient_map = {n["name"].lower(): n["amount"] for n in nutrients}
    return {
        "calories": nutrient_map.get("calories", 0) * servings,
        "protein":  nutrient_map.get("protein", 0) * servings,
        "fat":      nutrient_map.get("fat", 0) * servings,
        "carbs":    nutrient_map.get("carbohydrates", 0) * servings,
    }


