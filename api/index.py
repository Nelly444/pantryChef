import sys
import os

# Make the project root importable so main.py, recipe.py, spoonacular.py are found
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from main import app
