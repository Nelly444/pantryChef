# PantryChef

PantryChef is an application that helps you find recipes based on your pantry ingredients and matches the best recipes to you based on what you have. It also provides nutrition facts for each recipe. It was built to help people with dietary restrictions, or anyone who just wants to find a recipe without scrolling through thousands of videos on YouTube.

## Architecture

PantryChef is built with a three-file architecture that separates the UI, API, and business logic layers.

- `user.py` — Streamlit frontend that handles all user input and displays results.
- `spoonacular.py` — handles all communication with the Spoonacular API via two functions: `find_ingredients()` and `get_recipe_info()`.
- `recipe.py` — contains the core business logic: match percentage calculator, nutrition calculator, and missing ingredients finder.

## Setup