import os
from dotenv import load_dotenv

load_dotenv() # this reads your .env file

API_KEY = os.getenv("SPOONACULAR_API_KEY")