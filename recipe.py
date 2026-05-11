from spoonacular import find_ingredients, get_recipe_info

# spoonacular best pick
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
    return best, best_pct

# nutrients × servings
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

# not in pantry set
def missing_ingredients(recipe, pantry_items):
    recipe_ingredients = recipe['extendedIngredients']
    missing = []
    for ingredient in recipe_ingredients:
        if ingredient['name'].lower() not in pantry_items:
            missing.append(ingredient['name'])
    return missing
