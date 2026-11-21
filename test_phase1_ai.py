import os
import sys
from unittest.mock import patch, Mock

sys.path.insert(0, os.path.dirname(__file__))
from backend import ai_engine


def test_curated_exact_topic_uses_knowledge_base():
    result = ai_engine.generate_ai_simplification("Dynamic Programming")
    assert result.topic == "Dynamic Programming"
    assert "remember" in result.eli5_summary.lower()
    assert len(result.quick_quiz) >= 1


def test_unknown_topic_requires_gemini_key():
    old_key = ai_engine.GEMINI_API_KEY
    try:
        ai_engine.GEMINI_API_KEY = ""
        try:
            ai_engine.generate_ai_simplification("Photosynthesis")
            raise AssertionError("Expected missing-key RuntimeError")
        except RuntimeError as exc:
            assert "GEMINI_API_KEY" in str(exc)
    finally:
        ai_engine.GEMINI_API_KEY = old_key


def test_unknown_topic_calls_gemini_and_validates_response():
    payload = {
        "topic": "Photosynthesis", "subject": "Biology",
        "eli5_summary": "Plants use light energy to make sugars from carbon dioxide and water.",
        "relatable_analogy": "A plant is like a tiny solar-powered food factory.",
        "key_intuition": "Light energy is converted into chemical energy.",
        "step_by_step_breakdown": [{"step": "Capture light", "detail": "Chlorophyll absorbs light."}],
        "technical_depth": "Photosynthesis converts light energy into chemical energy stored in organic molecules.",
        "latex_formulas": [], "common_misconceptions": [],
        "visual_diagram_mermaid": None, "visual_diagram_description": None,
        "real_world_applications": ["Agriculture and ecosystem productivity"],
        "quick_quiz": [
            {"id": i, "question": f"Question {i}?", "options": ["A", "B", "C", "D"],
             "correct_index": 0, "explanation": "A is supported by the concept.", "difficulty": "easy"}
            for i in range(1, 4)
        ],
        "flashcards": [{"front": "What does photosynthesis do?", "back": "Stores light energy in chemical form.", "mnemonic": None}]
    }
    fake_response = Mock(ok=True)
    fake_response.json.return_value = {"candidates": [{"content": {"parts": [{"text": __import__('json').dumps(payload)}]}}]}
    old_key = ai_engine.GEMINI_API_KEY
    try:
        ai_engine.GEMINI_API_KEY = "test-key"
        with patch.object(ai_engine.requests, "post", return_value=fake_response) as post:
            result = ai_engine.generate_ai_simplification("Photosynthesis", "balanced", "Biology")
            assert result.topic == "Photosynthesis"
            assert result.subject == "Biology"
            assert len(result.quick_quiz) == 3
            assert post.call_args.kwargs["headers"]["x-goog-api-key"] == "test-key"
    finally:
        ai_engine.GEMINI_API_KEY = old_key


if __name__ == "__main__":
    test_curated_exact_topic_uses_knowledge_base()
    test_unknown_topic_requires_gemini_key()
    test_unknown_topic_calls_gemini_and_validates_response()
    print("Phase 1 tests passed.")
