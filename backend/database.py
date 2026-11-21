import sqlite3
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from backend.config import DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # User profile & stats
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY,
        name TEXT DEFAULT 'Alex Mercer',
        avatar TEXT DEFAULT '🎓',
        major TEXT DEFAULT 'Computer Science & AI',
        learning_style TEXT DEFAULT 'Visual & Intuitive',
        daily_goal_minutes INTEGER DEFAULT 45,
        bio TEXT DEFAULT 'Mastering difficult concepts through first principles.',
        xp INTEGER DEFAULT 350,
        level INTEGER DEFAULT 3,
        streak_days INTEGER DEFAULT 4,
        last_active_date TEXT,
        total_study_minutes INTEGER DEFAULT 185,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Migration check for new profile columns if existing DB
    cursor.execute("PRAGMA table_info(user_profile)")
    existing_cols = [row["name"] for row in cursor.fetchall()]
    if "avatar" not in existing_cols:
        cursor.execute("ALTER TABLE user_profile ADD COLUMN avatar TEXT DEFAULT '🎓'")
    if "major" not in existing_cols:
        cursor.execute("ALTER TABLE user_profile ADD COLUMN major TEXT DEFAULT 'Computer Science & AI'")
    if "learning_style" not in existing_cols:
        cursor.execute("ALTER TABLE user_profile ADD COLUMN learning_style TEXT DEFAULT 'Visual & Intuitive'")
    if "daily_goal_minutes" not in existing_cols:
        cursor.execute("ALTER TABLE user_profile ADD COLUMN daily_goal_minutes INTEGER DEFAULT 45")
    if "bio" not in existing_cols:
        cursor.execute("ALTER TABLE user_profile ADD COLUMN bio TEXT DEFAULT 'Mastering difficult concepts through first principles.'")

    # Concept Mastery Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS concept_mastery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT UNIQUE NOT NULL,
        subject TEXT NOT NULL,
        mastery_percent INTEGER DEFAULT 20,
        times_reviewed INTEGER DEFAULT 1,
        last_reviewed_at TEXT,
        difficulty_rating TEXT DEFAULT 'medium',
        notes TEXT
    )
    """)

    # Flashcards Table (Spaced Repetition with SM-2)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS flashcards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        subject TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        mnemonic TEXT,
        repetition INTEGER DEFAULT 0,
        interval_days INTEGER DEFAULT 1,
        ease_factor REAL DEFAULT 2.5,
        next_review_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Quiz History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        subject TEXT NOT NULL,
        score INTEGER NOT NULL,
        total INTEGER NOT NULL,
        percentage REAL NOT NULL,
        xp_awarded INTEGER NOT NULL,
        taken_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Saved Smart Notes
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        raw_content TEXT NOT NULL,
        summary TEXT NOT NULL,
        key_takeaways TEXT,
        glossary TEXT,
        cheatsheet_formulas TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Migration check for saved_notes columns
    cursor.execute("PRAGMA table_info(saved_notes)")
    notes_cols = [row["name"] for row in cursor.fetchall()]
    if "cheatsheet_formulas" not in notes_cols:
        cursor.execute("ALTER TABLE saved_notes ADD COLUMN cheatsheet_formulas TEXT")

    # Badges earned
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        badge_key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        unlocked_at TEXT
    )
    """)

    # App Settings (for persistent Gemini API key and model config)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # Insert initial user profile if missing
    cursor.execute("SELECT id FROM user_profile WHERE id = 1")
    if not cursor.fetchone():
        today_str = date.today().isoformat()
        cursor.execute("""
        INSERT INTO user_profile (id, name, xp, level, streak_days, last_active_date, total_study_minutes)
        VALUES (1, 'Alex Mercer', 420, 3, 5, ?, 210)
        """, (today_str,))

    # Insert default badges if missing
    default_badges = [
        ("first_concept", "Curious Mind", "Simplified your first difficult concept", "🧠", datetime.now().isoformat()),
        ("analogy_explorer", "Analogy Master", "Explored concept analogies across 3 subjects", "🧩", datetime.now().isoformat()),
        ("quiz_whiz", "Quiz Champion", "Scored 100% on any conceptual quiz", "🏆", datetime.now().isoformat()),
        ("streak_5", "Consistency King", "Maintained a 5-day continuous learning streak", "🔥", datetime.now().isoformat()),
        ("socratic_thinker", "Socratic Scholar", "Asked deep questions to the AI Tutor", "🎓", datetime.now().isoformat()),
        ("visual_learner", "Visualizer", "Explored interactive simulations & diagrams", "👁️", datetime.now().isoformat())
    ]

    for b_key, b_name, b_desc, b_icon, b_time in default_badges:
        cursor.execute("""
        INSERT OR IGNORE INTO badges (badge_key, name, description, icon, unlocked_at)
        VALUES (?, ?, ?, ?, ?)
        """, (b_key, b_name, b_desc, b_icon, b_time))

    conn.commit()
    conn.close()

    # Sync Gemini credentials from persisted database settings on boot
    try:
        import backend.config as app_config
        saved_key = get_setting("gemini_api_key")
        saved_model = get_setting("gemini_model")
        
        if not saved_key:
            set_setting("gemini_api_key", app_config.DEFAULT_GEMINI_KEY)
            saved_key = app_config.DEFAULT_GEMINI_KEY
        if not saved_model or saved_model == "gemini-2.0-flash":
            set_setting("gemini_model", app_config.DEFAULT_GEMINI_MODEL)
            saved_model = app_config.DEFAULT_GEMINI_MODEL

        app_config.set_gemini_credentials(saved_key, saved_model)
    except Exception:
        pass

# Database Helper Functions
def get_user_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    user = dict(cursor.fetchone() or {})
    
    # Calculate streak validity
    today_str = date.today().isoformat()
    last_active = user.get("last_active_date")
    if last_active:
        last_d = date.fromisoformat(last_active)
        diff = (date.today() - last_d).days
        if diff > 1:
            # streak broken
            user["streak_days"] = 1
            cursor.execute("UPDATE user_profile SET streak_days = 1, last_active_date = ? WHERE id = 1", (today_str,))
            conn.commit()

    # Get subject mastery aggregations
    cursor.execute("""
    SELECT subject, AVG(mastery_percent) as avg_mastery, COUNT(*) as count 
    FROM concept_mastery 
    GROUP BY subject
    """)
    subject_mastery = [{"subject": row["subject"], "avg_mastery": round(row["avg_mastery"], 1), "count": row["count"]} for row in cursor.fetchall()]

    # Get recently reviewed concepts
    cursor.execute("SELECT * FROM concept_mastery ORDER BY last_reviewed_at DESC LIMIT 6")
    recent_concepts = [dict(row) for row in cursor.fetchall()]

    # Get unlocked badges
    cursor.execute("SELECT * FROM badges WHERE unlocked_at IS NOT NULL")
    badges = [dict(row) for row in cursor.fetchall()]

    # Flashcards count due today
    cursor.execute("SELECT COUNT(*) as due_count FROM flashcards WHERE next_review_date <= ?", (today_str,))
    due_flashcards = cursor.fetchone()["due_count"]

    # Real Mastered vs Learning count
    cursor.execute("SELECT COUNT(*) as c FROM concept_mastery WHERE mastery_percent >= 70")
    mastered_count = cursor.fetchone()["c"]

    cursor.execute("SELECT COUNT(*) as c FROM concept_mastery WHERE mastery_percent < 70")
    learning_count = cursor.fetchone()["c"]

    # Real Weak Areas (concepts with lowest mastery or recent difficulty)
    cursor.execute("SELECT topic, subject, mastery_percent FROM concept_mastery WHERE mastery_percent < 70 ORDER BY mastery_percent ASC LIMIT 4")
    weak_areas = [dict(row) for row in cursor.fetchall()]

    # Real Recent Quizzes
    cursor.execute("SELECT topic, subject, score, total, percentage, taken_at FROM quiz_history ORDER BY taken_at DESC LIMIT 5")
    recent_quizzes = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "user": user,
        "subject_mastery": subject_mastery,
        "recent_concepts": recent_concepts,
        "badges": badges,
        "due_flashcards": due_flashcards,
        "mastered_count": mastered_count,
        "learning_count": learning_count,
        "weak_areas": weak_areas,
        "recent_quizzes": recent_quizzes
    }

def get_user_profile() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM user_profile WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}

def update_user_profile(
    name: str = None, 
    avatar: str = None, 
    major: str = None, 
    learning_style: str = None, 
    daily_goal_minutes: int = None, 
    bio: str = None
) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    current = get_user_profile()
    new_name = name if name is not None else current.get("name", "Alex Mercer")
    new_avatar = avatar if avatar is not None else current.get("avatar", "🎓")
    new_major = major if major is not None else current.get("major", "Computer Science & AI")
    new_style = learning_style if learning_style is not None else current.get("learning_style", "Visual & Intuitive")
    new_goal = daily_goal_minutes if daily_goal_minutes is not None else current.get("daily_goal_minutes", 45)
    new_bio = bio if bio is not None else current.get("bio", "Mastering difficult concepts through first principles.")

    cursor.execute("""
    UPDATE user_profile 
    SET name = ?, avatar = ?, major = ?, learning_style = ?, daily_goal_minutes = ?, bio = ?
    WHERE id = 1
    """, (new_name, new_avatar, new_major, new_style, new_goal, new_bio))
    conn.commit()
    conn.close()
    return get_user_profile()

def record_activity(topic: str, subject: str, minutes: int, xp_add: int, mastery_delta: int = 5):
    conn = get_connection()
    cursor = conn.cursor()
    today_str = date.today().isoformat()
    now_str = datetime.now().isoformat()

    # Update user XP & study minutes
    cursor.execute("""
    UPDATE user_profile 
    SET xp = xp + ?, 
        total_study_minutes = total_study_minutes + ?,
        last_active_date = ?,
        level = 1 + ((xp + ?) / 250)
    WHERE id = 1
    """, (xp_add, minutes, today_str, xp_add))

    # Update or insert concept mastery
    cursor.execute("SELECT mastery_percent, times_reviewed FROM concept_mastery WHERE topic = ?", (topic,))
    existing = cursor.fetchone()
    if existing:
        new_mastery = min(100, existing["mastery_percent"] + mastery_delta)
        cursor.execute("""
        UPDATE concept_mastery 
        SET mastery_percent = ?, times_reviewed = times_reviewed + 1, last_reviewed_at = ?
        WHERE topic = ?
        """, (new_mastery, now_str, topic))
    else:
        cursor.execute("""
        INSERT INTO concept_mastery (topic, subject, mastery_percent, times_reviewed, last_reviewed_at)
        VALUES (?, ?, ?, 1, ?)
        """, (topic, subject, min(100, 20 + mastery_delta), now_str))

    conn.commit()
    conn.close()

def save_quiz_result(topic: str, subject: str, score: int, total: int, xp_earned: int, missed_questions: Optional[List[str]] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    pct = round((score / max(1, total)) * 100, 1)
    cursor.execute("""
    INSERT INTO quiz_history (topic, subject, score, total, percentage, xp_awarded)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (topic, subject, score, total, pct, xp_earned))

    # Add XP to user
    cursor.execute("UPDATE user_profile SET xp = xp + ? WHERE id = 1", (xp_earned,))

    # Real calibrated mastery impact based on performance
    now_str = datetime.now().isoformat()
    if pct >= 80:
        mastery_delta = 15
    elif pct >= 50:
        mastery_delta = 8
    else:
        mastery_delta = -6 # Drop mastery when struggling so student gets alert to review!

    cursor.execute("SELECT mastery_percent, times_reviewed FROM concept_mastery WHERE topic = ?", (topic,))
    existing = cursor.fetchone()
    if existing:
        new_mastery = max(5, min(100, existing["mastery_percent"] + mastery_delta))
        cursor.execute("""
        UPDATE concept_mastery 
        SET mastery_percent = ?, times_reviewed = times_reviewed + 1, last_reviewed_at = ?
        WHERE topic = ?
        """, (new_mastery, now_str, topic))
    else:
        cursor.execute("""
        INSERT INTO concept_mastery (topic, subject, mastery_percent, times_reviewed, last_reviewed_at)
        VALUES (?, ?, ?, 1, ?)
        """, (topic, subject, max(10, 30 + mastery_delta), now_str))

    conn.commit()
    conn.close()

    # Formulate personalized remediation recommendation
    if pct == 100:
        action_plan = f"Mastery confirmed for {topic}! You're ready to proceed to advanced prerequisite derivations."
        tutor_prompt = f"I aced my quiz on {topic}! What is the most mind-bending advanced theorem built on top of this?"
    elif pct >= 60:
        action_plan = f"Solid progress in {topic}, but some subtle edge cases slipped through. Review base case invariants."
        tutor_prompt = f"I scored {score}/{total} in {topic}. Can you test me on the tricky edge cases where students stumble?"
    else:
        action_plan = f"Identified cognitive gap in {topic}. Recommendation: Engage in an interactive first-principles breakdown with the Socratic AI Tutor."
        tutor_prompt = f"I struggled on my {topic} quiz ({score}/{total}). Could we take it step-by-step from first principles using an analogy?"

    return {
        "topic": topic,
        "topic_name": topic,
        "subject": subject,
        "score": score,
        "total": total,
        "percentage": pct,
        "missed_questions": missed_questions or [],
        "weak_concepts": missed_questions or ["Foundational principles"],
        "action_plan": action_plan,
        "review_action_plan": action_plan,
        "recommended_tutor_prompt": tutor_prompt,
        "suggested_tutor_prompt": tutor_prompt,
        "recommended_flashcard_topic": topic
    }

def add_flashcard(topic: str, subject: str, front: str, back: str, mnemonic: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor()
    today_str = date.today().isoformat()
    cursor.execute("""
    INSERT INTO flashcards (topic, subject, front, back, mnemonic, next_review_date)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (topic, subject, front, back, mnemonic, today_str))
    conn.commit()
    conn.close()

def get_due_flashcards(subject: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    today_str = date.today().isoformat()
    if subject and subject.lower() != "all":
        cursor.execute("SELECT * FROM flashcards WHERE next_review_date <= ? AND subject = ?", (today_str, subject))
    else:
        cursor.execute("SELECT * FROM flashcards WHERE next_review_date <= ?", (today_str,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def review_flashcard_sm2(card_id: int, quality: int):
    """
    SuperMemo SM-2 algorithm:
    quality: 0-5 (0: complete blackout, 3: pass with effort, 5: perfect recall)
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT repetition, interval_days, ease_factor FROM flashcards WHERE id = ?", (card_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return

    rep = row["repetition"]
    interval = row["interval_days"]
    ef = row["ease_factor"]

    if quality >= 3:
        if rep == 0:
            interval = 1
        elif rep == 1:
            interval = 6
        else:
            interval = int(interval * ef)
        rep += 1
    else:
        rep = 0
        interval = 1

    # Update ease factor
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if ef < 1.3:
        ef = 1.3

    next_date = (date.today() + timedelta(days=interval)).isoformat()
    cursor.execute("""
    UPDATE flashcards 
    SET repetition = ?, interval_days = ?, ease_factor = ?, next_review_date = ?
    WHERE id = ?
    """, (rep, interval, ef, next_date, card_id))
    
    # Award XP for review
    cursor.execute("UPDATE user_profile SET xp = xp + 15 WHERE id = 1")
    conn.commit()
    conn.close()

# Saved Notes Persistence Helpers
def create_saved_note(title: str, raw_content: str = "", summary: str = "", key_takeaways: list = None, glossary: list = None, cheatsheet_formulas: list = None, **kwargs) -> dict:
    conn = get_connection()
    cursor = conn.cursor()
    actual_content = raw_content or kwargs.get("original_content", "")
    actual_summary = summary or kwargs.get("executive_summary", "")
    takeaways_json = json.dumps(key_takeaways or [])
    glossary_json = json.dumps(glossary or [])
    formulas_json = json.dumps(cheatsheet_formulas or [])
    cursor.execute("""
    INSERT INTO saved_notes (title, raw_content, summary, key_takeaways, glossary, cheatsheet_formulas)
    VALUES (?, ?, ?, ?, ?, ?)
    """, (title, actual_content, actual_summary, takeaways_json, glossary_json, formulas_json))
    note_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM saved_notes WHERE id = ?", (note_id,))
    row = dict(cursor.fetchone())
    conn.close()
    row["key_takeaways"] = json.loads(row.get("key_takeaways") or "[]")
    row["glossary"] = json.loads(row.get("glossary") or "[]")
    row["cheatsheet_formulas"] = json.loads(row.get("cheatsheet_formulas") or "[]")
    return row

def get_all_saved_notes() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, summary, raw_content, key_takeaways, created_at FROM saved_notes ORDER BY created_at DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    result = []
    for r in rows:
        takeaways = json.loads(r.get("key_takeaways") or "[]")
        topic_name = r["title"].split(":")[1].strip() if ":" in r["title"] else "STEM"
        result.append({
            "id": r["id"],
            "title": r["title"],
            "summary": r["summary"],
            "executive_summary": r["summary"],
            "topic": topic_name,
            "created_at": r["created_at"],
            "takeaways_count": len(takeaways),
            "word_count": len(r["raw_content"].split()) if r.get("raw_content") else 0
        })
    return result

def get_saved_note_by_id(note_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM saved_notes WHERE id = ?", (note_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    r = dict(row)
    r["key_takeaways"] = json.loads(r.get("key_takeaways") or "[]")
    r["glossary"] = json.loads(r.get("glossary") or "[]")
    r["cheatsheet_formulas"] = json.loads(r.get("cheatsheet_formulas") or "[]")
    r["executive_summary"] = r.get("summary", "")
    r["topic"] = r["title"].split(":")[1].strip() if ":" in r["title"] else "STEM"
    return r

def delete_saved_note_by_id(note_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM saved_notes WHERE id = ?", (note_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# Application Settings Persistence (Gemini API Key, Active Model)
def get_setting(key: str, default: str = "") -> str:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM app_settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    if row and row["value"]:
        return row["value"]
    return default

def set_setting(key: str, value: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO app_settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
    """, (key, value))
    conn.commit()
    conn.close()
