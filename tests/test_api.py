"""
PantryChef API test suite.

Run with:  pytest tests/ -v

These tests use mocking — we fake the Spoonacular responses so tests
never make real API calls (which would burn your quota and require network).
`unittest.mock.patch` temporarily replaces a real function with a fake one
for the duration of each test.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# TestClient lets us make HTTP requests to the FastAPI app without
# running a real server. It's synchronous, so tests are simple functions.
import os
os.environ["SPOONACULAR_API_KEY"] = "test-key"  # prevent startup crash

from main import app

client = TestClient(app)

# ── Fake data ────────────────────────────────────────────────────────────────

FAKE_MATCH = {
    "id": 1,
    "title": "Garlic Pasta",
    "usedIngredientCount": 3,
    "missedIngredientCount": 1,
}

FAKE_RECIPE = {
    "id": 1,
    "title": "Garlic Pasta",
    "image": "https://example.com/pasta.jpg",
    "readyInMinutes": 20,
    "servings": 2,
    "vegetarian": False,
    "vegan": False,
    "summary": "A simple pasta dish.",
    "sourceUrl": "https://example.com",
    "analyzedInstructions": [],
    "extendedIngredients": [
        {"name": "garlic", "original": "3 cloves garlic"},
        {"name": "pasta", "original": "200g pasta"},
        {"name": "cream", "original": "100ml cream"},
        {"name": "parmesan", "original": "50g parmesan"},
    ],
    "nutrition": {
        "nutrients": [
            {"name": "Calories", "amount": 400},
            {"name": "Protein", "amount": 15},
            {"name": "Fat", "amount": 10},
            {"name": "Carbohydrates", "amount": 60},
        ]
    },
}


# ── /recipes/suggest ─────────────────────────────────────────────────────────

class TestSuggestEndpoint:

    def test_happy_path(self):
        """Valid request returns a recipe with all expected fields."""
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 75.0)), \
             patch("main.get_recipe_info", return_value=FAKE_RECIPE):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic", "pasta", "cream"]})
        assert res.status_code == 200
        body = res.json()
        assert body["recipe"]["title"] == "Garlic Pasta"
        assert body["match_percentage"] == 75.0
        assert "nutrition" in body
        assert "missing_ingredients" in body

    def test_empty_ingredients_rejected(self):
        """An empty ingredients list must be rejected with 422."""
        res = client.post("/recipes/suggest", json={"ingredients": []})
        assert res.status_code == 422

    def test_too_many_ingredients_rejected(self):
        """More than 20 ingredients must be rejected with 422."""
        res = client.post("/recipes/suggest", json={"ingredients": [f"item{i}" for i in range(21)]})
        assert res.status_code == 422

    def test_ingredient_too_long_rejected(self):
        """Ingredient names over 60 characters must be rejected."""
        long_name = "a" * 61
        res = client.post("/recipes/suggest", json={"ingredients": [long_name]})
        assert res.status_code == 422

    def test_whitespace_only_ingredients_rejected(self):
        """A list of only whitespace strings is treated as empty."""
        res = client.post("/recipes/suggest", json={"ingredients": ["   ", "  "]})
        assert res.status_code == 422

    def test_serving_zero_rejected(self):
        """Serving count of 0 must be rejected."""
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": 0})
        assert res.status_code == 422

    def test_serving_over_limit_rejected(self):
        """Serving count above 20 must be rejected."""
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": 21})
        assert res.status_code == 422

    def test_negative_serving_rejected(self):
        """Negative serving count must be rejected."""
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": -1})
        assert res.status_code == 422

    def test_no_matching_recipe_returns_404(self):
        """When Spoonacular finds nothing, return 404."""
        with patch("main.calculate_match", return_value=(None, 0)):
            res = client.post("/recipes/suggest", json={"ingredients": ["xyz_ingredient"]})
        assert res.status_code == 404

    def test_spoonacular_error_returns_502(self):
        """When Spoonacular is down, return 502 not 500."""
        from spoonacular import SpoonacularError
        with patch("main.calculate_match", side_effect=SpoonacularError("Quota exceeded")):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 502
        assert "error" in res.json()

    def test_nutrition_scaled_by_servings(self):
        """Nutrition values must be multiplied by serving count."""
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 75.0)), \
             patch("main.get_recipe_info", return_value=FAKE_RECIPE):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": 2})
        assert res.status_code == 200
        # FAKE_RECIPE has 400 calories per serving, so 2 servings = 800
        assert res.json()["nutrition"]["calories"] == 800

    def test_recipe_with_no_nutrition_data(self):
        """Recipe missing nutrition key must return zeros, not crash."""
        recipe_no_nutrition = {**FAKE_RECIPE, "nutrition": {}}
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 75.0)), \
             patch("main.get_recipe_info", return_value=recipe_no_nutrition):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert res.json()["nutrition"]["calories"] == 0

    def test_missing_ingredients_field_required(self):
        """Omitting the ingredients field entirely must be rejected."""
        res = client.post("/recipes/suggest", json={"serving": 2})
        assert res.status_code == 422


# ── /history ──────────────────────────────────────────────────────────────────

class TestHistoryEndpoint:

    def test_history_returns_list(self):
        """GET /history always returns a list."""
        res = client.get("/history")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_history_limit_negative_rejected(self):
        """Negative limit must be rejected."""
        res = client.get("/history?limit=-1")
        assert res.status_code == 422

    def test_history_limit_zero_rejected(self):
        """Zero limit must be rejected."""
        res = client.get("/history?limit=0")
        assert res.status_code == 422

    def test_history_limit_over_cap_rejected(self):
        """Limit above 50 must be rejected."""
        res = client.get("/history?limit=51")
        assert res.status_code == 422


# ── /history/{id} DELETE ──────────────────────────────────────────────────────

class TestDeleteHistory:

    def test_delete_nonexistent_entry_returns_404(self):
        """Deleting an ID that doesn't exist must return 404."""
        res = client.delete("/history/999999")
        assert res.status_code == 404

    def test_delete_with_string_id_rejected(self):
        """Non-integer ID in the URL must be rejected with 422."""
        res = client.delete("/history/not-a-number")
        assert res.status_code == 422


# ── recipe.py unit tests ──────────────────────────────────────────────────────

class TestRecipeLogic:

    def test_calculate_nutrition_zeros_on_empty(self):
        """Missing nutrition data returns zeros, not an exception."""
        from recipe import calculate_nutrition
        result = calculate_nutrition({}, servings=1)
        assert result == {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}

    def test_calculate_nutrition_scales_correctly(self):
        from recipe import calculate_nutrition
        result = calculate_nutrition(FAKE_RECIPE, servings=3)
        assert result["calories"] == 1200  # 400 * 3

    def test_missing_ingredients_finds_gaps(self):
        from recipe import missing_ingredients
        pantry = {"garlic", "pasta"}
        missing = missing_ingredients(FAKE_RECIPE, pantry)
        assert "cream" in missing
        assert "parmesan" in missing
        assert "garlic" not in missing

    def test_missing_ingredients_empty_on_full_pantry(self):
        from recipe import missing_ingredients
        pantry = {"garlic", "pasta", "cream", "parmesan"}
        assert missing_ingredients(FAKE_RECIPE, pantry) == []

    def test_missing_ingredients_handles_no_extended(self):
        """Recipe without extendedIngredients must not crash."""
        from recipe import missing_ingredients
        result = missing_ingredients({}, {"garlic"})
        assert result == []
