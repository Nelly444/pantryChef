from spoonacular import find_ingredients, get_recipe_info

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
