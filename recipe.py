from datetime import date, datetime

from spoonacular import find_recipes


def _urgency_score(name: str, expirations: dict) -> int:
    date_str = expirations.get(name.lower())
    if not date_str:
        return 0
    try:
        exp = datetime.strptime(date_str, '%Y-%m-%d').date()
        days = (exp - date.today()).days
    except ValueError:
        return 0
    if days < 0:   return 30
    if days <= 3:  return 20
    if days <= 7:  return 10
    return 0


def find_top_matches(
    pantry_items: set,
    dietary_restrictions: list[str] | None = None,
    meal_type: str | None = None,
    servings: int | None = None,
    expirations: dict | None = None,
    limit: int = 6,
) -> list[dict]:
    expirations = expirations or {}

    sorted_items = sorted(
        pantry_items,
        key=lambda item: -_urgency_score(item, expirations),
    )

    recipes = find_recipes(
        sorted_items,
        dietary_restrictions=dietary_restrictions,
        meal_type=meal_type,
        servings=servings,
    )

    scored = []
    for recipe in recipes:
        used   = recipe.get("usedIngredientCount", 0)
        missed = recipe.get("missedIngredientCount", 0)
        total  = used + missed
        if total == 0:
            continue

        match_pct = round(used / total * 100, 2)

        urgency_bonus = sum(
            _urgency_score(ing.get("name", ""), expirations)
            for ing in recipe.get("usedIngredients", [])
        )

        nutrition = calculate_nutrition(recipe, servings or 1)
        missing = [
            ing.get("name", "")
            for ing in recipe.get("missedIngredients", [])
            if ing.get("name")
        ]

        scored.append({
            "recipe":              recipe,
            "match_percentage":    match_pct,
            "urgency_bonus":       urgency_bonus,
            "nutrition":           nutrition,
            "missing_ingredients": missing,
        })

    scored.sort(key=lambda x: x["match_percentage"] + x["urgency_bonus"], reverse=True)
    return scored[:limit]


def missing_ingredients(recipe: dict, pantry: set) -> list[str]:
    return [
        ing.get("name", "")
        for ing in recipe.get("extendedIngredients", [])
        if ing.get("name", "").lower() not in pantry
    ]


def calculate_nutrition(recipe: dict, servings: int) -> dict:
    nutrients    = recipe.get("nutrition", {}).get("nutrients", [])
    nutrient_map = {n["name"].lower(): n["amount"] for n in nutrients}
    return {
        "calories": nutrient_map.get("calories", 0) * servings,
        "protein":  nutrient_map.get("protein", 0) * servings,
        "fat":      nutrient_map.get("fat", 0) * servings,
        "carbs":    nutrient_map.get("carbohydrates", 0) * servings,
    }
