import { useState } from 'react'
function App() {
  const [ingredient, setIngredient] = useState('') // State to hold the ingredient input
  const [ingredientsList, setIngredientsList] = useState([]) // State to hold the list of ingredients

  const handleAddIngredient = () => {
    // Logic to add the ingredient to the actual list
    if (ingredient.trim()) {
      setIngredientsList([...ingredientsList, ingredient])
      setIngredient('') // Clear the input after adding
    } else {
      alert('Please enter a valid ingredient.')
    }
  }


  
  return (
    <div>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-4xl font-bold text-green-600">🥘 PantryChef</h1>
        <p className="text-gray-500 mt-1">Find recipes based on what you have</p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
          <p className="font-semibold text-gray-700 mb-3">What's in your pantry?</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. eggs"
              value={ingredient} // This is the value
              onChange={(e) => setIngredient(e.target.value)} // Update state on input change
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
            />
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold" onClick={handleAddIngredient}>
              + Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {ingredientsList.map((item, index) => (
              <span key={index} className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
                {item}
                <button className="text-green-500 px-2 py-1 rounded-full text-xs ml-2" onClick={() => setIngredientsList(ingredientsList.filter((_, i) => i !== index))}>
                  x
                </button>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
    
  )
}

export default App