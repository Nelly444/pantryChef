import os
import requests
from dotenv import load_dotenv

load_dotenv() # this reads the .env file

API_KEY = os.getenv("SPOONACULAR_API_KEY")

def findIngredients(ingredients):
    url = "https://api.spoonacular.com/recipes/findByIngredients"
    
    params = {
        "apiKey": API_KEY,
        "ingredients": ingredients,
        "number": 4,
        "ranking": 1,
        "ignorePantry": True
    }

    response = requests.get(url, params=params)
    response.raise_for_status() #raises an error if request fails
    return response.json()