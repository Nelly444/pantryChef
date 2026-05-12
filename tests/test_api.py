"""
PantryChef API test suite.

Run with:  pytest tests/ -v

These tests use mocking — we fake the Spoonacular responses so tests
never make real API calls (which would burn your quota and require network).
`unittest.mock.patch` temporarily replaces a real function with a fake one
for the duration of each test.
"""

import os
os.environ["SPOONACULAR_API_KEY"] = "test-key"  # prevent startup crash

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
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
    "vegetarian": True,
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


# ── /recipes/suggest ──────────────────────────────────────────────────────────

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
        res = client.post("/recipes/suggest", json={"ingredients": ["a" * 61]})
        assert res.status_code == 422

    def test_whitespace_only_ingredients_rejected(self):
        """A list of only whitespace strings is treated as empty."""
        res = client.post("/recipes/suggest", json={"ingredients": ["   ", "  "]})
        assert res.status_code == 422

    def test_serving_zero_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": 0})
        assert res.status_code == 422

    def test_serving_over_limit_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": 21})
        assert res.status_code == 422

    def test_negative_serving_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": -1})
        assert res.status_code == 422

    def test_no_matching_recipe_returns_404(self):
        with patch("main.calculate_match", return_value=(None, 0)):
            res = client.post("/recipes/suggest", json={"ingredients": ["xyz_ingredient"]})
        assert res.status_code == 404

    def test_spoonacular_error_returns_502(self):
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
        assert res.json()["nutrition"]["calories"] == 800  # 400 * 2

    def test_recipe_with_no_nutrition_data(self):
        """Recipe missing nutrition key must return zeros, not crash."""
        no_nutrition = {**FAKE_RECIPE, "nutrition": {}}
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 75.0)), \
             patch("main.get_recipe_info", return_value=no_nutrition):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert res.json()["nutrition"]["calories"] == 0

    def test_missing_ingredients_field_required(self):
        res = client.post("/recipes/suggest", json={"serving": 2})
        assert res.status_code == 422


# ── Dietary restrictions & meal type ─────────────────────────────────────────

class TestDietaryFiltering:

    def test_dietary_restrictions_passed_to_calculate_match(self):
        """Dietary restrictions must be forwarded to calculate_match."""
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 80.0)) as mock_match, \
             patch("main.get_recipe_info", return_value=FAKE_RECIPE):
            client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "dietary_restrictions": ["vegetarian"],
            })
        _, kwargs = mock_match.call_args
        assert kwargs.get("dietary_restrictions") == ["vegetarian"]

    def test_meal_type_passed_to_calculate_match(self):
        """Meal type must be forwarded to calculate_match."""
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 80.0)) as mock_match, \
             patch("main.get_recipe_info", return_value=FAKE_RECIPE):
            client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "meal": "dinner",
            })
        _, kwargs = mock_match.call_args
        assert kwargs.get("meal_type") == "dinner"

    def test_diet_normalisation_vegetarian(self):
        from spoonacular import _resolve_diet
        assert _resolve_diet(["vegetarian"]) == "vegetarian"

    def test_diet_normalisation_alias_keto(self):
        from spoonacular import _resolve_diet
        assert _resolve_diet(["keto"]) == "ketogenic"

    def test_diet_normalisation_alias_gluten_free(self):
        from spoonacular import _resolve_diet
        assert _resolve_diet(["gluten-free"]) == "gluten free"

    def test_diet_normalisation_unknown_term_returns_none(self):
        from spoonacular import _resolve_diet
        assert _resolve_diet(["pescatarian_typo"]) is None

    def test_diet_normalisation_empty_returns_none(self):
        from spoonacular import _resolve_diet
        assert _resolve_diet([]) is None

    def test_meal_type_dinner_maps_to_main_course(self):
        from spoonacular import _resolve_meal_type
        assert _resolve_meal_type("dinner") == "main course"

    def test_meal_type_lunch_maps_to_main_course(self):
        from spoonacular import _resolve_meal_type
        assert _resolve_meal_type("lunch") == "main course"

    def test_meal_type_brunch_maps_to_breakfast(self):
        from spoonacular import _resolve_meal_type
        assert _resolve_meal_type("brunch") == "breakfast"

    def test_meal_type_unknown_returns_none(self):
        from spoonacular import _resolve_meal_type
        assert _resolve_meal_type("fourth meal") is None


# ── /history ──────────────────────────────────────────────────────────────────

class TestHistoryEndpoint:

    def test_history_returns_list(self):
        res = client.get("/history")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_history_limit_negative_rejected(self):
        res = client.get("/history?limit=-1")
        assert res.status_code == 422

    def test_history_limit_zero_rejected(self):
        res = client.get("/history?limit=0")
        assert res.status_code == 422

    def test_history_limit_over_cap_rejected(self):
        res = client.get("/history?limit=51")
        assert res.status_code == 422


# ── /history/{id} DELETE ──────────────────────────────────────────────────────

class TestDeleteHistory:

    def test_delete_nonexistent_entry_returns_404(self):
        res = client.delete("/history/999999")
        assert res.status_code == 404

    def test_delete_with_string_id_rejected(self):
        res = client.delete("/history/not-a-number")
        assert res.status_code == 422


# ── Security tests ───────────────────────────────────────────────────────────

class TestSecurity:

    def test_security_headers_present(self):
        """Every response must include the three core security headers."""
        res = client.get("/")
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_security_headers_on_post(self):
        """Security headers must appear on POST responses too."""
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 75.0)), \
             patch("main.get_recipe_info", return_value=FAKE_RECIPE):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.headers.get("X-Content-Type-Options") == "nosniff"

    def test_body_too_large_rejected(self):
        """Payloads over 10KB must be rejected with 413."""
        huge_body = '{"ingredients":["' + "a" * 11_000 + '"]}'
        res = client.post(
            "/recipes/suggest",
            content=huge_body,
            headers={"Content-Type": "application/json", "Content-Length": str(len(huge_body))},
        )
        assert res.status_code == 413

    def test_dietary_restrictions_list_too_long(self):
        """More than 10 dietary restrictions must be rejected."""
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "dietary_restrictions": [f"diet{i}" for i in range(11)],
        })
        assert res.status_code == 422

    def test_dietary_restriction_string_too_long(self):
        """A dietary restriction string over 50 chars must be rejected."""
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "dietary_restrictions": ["v" * 51],
        })
        assert res.status_code == 422

    def test_meal_string_too_long(self):
        """A meal string over 50 chars must be rejected."""
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "meal": "d" * 51,
        })
        assert res.status_code == 422

    def test_db_write_failure_does_not_fail_response(self):
        """A database error during history write must not return 500 to the user."""
        with patch("main.calculate_match", return_value=(FAKE_MATCH, 75.0)), \
             patch("main.get_recipe_info", return_value=FAKE_RECIPE), \
             patch("main.Session", side_effect=Exception("DB is down")):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert res.json()["recipe"]["title"] == "Garlic Pasta"

    def test_delete_method_allowed(self):
        """DELETE must be accepted (not blocked by CORS method restriction)."""
        res = client.delete("/history/999999")
        assert res.status_code == 404  # 404 not found, not 405 method not allowed


# ── recipe.py unit tests ──────────────────────────────────────────────────────

class TestRecipeLogic:

    def test_calculate_nutrition_zeros_on_empty(self):
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
        from recipe import missing_ingredients
        assert missing_ingredients({}, {"garlic"}) == []
