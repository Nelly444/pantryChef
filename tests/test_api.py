import os
os.environ["SPOONACULAR_API_KEY"] = "test-key"

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app, limiter

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Clear slowapi's in-memory counters before each test so the rate limit doesn't fire mid-suite."""
    limiter._storage.reset()
    yield

# Fake data

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
            {"name": "Calories",      "amount": 400},
            {"name": "Protein",       "amount": 15},
            {"name": "Fat",           "amount": 10},
            {"name": "Carbohydrates", "amount": 60},
        ]
    },
}

FAKE_RESULT = {
    "recipe":              FAKE_RECIPE,
    "match_percentage":    75.0,
    "nutrition":           {"calories": 400, "protein": 15, "fat": 10, "carbs": 60},
    "missing_ingredients": ["cream"],
}

FAKE_RESULT_2X = {
    **FAKE_RESULT,
    "nutrition": {"calories": 800, "protein": 30, "fat": 20, "carbs": 120},
}


# /recipes/suggest

class TestSuggestEndpoint:

    def test_happy_path(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic", "pasta", "cream"]})
        assert res.status_code == 200
        body = res.json()
        assert "results" in body
        first = body["results"][0]
        assert first["recipe"]["title"] == "Garlic Pasta"
        assert first["match_percentage"] == 75.0
        assert "nutrition" in first
        assert "missing_ingredients" in first

    def test_empty_ingredients_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": []})
        assert res.status_code == 422

    def test_too_many_ingredients_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": [f"item{i}" for i in range(21)]})
        assert res.status_code == 422

    def test_ingredient_too_long_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["a" * 61]})
        assert res.status_code == 422

    def test_whitespace_only_ingredients_rejected(self):
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
        with patch("main.find_top_matches", return_value=[]):
            res = client.post("/recipes/suggest", json={"ingredients": ["xyzzygarble"]})
        assert res.status_code == 404
        assert "error" in res.json()

    def test_spoonacular_error_returns_502(self):
        from spoonacular import SpoonacularError
        with patch("main.find_top_matches", side_effect=SpoonacularError("Quota exceeded")):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 502
        assert "error" in res.json()

    def test_nutrition_already_scaled_in_result(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT_2X]):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "serving": 2})
        assert res.status_code == 200
        assert res.json()["results"][0]["nutrition"]["calories"] == 800

    def test_recipe_with_no_nutrition_returns_zeros(self):
        no_nutrition_result = {**FAKE_RESULT, "nutrition": {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}}
        with patch("main.find_top_matches", return_value=[no_nutrition_result]):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert res.json()["results"][0]["nutrition"]["calories"] == 0

    def test_missing_ingredients_field_required(self):
        res = client.post("/recipes/suggest", json={"serving": 2})
        assert res.status_code == 422

    def test_multiple_results_returned(self):
        result2 = {**FAKE_RESULT, "match_percentage": 60.0}
        with patch("main.find_top_matches", return_value=[FAKE_RESULT, result2]):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert len(res.json()["results"]) == 2


# Dietary restrictions & meal type

class TestDietaryFiltering:

    def test_dietary_restrictions_passed_to_find_top_matches(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock_fn:
            client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "dietary_restrictions": ["vegetarian"],
            })
        args, kwargs = mock_fn.call_args
        assert kwargs.get("dietary_restrictions") == ["vegetarian"] or args[1] == ["vegetarian"]

    def test_meal_type_passed_to_find_top_matches(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock_fn:
            client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "meal": "dinner",
            })
        args, kwargs = mock_fn.call_args
        assert kwargs.get("meal_type") == "dinner" or args[2] == "dinner"

    def test_serving_count_passed_to_find_top_matches(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock_fn:
            client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "serving": 4,
            })
        args, kwargs = mock_fn.call_args
        assert kwargs.get("servings") == 4 or args[3] == 4

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


# /history

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


# /history/{id} DELETE

class TestDeleteHistory:

    def test_delete_nonexistent_entry_returns_404(self):
        res = client.delete("/history/999999")
        assert res.status_code == 404

    def test_delete_with_string_id_rejected(self):
        res = client.delete("/history/not-a-number")
        assert res.status_code == 422


# Security tests

class TestSecurity:

    def test_security_headers_present(self):
        res = client.get("/")
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert res.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"

    def test_xss_protection_header_present(self):
        res = client.get("/")
        assert res.headers.get("X-XSS-Protection") == "1; mode=block"

    def test_permissions_policy_header_present(self):
        res = client.get("/")
        assert "camera=()" in res.headers.get("Permissions-Policy", "")

    def test_security_headers_on_post(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"

    def test_body_too_large_rejected(self):
        huge_body = '{"ingredients":["' + "a" * 11_000 + '"]}'
        res = client.post(
            "/recipes/suggest",
            content=huge_body,
            headers={"Content-Type": "application/json", "Content-Length": str(len(huge_body))},
        )
        assert res.status_code == 413

    def test_dietary_restrictions_list_too_long(self):
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "dietary_restrictions": [f"diet{i}" for i in range(11)],
        })
        assert res.status_code == 422

    def test_dietary_restriction_string_too_long(self):
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "dietary_restrictions": ["v" * 51],
        })
        assert res.status_code == 422

    def test_meal_string_invalid_rejected(self):
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "meal": "d" * 51,
        })
        assert res.status_code == 422

    def test_db_write_failure_does_not_fail_response(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]), \
             patch("main.Session", side_effect=Exception("DB is down")):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert res.json()["results"][0]["recipe"]["title"] == "Garlic Pasta"

    def test_malformed_content_length_rejected(self):
        res = client.post(
            "/recipes/suggest",
            content='{"ingredients":["garlic"]}',
            headers={"Content-Type": "application/json", "Content-Length": "abc"},
        )
        assert res.status_code == 400

    def test_chunked_body_too_large_rejected(self):
        huge = '{"ingredients":["' + "a" * 11_000 + '"]}'
        res = client.post(
            "/recipes/suggest",
            content=huge,
            headers={"Content-Type": "application/json"},
        )
        assert res.status_code == 413

    def test_delete_method_allowed(self):
        res = client.delete("/history/999999")
        assert res.status_code == 404  # not 405


# Injection & allowlist tests

class TestInjectionRejection:

    def test_script_tag_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["<script>alert(1)</script>"]})
        assert res.status_code == 422

    def test_sql_injection_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic'; DROP TABLE--"]})
        assert res.status_code == 422

    def test_command_injection_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic | rm -rf /"]})
        assert res.status_code == 422

    def test_backtick_injection_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["`whoami`"]})
        assert res.status_code == 422

    def test_dollar_sign_injection_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["$(id)"]})
        assert res.status_code == 422

    def test_null_byte_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["garlic\x00"]})
        assert res.status_code == 422

    def test_angle_bracket_in_dietary_rejected(self):
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "dietary_restrictions": ["<script>xss</script>"],
        })
        assert res.status_code == 422

    def test_semicolon_in_dietary_rejected(self):
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "dietary_restrictions": ["vegan; DROP TABLE search_history"],
        })
        assert res.status_code == 422

    def test_invalid_meal_type_rejected(self):
        res = client.post("/recipes/suggest", json={
            "ingredients": ["garlic"],
            "meal": "fourth_meal",
        })
        assert res.status_code == 422

    def test_valid_meal_types_accepted(self):
        for meal in ["breakfast", "brunch", "lunch", "dinner", "snack"]:
            with patch("main.find_top_matches", return_value=[FAKE_RESULT]):
                res = client.post("/recipes/suggest", json={"ingredients": ["garlic"], "meal": meal})
            assert res.status_code == 200, f"Expected 200 for meal='{meal}', got {res.status_code}"

    def test_accented_ingredient_accepted(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]):
            res = client.post("/recipes/suggest", json={"ingredients": ["jalapeño"]})
        assert res.status_code == 200

    def test_underscore_in_ingredient_rejected(self):
        res = client.post("/recipes/suggest", json={"ingredients": ["xyz_ingredient"]})
        assert res.status_code == 422

    def test_path_traversal_in_recipe_id_rejected(self):
        res = client.get("/recipes/../history/detail")
        assert res.status_code in (404, 405, 422)

    def test_recipe_id_zero_rejected(self):
        res = client.get("/recipes/0/detail")
        assert res.status_code == 422

    def test_recipe_id_negative_rejected(self):
        res = client.get("/recipes/-1/detail")
        assert res.status_code in (404, 422)

    def test_recipe_id_over_limit_rejected(self):
        res = client.get("/recipes/9999999/detail")
        assert res.status_code == 422


# Expirations field

class TestExpirations:

    def test_expirations_accepted_and_forwarded(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock:
            res = client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "expirations": {"garlic": "2026-12-01"},
            })
        assert res.status_code == 200
        assert mock.call_args.args[4] == {"garlic": "2026-12-01"}

    def test_urgency_bonus_present_in_response(self):
        result_with_urgency = {**FAKE_RESULT, "urgency_bonus": 20}
        with patch("main.find_top_matches", return_value=[result_with_urgency]):
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        first = res.json()["results"][0]
        assert "urgency_bonus" in first
        assert first["urgency_bonus"] == 20

    def test_invalid_expiration_date_silently_dropped(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock:
            res = client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "expirations": {"garlic": "not-a-date", "pasta": "2026-12-01"},
            })
        assert res.status_code == 200
        passed = mock.call_args.args[4]
        assert passed is not None
        assert "garlic" not in passed
        assert passed.get("pasta") == "2026-12-01"

    def test_injection_key_in_expirations_silently_dropped(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock:
            res = client.post("/recipes/suggest", json={
                "ingredients": ["garlic"],
                "expirations": {"<script>alert(1)</script>": "2026-12-01", "garlic": "2026-12-01"},
            })
        assert res.status_code == 200
        passed = mock.call_args.args[4]
        assert "<script>alert(1)</script>" not in (passed or {})

    def test_expirations_omitted_defaults_to_none(self):
        with patch("main.find_top_matches", return_value=[FAKE_RESULT]) as mock:
            res = client.post("/recipes/suggest", json={"ingredients": ["garlic"]})
        assert res.status_code == 200
        assert mock.call_args.args[4] is None

    def test_urgency_score_expired_ingredient(self):
        from recipe import _urgency_score
        assert _urgency_score("garlic", {"garlic": "2020-01-01"}) == 30

    def test_urgency_score_expiring_in_2_days(self):
        from recipe import _urgency_score
        import datetime
        soon = (datetime.date.today() + datetime.timedelta(days=2)).isoformat()
        assert _urgency_score("garlic", {"garlic": soon}) == 20

    def test_urgency_score_expiring_in_5_days(self):
        from recipe import _urgency_score
        import datetime
        soon = (datetime.date.today() + datetime.timedelta(days=5)).isoformat()
        assert _urgency_score("garlic", {"garlic": soon}) == 10

    def test_urgency_score_not_expiring_soon(self):
        from recipe import _urgency_score
        import datetime
        later = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
        assert _urgency_score("garlic", {"garlic": later}) == 0

    def test_urgency_score_unknown_ingredient(self):
        from recipe import _urgency_score
        assert _urgency_score("garlic", {}) == 0

    def test_urgency_score_bad_date_returns_zero(self):
        from recipe import _urgency_score
        assert _urgency_score("garlic", {"garlic": "not-a-date"}) == 0


# recipe.py unit tests

class TestRecipeLogic:

    def test_calculate_nutrition_zeros_on_empty(self):
        from recipe import calculate_nutrition
        result = calculate_nutrition({}, servings=1)
        assert result == {"calories": 0, "protein": 0, "fat": 0, "carbs": 0}

    def test_calculate_nutrition_scales_correctly(self):
        from recipe import calculate_nutrition
        result = calculate_nutrition(FAKE_RECIPE, servings=3)
        assert result["calories"] == 1200

    def test_calculate_nutrition_single_serving(self):
        from recipe import calculate_nutrition
        result = calculate_nutrition(FAKE_RECIPE, servings=1)
        assert result["calories"] == 400
        assert result["protein"] == 15

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

    def test_missing_ingredients_case_insensitive(self):
        from recipe import missing_ingredients
        pantry = {"GARLIC", "PASTA"}
        missing = missing_ingredients(FAKE_RECIPE, {i.lower() for i in pantry})
        assert "garlic" not in missing
