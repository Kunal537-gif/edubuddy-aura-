import sys
from pathlib import Path

# Add project root to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from backend.database import (
    init_db,
    get_user_stats,
    get_user_profile,
    update_user_profile,
    save_quiz_result,
    create_saved_note,
    get_all_saved_notes,
    get_saved_note_by_id,
    delete_saved_note_by_id,
)
from backend.seed_data import seed_initial_data
from backend.ai_engine import (
    generate_ai_simplification,
    generate_tutor_response,
    summarize_student_notes,
)
from backend.models import QuizSubmitRequest, TutorChatRequest

def run_tests():
    print("=" * 60)
    print("EduBuddy Aura Comprehensive Verification Suite")
    print("=" * 60)

    # 1. Database & Stats
    print("\n[1] Testing database initialization & real metrics tracking...")
    init_db()
    seed_initial_data()
    stats = get_user_stats()
    assert "user" in stats, "Missing user in stats"
    assert "mastered_count" in stats, "Missing mastered_count in stats"
    assert "weak_areas" in stats, "Missing weak_areas in stats"
    assert stats["user"]["xp"] >= 350, "User XP check failed"
    print(f"  ✓ Database initialized. User XP: {stats['user']['xp']}, Mastered: {stats['mastered_count']}, Badges: {len(stats['badges'])}")

    # 2. Profile Management
    print("\n[2] Testing Profile feature (get and update)...")
    prof = get_user_profile()
    assert "name" in prof, "Profile name missing"
    updated = update_user_profile(
        name="Alex Mercer",
        avatar="🚀",
        major="Computer Science & AI",
        learning_style="Visual & Intuitive",
        daily_goal_minutes=50,
        bio="Mastering neural transformers and quantum gates."
    )
    assert updated["name"] == "Alex Mercer", "Profile update failed"
    assert updated["avatar"] == "🚀", "Avatar update failed"
    assert updated["daily_goal_minutes"] == 50, "Daily goal update failed"
    print(f"  ✓ Profile updated: Name={updated['name']}, Major={updated['major']}, Goal={updated['daily_goal_minutes']}m")

    # 3. AI Simplifier Curated
    print("\n[3] Testing AI Concept Simplifier with curated topic (Dynamic Programming)...")
    res1 = generate_ai_simplification("Dynamic Programming")
    assert "blackboard" in res1.eli5_summary.lower() or "remember" in res1.eli5_summary.lower()
    assert len(res1.latex_formulas) > 0
    print(f"  ✓ Curated topic verified: Formulas={len(res1.latex_formulas)}, Analogy length={len(res1.relatable_analogy)}")

    # 4. AI Simplifier Custom Topic
    print("\n[4] Testing AI Concept Simplifier with custom topic (Quantum Computing Qubits)...")
    res2 = generate_ai_simplification("Quantum Computing Qubits")
    assert len(res2.step_by_step_breakdown) >= 3
    print(f"  ✓ Custom topic verified: Steps={len(res2.step_by_step_breakdown)}, Inferred subject={res2.subject}")

    # 5. Socratic Tutor with Personas & Context-Awareness
    print("\n[5] Testing Context-Aware Socratic Tutor with multiple personas...")
    
    # Mode: Socratic with Student Profile & Weak Areas Context
    tutor_socratic = generate_tutor_response(
        "Why is Dynamic Programming faster than brute force recursion?",
        topic="Dynamic Programming",
        mode="socratic",
        student_profile={"major": "Computer Science & AI", "learning_style": "Visual & Intuitive"},
        weak_areas=["Overlapping subproblems"]
    )
    assert len(tutor_socratic.reply) > 20
    assert tutor_socratic.guiding_question is not None
    assert tutor_socratic.hint is not None
    print(f"  ✓ Socratic Persona: Question='{tutor_socratic.guiding_question[:50]}...', Hint='{tutor_socratic.hint[:40]}...'")

    # Mode: Drill Sergeant with Interactive Challenge Widget
    tutor_drill = generate_tutor_response(
        "Drill me on attention mechanisms",
        topic="Attention Mechanism in Transformers",
        mode="drill_sergeant"
    )
    assert tutor_drill.interactive_challenge is not None, "Interactive challenge widget missing"
    assert len(tutor_drill.interactive_challenge.options) >= 2
    print(f"  ✓ Drill Sergeant: In-chat challenge generated with {len(tutor_drill.interactive_challenge.options)} options. Correct={tutor_drill.interactive_challenge.correct_index}")

    # Mode: Code & Math with LaTeX
    tutor_math = generate_tutor_response("Show me the recurrence proof", topic="Merge Sort", mode="code_math")
    assert tutor_math.formula is not None
    print(f"  ✓ Code & Math: Formula rendered: {tutor_math.formula}")

    # 6. Quiz Results Connected to Personalized Remediation
    print("\n[6] Testing Quiz Submission & Personalized Remediation...")
    # Simulate a quiz where question 0 was wrong
    quiz_res = save_quiz_result(
        topic="Dynamic Programming",
        subject="Computer Science",
        score=1,
        total=2,
        xp_earned=55,
        missed_questions=["Overlapping subproblems in memoization"]
    )
    assert "review_action_plan" in quiz_res, "Missing review_action_plan"
    assert "suggested_tutor_prompt" in quiz_res, "Missing suggested_tutor_prompt"
    assert "weak_concepts" in quiz_res, "Missing weak_concepts"
    print(f"  ✓ Quiz Remediation verified: Score={quiz_res['score']}/{quiz_res['total']} ({quiz_res['percentage']}%), Weak concepts={quiz_res['weak_concepts']}")
    print(f"    Action Plan: {quiz_res['review_action_plan']}")
    print(f"    Suggested Tutor Prompt: {quiz_res['suggested_tutor_prompt']}")

    # 7. Smart Notes Summarizer & Persistent SQLite Library CRUD
    print("\n[7] Testing Smart Notes Summarizer & SQLite Library CRUD...")
    sample_notes = """
    In this lecture on Algorithm Analysis, we discussed Big-O notation and Time Complexity.
    An algorithm's asymptotic behavior defines how its runtime scales with input size N.
    Merge Sort operates by recursively dividing the list into halves and merging them in linear time.
    Hence, its recurrence relation is T(N) = 2T(N/2) + O(N), which solves to O(N log N) via Master Theorem.
    """
    notes_res = summarize_student_notes(sample_notes, title="CS101: Big-O & Merge Sort")
    assert len(notes_res.key_takeaways) > 0
    assert len(notes_res.cheatsheet_formulas) > 0
    print(f"  ✓ Notes summarizer generated: {len(notes_res.key_takeaways)} takeaways, {len(notes_res.cheatsheet_formulas)} formulas, {len(notes_res.glossary)} glossary terms.")

    # Test saving note to SQLite
    saved_note = create_saved_note(
        title="CS101: Big-O & Merge Sort",
        original_content=sample_notes,
        executive_summary=notes_res.executive_summary,
        key_takeaways=notes_res.key_takeaways,
        cheatsheet_formulas=notes_res.cheatsheet_formulas,
        glossary=[g.model_dump() if hasattr(g, 'model_dump') else g for g in notes_res.glossary],
        topic="Computer Science"
    )
    note_id = saved_note["id"]
    assert note_id > 0, "Saved note ID invalid"
    print(f"  ✓ Note saved to SQLite library with ID: {note_id}")

    # Test retrieving note list
    all_notes = get_all_saved_notes()
    assert len(all_notes) > 0, "Notes library is empty"
    print(f"  ✓ Library list retrieved: {len(all_notes)} note(s) in database.")

    # Test retrieving note detail by ID
    fetched_note = get_saved_note_by_id(note_id)
    assert fetched_note["title"] == "CS101: Big-O & Merge Sort", "Fetched note title mismatch"
    assert len(fetched_note["cheatsheet_formulas"]) > 0, "Fetched note missing formulas"
    print(f"  ✓ Note detail fetched successfully by ID: Title='{fetched_note['title']}'")

    # Test note deletion
    del_ok = delete_saved_note_by_id(note_id)
    assert del_ok is True, "Delete note returned False"
    verify_del = get_saved_note_by_id(note_id)
    assert verify_del is None, "Note was not deleted properly"
    print(f"  ✓ Note deletion verified: ID {note_id} successfully removed.")

    # 8. Gemini API Settings & Provider Integration
    print("\n[8] Testing Gemini API Provider Settings & Validation...")
    from backend.ai_engine import test_gemini_key
    from backend.database import get_setting, set_setting
    
    # Test invalid key verification fails gracefully
    invalid_test = test_gemini_key("INVALID_KEY_12345")
    assert invalid_test["success"] is False, "Invalid API key test should have failed"
    print(f"  ✓ Gemini key validator verified: Successfully rejected invalid key ({invalid_test['error'][:50]}...)")

    # Test settings persistence in SQLite
    set_setting("gemini_model", "gemini-3.8-flash")
    saved_model = get_setting("gemini_model")
    assert saved_model == "gemini-3.8-flash", "Model setting persistence failed"
    print(f"  ✓ Gemini settings persistence in SQLite verified: Model={saved_model}")

    print("\n" + "=" * 60)
    print("ALL 9 REQUIREMENT VALIDATIONS PASSED WITH ZERO ERRORS!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
