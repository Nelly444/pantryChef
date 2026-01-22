import streamlit as st

st.title("PantryChef") #Title display

RECIPES = {
    "Chicken Ceasar Salad": {
        "ingredients": {"chicken", "lettuce", "tomatoes", "croutons", "garlic"},
        "nutrition": {
            "calories": 350,
            "protein": 30,
            "carbs": 10,
            "fat": 20
        },
        "meal": "Lunch",
        "diet": {"Vegan"},
        "servings": 1
    },
    "Baked Macaroni and Cheese": {
        "ingredients": {"macaroni", "cheese", "milk", "butter", "bread crumbs"},
        "nutrition": {
            "calories": 400,
            "protein": 15,
            "carbs": 50,
            "fat": 20
        },
        "meal": "Dinner",
        "diet": {"None"},
        "servings": 4
    },
    "Fried Rice": {
        "ingredients": {"rice", "vegetables", "soy sauce", "eggs", "green onions"},
        "nutrition": {
            "calories": 300,
            "protein": 10,
            "carbs": 45,
            "fat": 10
        },
        "meal": "Lunch",
        "diet": {"Dairy-free", "Vegan"},
        "servings": 2
    },
    "Pancakes": {
        "ingredients": {"flour", "milk", "eggs", "butter", "syrup"},
        "nutrition": {
            "calories": 350,
            "protein": 8,
            "carbs": 60,
            "fat": 10
        },
        "meal": "Breakfast",
        "diet": {"Vegetarian"},
        "servings": 2
    }
}

class PantryChefApp:

    def __init__(self):
        self.st = st #This is for streamlit

    #Input code
    def get_input(self):

        ingredientsList = self.st.text_input("Enter ingredients (comma-separated): ")

        dietPreferences = self.st.multiselect("Select diet preferences:", ["None", "Vegetarian", "Vegan", "Gluten-Free", "Keto", "Dairy-free", "Low-carb"])

        mealType = self.st.selectbox("Select meal type:", ["Breakfast", "Lunch", "Dinner", "Snack"])

        numberOfServings = self.st.number_input("Enter the number of servings: ", min_value = 1, max_value = 20)

        return ingredientsList , dietPreferences, mealType, numberOfServings
    
    #Submit button code
    def submit_button(self, ingredients, diet, meal, servings):
        if self.st.button("Submit"): 
            if self.validate(ingredients, servings, diet, meal):
                self.st.session_state.ingredients = ingredients #This is so we can use it later
                self.st.session_state.diet = diet
                self.st.session_state.meal = meal
                self.st.session_state.servings = servings

            # Perform calculations or data processing here
            pantry_items = set(
                item.strip().lower()
                for item in ingredients.split(",")
                if item.strip()
            )
            best_match = self.calculate_match(pantry_items)

            self.st.subheader("Best Matching Recipe:")
            self.st.write(f"Best Match: {best_match['name']} ({best_match['match']:.0f}% match)")




    #Helps validate user input
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
    
    def calculate_match(self, pantry_items):
        best_match = {"name": None, "match": 0}

        # Loops through recipes
        for recipe_name, recipe_info in RECIPES.items():

            # Get the ingredients for the recipe
            recipe_ingredients = recipe_info["ingredients"]

            # Count matching ingredients using set intersection
            ingredients_match = len(pantry_items.intersection(recipe_ingredients))

            #Calculate match percentage
            match_percentage = round(ingredients_match / len(recipe_ingredients) * 100, 0)

            if match_percentage > best_match["match"]: # Check if this recipe is a better match
                best_match["name"] = recipe_name
                best_match["match"] = match_percentage

        return best_match 

app = PantryChefApp() #This creates an instance of the PantryChefApp class

ingredients, diet, meal, servings = app.get_input() #This is so that it can display in streamlit

app.submit_button(ingredients, diet, meal, servings)



