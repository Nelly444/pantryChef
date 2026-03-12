import os
import requests
from dotenv import load_dotenv

load_dotenv() # this reads the .env file

API_KEY = os.getenv("SPOONACULAR_API_KEY")

# Find recipes by ingredients
def find_ingredients(ingredients):
    url = "https://api.spoonacular.com/recipes/findByIngredients"
    
    params = {
        "apiKey": API_KEY,
        "ingredients": ingredients,
        "number": 10,
        "ranking": 1,
        "ignorePantry": True
    }

    response = requests.get(url, params=params)
    response.raise_for_status() #raises an error if request fails
    return response.json()

# Get recipe information by ID
def get_recipe_info(id):
    url = f"https://api.spoonacular.com/recipes/{id}/information"
    params = {
        "apiKey": API_KEY,
        "includeNutrition": True
    }

    response = requests.get(url, params=params)
    response.raise_for_status() #raises an error if request fails
    return response.json()

