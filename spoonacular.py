import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("SPOONACULAR_API_KEY")

class SpoonacularError(Exception):
    """Raised when the Spoonacular API returns an error we can't recover from.

    By defining our own exception type, main.py can catch specifically this
    error and return a clean 502 response — instead of letting a raw crash
    bubble up to the user as a 500 Internal Server Error.
    """
    pass


def find_ingredients(ingredients: list[str]) -> list[dict]:
    url = "https://api.spoonacular.com/recipes/findByIngredients"
    params = {
        "apiKey": API_KEY,
        "ingredients": ingredients,
        "number": 10,
        "ranking": 1,
        "ignorePantry": True,
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
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
    url = f"https://api.spoonacular.com/recipes/{recipe_id}/information"
    params = {
        "apiKey": API_KEY,
        "includeNutrition": True,
    }
    try:
        response = requests.get(url, params=params, timeout=10)
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
