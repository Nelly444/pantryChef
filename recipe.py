from spoonacular import find_ingredients


def calculate_match(pantry_items: set) -> tuple:
    """Pick the recipe with the highest ingredient match percentage."""
    recipes = find_ingredients(list(pantry_items))
    best = None
    best_pct = 0.0
    for recipe in recipes:
        used = recipe.get("usedIngredientCount", 0)
        missed = recipe.get("missedIngredientCount", 0)
        total = used + missed
        if total == 0:
            continue
        pct = used / total * 100
        if pct > best_pct:
            best_pct = pct
            best = recipe
    return best, best_pct


def calculate_nutrition(recipe: dict, servings: int) -> dict:
    """
    Scale nutrients by the requested serving count.
    Returns zeros if the recipe has no nutrition data rather than crashing.
    """
    nutrients = recipe.get("nutrition", {}).get("nutrients", [])
    nutrient_map = {n["name"].lower(): n["amount"] for n in nutrients}
    return {
        "calories": nutrient_map.get("calories", 0) * servings,
        "protein":  nutrient_map.get("protein", 0) * servings,
        "fat":      nutrient_map.get("fat", 0) * servings,
        "carbs":    nutrient_map.get("carbohydrates", 0) * servings,
    }


def missing_ingredients(recipe: dict, pantry_items: set) -> list:
    """Return ingredient names that are in the recipe but not in the pantry."""
    extended = recipe.get("extendedIngredients", [])
    return [
        ing["name"]
        for ing in extended
        if ing.get("name", "").lower() not in pantry_items
    ]
