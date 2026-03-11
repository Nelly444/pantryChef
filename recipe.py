from spoonacular import find_ingredients, get_recipe_info

# Calculate match percentage for pantry items
def calculate_match(pantry_items):
    ingredients = list(pantry_items)

    recipes = find_ingredients(ingredients)
    best = None
    best_pct = 0
    for recipe in recipes:
        used = recipe['usedIngredientCount']
        missed = recipe['missedIngredientCount']
        match_percentage = used / (used + missed) * 100
        if match_percentage > best_pct:
            best_pct = match_percentage
            best = recipe
    return best

# Calculate nutrition information for a recipe
def calculate_nutrition(recipe, servings):
    nutrients = recipe['nutrition']['nutrients']
    nutrient_map = {n["name"].lower(): n["amount"] for n in nutrients}
    result = {
        "calories": nutrient_map.get("calories", 0) * servings,
        "protein": nutrient_map.get("protein", 0) * servings,
        "fat": nutrient_map.get("fat", 0) * servings,
        "carbs": nutrient_map.get("carbohydrates", 0) * servings
    }
    return result


