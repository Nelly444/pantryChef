import streamlit as st

st.title("PantryChef") #Title display

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
                self.st.session_state.ingredients = ingredients
                self.st.session_state.diet = diet
                self.st.session_state.meal = meal
                self.st.session_state.servings = servings

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

app = PantryChefApp() #This creates an instance of the PantryChefApp class

ingredients, diet, meal, servings = app.get_input() #This is so that it can display in streamlit

app.submit_button(ingredients, diet, meal, servings)
