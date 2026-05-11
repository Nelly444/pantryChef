import streamlit as st
from recipe import calculate_match, calculate_nutrition, missing_ingredients
from spoonacular import find_ingredients, get_recipe_info

st.title("PantryChef")

# session defaults
if "ingredients" not in st.session_state:
    st.session_state.ingredients = ""
if "diet" not in st.session_state:
    st.session_state.diet = []
if "meal" not in st.session_state:
    st.session_state.meal = ""
if "servings" not in st.session_state:
    st.session_state.servings = 1
if "reset" not in st.session_state:
    st.session_state.reset = False

class PantryChefApp:

    def __init__(self):
        self.st = st

    def get_input(self):

        if self.st.session_state.reset:
            self.st.session_state.ingredients = ""
            self.st.session_state.diet = []
            self.st.session_state.meal = ""
            self.st.session_state.servings = 1
            self.st.session_state.reset = False

        ingredientsList = self.st.text_input("Enter ingredients (comma-separated): ", key="ingredients")

        dietPreferences = self.st.multiselect("Select diet preferences:", ["None", "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Dairy-free", "Low-carb"], key="diet")

        mealType = self.st.selectbox("Select meal type:", ["Breakfast", "Lunch", "Dinner", "Snack"], key="meal")

        numberOfServings = self.st.number_input("Enter the number of servings: ", min_value = 1, max_value = 20, key="servings")

        return ingredientsList , dietPreferences, mealType, numberOfServings

    def submit_button(self, ingredients, diet, meal, servings):
        if self.st.button("Submit"):
            if self.validate(ingredients, servings, diet, meal):
                pantry_items = set(
                    item.strip().lower()
                    for item in ingredients.split(",")
                    if item.strip()  # skip blanks
                )

                best_match, best_pct = calculate_match(pantry_items)
                if best_match is None:
                    self.st.warning("No matching recipes found for your meal/diet preferences.")
                    return
                recipe_info = get_recipe_info(best_match['id'])

                self.st.subheader("Best Matching Recipe:")
                self.st.write(f"Best Match: {best_match['title']} ({best_pct:.0f}% match)")

                nutrition_info = calculate_nutrition(recipe_info, servings)

                self.st.subheader("Nutrition Information:")
                self.st.write(f"Calories: {nutrition_info['calories']}")
                self.st.write(f"Protein: {nutrition_info['protein']}")
                self.st.write(f"Fat: {nutrition_info['fat']}")
                self.st.write(f"Carbohydrates: {nutrition_info['carbs']}")

                missing = missing_ingredients(recipe_info, pantry_items)

                self.st.subheader("Missing Ingredients:")
                self.st.write(", ".join(missing) if missing else "You have all the ingredients!")

    def clear_button(self):
        if self.st.button("Clear"):
            self.st.session_state.reset = True
            self.st.rerun()

    def validate(self, ingredients, servings, diet, meal):
        if not ingredients:
            self.st.error("Please enter at least one ingredient.")
            return False
        if "," not in ingredients and len(ingredients.split()) > 1:
            self.st.error("Please separate ingredients with commas.")
            return False
        if diet and "None" in diet and len(diet) > 1:
            self.st.error("Please select either 'None' or other diet preferences, not both.")
            return False
        if meal not in ["Breakfast", "Lunch", "Dinner", "Snack"]:
            self.st.error("Please select a valid meal type.")
            return False
        return True

app = PantryChefApp()

ingredients, diet, meal, servings = app.get_input()

app.submit_button(ingredients, diet, meal, servings)

app.clear_button()
