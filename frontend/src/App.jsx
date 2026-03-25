import { useState } from 'react'
function App() {
  return (
    <div>
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-4xl font-bold text-green-600">🥘 PantryChef</h1>
        <p className="text-gray-500 mt-1">Find recipes based on what you have</p>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mt-6">
          <p>Ingredient input goes here</p>
        </div>
      </div>
    </div>
  )
}

export default App