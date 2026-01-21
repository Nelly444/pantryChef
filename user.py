import streamlit as st

st.title("PantryChef")

class PantryChefApp:

    def __init__(self):
        self.st = st #This is for streamlit

    def get_input(self):

        ingredientsList = self.st.text_input("Enter ingredients (comma-separated): ")

        dietPreferences = self.st.multiselect("Select diet preferences:", ["Vegetarian", "Vegan", "Gluten-Free", "Keto", "Dairy-free", "Low-carb"])

        mealType = self.st.selectbox("Select meal type:", ["Breakfast", "Lunch", "Dinner", "Snack"])

        numberOfServings = self.st.number_input("Enter the number of servings: ", min_value = 1, max_value = 20)

        return [ingredient.strip() for ingredient in ingredientsList.split(",") if ingredient], dietPreferences, mealType, numberOfServings
    
    #Add a submit button
    def submit_button(self, ingredients, diet, meal, servings):
        if self.st.button("Submit"): 
            self.st.session_state.ingredients = ingredients
            self.st.session_state.diet = diet
            self.st.session_state.meal = meal
            self.st.session_state.servings = servings

app = PantryChefApp() #This creates an instance of the PantryChefApp class
ingredients, diet, meal, servings = app.get_input() #This is so that it can display in streamlit
app.submit_button(ingredients, diet, meal, servings)
