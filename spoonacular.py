import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SPOONACULAR_API_KEY")


class SpoonacularError(Exception):
    """Raised when the Spoonacular API returns an error we can't recover from.

    By defining our own exception type, main.py can catch specifically this
    error and return a clean 502 response instead of a raw 500 crash.
    """
    pass


# ── Diet / meal normalisation ─────────────────────────────────────────────────
# Spoonacular only accepts specific strings for diet and meal type.
# We normalise user input (free text) to those strings before sending.

_VALID_DIETS = {
    "vegetarian", "vegan", "gluten free", "ketogenic",
    "paleo", "pescetarian", "primal", "whole30",
    "lacto-vegetarian", "ovo-vegetarian",
}

_DIET_ALIASES = {
    "keto": "ketogenic",
    "gluten-free": "gluten free",
    "gf": "gluten free",
    "plant based": "vegan",
    "plant-based": "vegan",
}

# Frontend sends "dinner"/"lunch" but Spoonacular uses "main course".
_MEAL_TYPE_MAP = {
    "breakfast": "breakfast",
    "brunch": "breakfast",
    "lunch": "main course",
    "dinner": "main course",
    "snack": "snack",
    "appetizer": "appetizer",
    "dessert": "dessert",
    "soup": "soup",
    "salad": "salad",
}


def _resolve_diet(restrictions: list[str] | None) -> str | None:
    """
    Pick the first recognised Spoonacular diet from the user's list.
    Spoonacular only accepts one diet value, so we take the first match.
    """
    if not restrictions:
        return None
    for term in restrictions:
        normalised = term.strip().lower()
        normalised = _DIET_ALIASES.get(normalised, normalised)
        if normalised in _VALID_DIETS:
            return normalised
    return None


def _resolve_meal_type(meal: str | None) -> str | None:
    if not meal:
        return None
    return _MEAL_TYPE_MAP.get(meal.strip().lower())


# ── API calls ─────────────────────────────────────────────────────────────────

def find_recipes(
    ingredients: list[str],
    dietary_restrictions: list[str] | None = None,
    meal_type: str | None = None,
    servings: int | None = None,
) -> list[dict]:
    """
    Search for recipes using Spoonacular's complexSearch endpoint.

    We switched from findByIngredients to complexSearch because it supports
    diet and meal-type filtering while returning the same ingredient match data
    (usedIngredientCount, missedIngredientCount) when fillIngredients=True.
    """
    params = {
        "apiKey": API_KEY,
        "includeIngredients": ",".join(ingredients),
        "fillIngredients": True,
        "addRecipeInformation": True,
        "addRecipeNutrition": True,
        "number": 15,
    }

    diet = _resolve_diet(dietary_restrictions)
    if diet:
        params["diet"] = diet

    meal = _resolve_meal_type(meal_type)
    if meal:
        params["type"] = meal

    if servings is not None:
        # minServings = N so a recipe that serves fewer people than requested
        # is never returned (e.g. serving=2 won't surface a 1-person recipe).
        # maxServings = N+2 allows a little headroom — leftovers are fine.
        params["minServings"] = servings
        params["maxServings"] = servings + 2

    try:
        response = requests.get(
            "https://api.spoonacular.com/recipes/complexSearch",
            params=params,
            timeout=10,
        )
        response.raise_for_status()
        return response.json().get("results", [])
    except requests.exceptions.Timeout:
        raise SpoonacularError("Spoonacular took too long to respond. Try again.")
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code
        if status == 401:
            raise SpoonacularError("Invalid Spoonacular API key.")
        if status == 402:
            raise SpoonacularError("Spoonacular daily quota exceeded.")
        raise SpoonacularError(f"Spoonacular returned an error ({status}).")
    except requests.exceptions.RequestException:
        raise SpoonacularError("Could not reach Spoonacular. Check your connection.")


def get_recipe_info(recipe_id: int) -> dict:
    """Fetch full recipe details including nutrition and instructions."""
    try:
        response = requests.get(
            f"https://api.spoonacular.com/recipes/{recipe_id}/information",
            params={"apiKey": API_KEY, "includeNutrition": True},
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise SpoonacularError("Spoonacular took too long to respond. Try again.")
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code
        if status == 404:
            raise SpoonacularError(f"Recipe {recipe_id} not found on Spoonacular.")
        raise SpoonacularError(f"Spoonacular returned an error ({status}).")
    except requests.exceptions.RequestException:
        raise SpoonacularError("Could not reach Spoonacular. Check your connection.")
