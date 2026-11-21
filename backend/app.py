import os
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse

from backend.config import (
    APP_TITLE, APP_VERSION, APP_DESCRIPTION, 
    FRONTEND_DIR, HOST, PORT, set_gemini_credentials
)
from backend.database import (
    init_db, get_user_stats, record_activity, 
    save_quiz_result, add_flashcard, get_due_flashcards, 
    review_flashcard_sm2, get_user_profile, update_user_profile,
    create_saved_note, get_all_saved_notes, get_saved_note_by_id, delete_saved_note_by_id,
    get_setting, set_setting
)
from backend.seed_data import seed_initial_data, CURATED_TOPICS
from backend.ai_engine import (
    generate_ai_simplification, generate_tutor_response, 
    summarize_student_notes, test_gemini_key
)
from backend.models import (
    SimplifyRequest, SimplifyResponse, TutorChatRequest, 
    TutorChatResponse, QuizSubmitRequest, QuizSubmitResponse,
    NotesSummarizeRequest, NotesSummarizeResponse,
    UpdateProgressRequest, FlashcardReviewRequest, FlashcardItem,
    UserProfileUpdate, UserProfileResponse,
    SavedNoteCreate, SavedNoteResponse, SavedNoteListItem,
    GeminiSettingsUpdate, GeminiSettingsResponse
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database and seed high-yield concept data safely
    try:
        init_db()
        seed_initial_data()
        print("✓ EduBuddy Aura Backend initialized successfully!")
    except Exception as e:
        print(f"[Lifespan Warning] DB init: {e}")
    yield

app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description=APP_DESCRIPTION,
    lifespan=lifespan
)

# Enable CORS for local and sandboxed environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health & Status Endpoint
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": APP_TITLE,
        "version": APP_VERSION,
        "ai_status": "Active (Local Semantic Engine + Optional Gemini Fallback)"
    }

# Curated Topics Catalogue
@app.get("/api/topics")
def get_topics(category: Optional[str] = None):
    if category and category.lower() != "all":
        return [t for t in CURATED_TOPICS if t["category"].lower() == category.lower()]
    return CURATED_TOPICS

# Concept Simplification Endpoint (Multi-Tier Decomposition)
@app.post("/api/simplify", response_model=SimplifyResponse)
def simplify_concept(req: SimplifyRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")
    try:
        response = generate_ai_simplification(
            topic=req.topic, 
            depth=req.depth, 
            subject=req.subject
        )
        # Record this learning activity
        record_activity(
            topic=response.topic, 
            subject=response.subject, 
            minutes=3, 
            xp_add=25, 
            mastery_delta=8
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simplification error: {str(e)}")

# User Profile Endpoints
@app.get("/api/profile", response_model=UserProfileResponse)
def get_profile():
    profile = get_user_profile()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return profile

@app.post("/api/profile", response_model=UserProfileResponse)
def update_profile(req: UserProfileUpdate):
    updated = update_user_profile(
        name=req.name,
        avatar=req.avatar,
        major=req.major,
        learning_style=req.learning_style,
        daily_goal_minutes=req.daily_goal_minutes,
        bio=req.bio
    )
    return updated

# Gemini AI Provider Settings Endpoints
@app.get("/api/settings/gemini", response_model=GeminiSettingsResponse)
def get_gemini_settings():
    import backend.config as app_config
    key = app_config.GEMINI_API_KEY
    masked = f"{key[:6]}...{key[-4:]}" if len(key) >= 12 else ("Configured" if key else "")
    return GeminiSettingsResponse(
        is_configured=bool(key),
        masked_key=masked,
        model=app_config.GEMINI_MODEL,
        provider="Google Gemini API"
    )

@app.post("/api/settings/gemini")
def update_gemini_settings(req: GeminiSettingsUpdate):
    if not req.api_key.strip():
        raise HTTPException(status_code=400, detail="Gemini API Key cannot be empty.")
    
    clean_key = req.api_key.strip()
    model = (req.model or "gemini-3.8-flash").strip()
    
    # Verify the key with Gemini API
    test_result = test_gemini_key(clean_key, model)
    actual_model = test_result.get("model", model) if test_result.get("success") else model
    
    # Save to config & sqlite
    import backend.config as app_config
    app_config.set_gemini_credentials(clean_key, actual_model)
    set_setting("gemini_api_key", clean_key)
    set_setting("gemini_model", actual_model)

    # Also persist to .env
    try:
        env_path = app_config.BASE_DIR / ".env"
        lines = []
        if env_path.exists():
            lines = env_path.read_text(encoding="utf-8").splitlines()
        new_lines = [l for l in lines if not l.startswith("GEMINI_API_KEY=") and not l.startswith("GEMINI_MODEL=")]
        new_lines.append(f"GEMINI_API_KEY={clean_key}")
        new_lines.append(f"GEMINI_MODEL={actual_model}")
        env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    except Exception as e:
        print(f"Failed to update .env: {e}")

    return {
        "status": "success",
        "message": f"Successfully connected to Google Gemini ({actual_model})!",
        "model": actual_model
    }

@app.post("/api/settings/gemini/disconnect")
def disconnect_gemini():
    import backend.config as app_config
    app_config.set_gemini_credentials("", "gemini-3.8-flash")
    set_setting("gemini_api_key", "")
    try:
        env_path = app_config.BASE_DIR / ".env"
        if env_path.exists():
            lines = [l for l in env_path.read_text(encoding="utf-8").splitlines() if not l.startswith("GEMINI_API_KEY=")]
            env_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    except Exception:
        pass
    return {"status": "success", "message": "Switched to offline Socratic engine."}

# Socratic AI Tutor Chat (Context-Aware)
@app.post("/api/tutor/chat", response_model=TutorChatResponse)
def tutor_chat(req: TutorChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    try:
        profile = req.student_profile or get_user_profile()
        weak_areas = req.weak_areas
        if not weak_areas:
            stats = get_user_stats()
            weak_areas = [w["topic"] for w in stats.get("weak_areas", [])]

        response = generate_tutor_response(
            message=req.message,
            topic=req.topic or "General",
            mode=req.mode,
            difficulty=req.difficulty or "university",
            history=req.history,
            student_profile=profile,
            weak_areas=weak_areas
        )
        # Award small XP for engaging in intellectual dialogue
        record_activity(
            topic=req.topic or "Socratic Dialogue",
            subject="General",
            minutes=2,
            xp_add=15,
            mastery_delta=3
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor error: {str(e)}")

# Adaptive Quiz Generation & Submission (Connected to Personalized Teaching)
@app.post("/api/quiz/generate")
def generate_quiz(topic: str = Query(...), subject: str = Query("General")):
    simplification = generate_ai_simplification(topic=topic, subject=subject)
    return {
        "topic": simplification.topic,
        "subject": simplification.subject,
        "questions": simplification.quick_quiz
    }

@app.post("/api/quiz/submit", response_model=QuizSubmitResponse)
def submit_quiz(req: QuizSubmitRequest):
    simplification = generate_ai_simplification(topic=req.topic, subject=req.subject)
    questions_map = {q.id: q for q in simplification.quick_quiz}
    
    score = 0
    total = len(req.answers)
    feedback_list = []
    
    for ans in req.answers:
        q_id = ans.get("question_id")
        selected = ans.get("selected_index")
        question = questions_map.get(q_id)
        if question:
            is_correct = (selected == question.correct_index)
            if is_correct:
                score += 1
            feedback_list.append({
                "question_id": q_id,
                "question": question.question,
                "is_correct": is_correct,
                "selected_index": selected,
                "correct_index": question.correct_index,
                "explanation": question.explanation
            })

    pct = round((score / max(1, total)) * 100, 1)
    xp_earned = score * 30 + (50 if pct == 100 else 10)
    
    # Identify missed questions for personalized recovery
    missed = [f["question"] for f in feedback_list if not f.get("is_correct", False)]

    # Save to SQLite database and get recovery action plan
    remediation = save_quiz_result(
        topic=req.topic, 
        subject=req.subject, 
        score=score, 
        total=total, 
        xp_earned=xp_earned,
        missed_questions=missed
    )
    
    user_stats = get_user_stats()
    
    return QuizSubmitResponse(
        score=score,
        total=total,
        percentage=pct,
        xp_earned=xp_earned,
        feedback=feedback_list,
        streak=user_stats["user"].get("streak_days", 1),
        level_up=(pct >= 80),
        remediation=remediation
    )

# Spaced Repetition Flashcards Endpoints
@app.get("/api/flashcards")
def get_flashcards(subject: Optional[str] = None):
    return get_due_flashcards(subject)

@app.post("/api/flashcards/add")
def create_flashcard(card: FlashcardItem, topic: str = Query(...), subject: str = Query("General")):
    add_flashcard(
        topic=topic,
        subject=subject,
        front=card.front,
        back=card.back,
        mnemonic=card.mnemonic
    )
    return {"status": "success", "message": "Flashcard saved to study deck!"}

@app.post("/api/flashcards/review")
def review_flashcard(req: FlashcardReviewRequest):
    review_flashcard_sm2(req.card_id, req.quality)
    return {"status": "success", "message": "Review recorded with SM-2 spaced repetition"}

# Smart Notes Summarizer
@app.post("/api/notes/summarize", response_model=NotesSummarizeResponse)
def summarize_notes(req: NotesSummarizeRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Notes content cannot be empty.")
    result = summarize_student_notes(content=req.content, title=req.title or "Lecture Notes")
    # Auto-save generated flashcards into user's study deck
    if req.generate_flashcards:
        for fc in result.flashcards:
            add_flashcard(
                topic=req.title or "Smart Notes",
                subject="General Notes",
                front=fc.front,
                back=fc.back,
                mnemonic=fc.mnemonic
            )
    return result

# Saved Notes Persistence Endpoints
@app.get("/api/notes", response_model=List[SavedNoteListItem])
def list_notes():
    return get_all_saved_notes()

@app.post("/api/notes/save", response_model=SavedNoteResponse)
def save_note(note: SavedNoteCreate):
    if not note.title.strip() or not note.summary.strip():
        raise HTTPException(status_code=400, detail="Note title and summary cannot be empty.")
    return create_saved_note(
        title=note.title,
        raw_content=note.raw_content,
        summary=note.summary,
        key_takeaways=note.key_takeaways or [],
        glossary=note.glossary or [],
        cheatsheet_formulas=note.cheatsheet_formulas or []
    )

@app.get("/api/notes/{note_id}", response_model=SavedNoteResponse)
def get_note(note_id: int):
    n = get_saved_note_by_id(note_id)
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    return n

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int):
    success = delete_saved_note_by_id(note_id)
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"status": "success", "message": "Note deleted successfully"}

# Concept Map / Mind Map Knowledge Graph Endpoint
@app.get("/api/concept-map")
def get_concept_map(topic: Optional[str] = None):
    # Generates a dynamic interactive node-link graph structure for knowledge visualizer
    if topic and topic in KNOWLEDGE_BASE:
        kb = KNOWLEDGE_BASE[topic]
        nodes = [
            {"id": "core", "label": topic, "group": "core", "radius": 34, "color": "#3b82f6"},
            {"id": "intuition", "label": "Key Intuition", "group": "concept", "radius": 24, "color": "#10b981"},
            {"id": "analogy", "label": "Analogy", "group": "analogy", "radius": 22, "color": "#f59e0b"},
            {"id": "theory", "label": "Technical Foundation", "group": "theory", "radius": 26, "color": "#8b5cf6"},
            {"id": "app1", "label": kb["real_world_applications"][0] if kb["real_world_applications"] else "Practical App", "group": "app", "radius": 20, "color": "#ec4899"},
            {"id": "app2", "label": kb["real_world_applications"][1] if len(kb["real_world_applications"]) > 1 else "Industry Usage", "group": "app", "radius": 20, "color": "#ec4899"}
        ]
        links = [
            {"source": "core", "target": "intuition", "relation": "explains"},
            {"source": "core", "target": "analogy", "relation": "metaphor"},
            {"source": "core", "target": "theory", "relation": "formalizes"},
            {"source": "core", "target": "app1", "relation": "powers"},
            {"source": "core", "target": "app2", "relation": "enables"}
        ]
        return {"nodes": nodes, "links": links, "topic": topic}
    
    # Global Knowledge Constellation of all subjects
    nodes = [
        {"id": "cs", "label": "Computer Science", "group": "domain", "radius": 36, "color": "#3b82f6"},
        {"id": "dp", "label": "Dynamic Programming", "group": "topic", "radius": 26, "color": "#60a5fa"},
        {"id": "trans", "label": "Transformers & Attention", "group": "topic", "radius": 26, "color": "#60a5fa"},
        
        {"id": "phys", "label": "Physics", "group": "domain", "radius": 36, "color": "#8b5cf6"},
        {"id": "quant", "label": "Quantum Superposition", "group": "topic", "radius": 26, "color": "#a78bfa"},
        {"id": "relat", "label": "Special Relativity", "group": "topic", "radius": 24, "color": "#a78bfa"},

        {"id": "math", "label": "Mathematics", "group": "domain", "radius": 36, "color": "#10b981"},
        {"id": "four", "label": "Fourier Transform", "group": "topic", "radius": 26, "color": "#34d399"},
        {"id": "bayes", "label": "Bayes' Theorem", "group": "topic", "radius": 24, "color": "#34d399"},

        {"id": "bio", "label": "Biology", "group": "domain", "radius": 36, "color": "#f59e0b"},
        {"id": "crispr", "label": "CRISPR-Cas9 Editing", "group": "topic", "radius": 26, "color": "#fbbf24"},

        {"id": "econ", "label": "Economics", "group": "domain", "radius": 36, "color": "#ec4899"},
        {"id": "sd", "label": "Supply & Demand", "group": "topic", "radius": 26, "color": "#f472b6"}
    ]
    links = [
        {"source": "cs", "target": "dp", "relation": "contains"},
        {"source": "cs", "target": "trans", "relation": "contains"},
        {"source": "phys", "target": "quant", "relation": "contains"},
        {"source": "phys", "target": "relat", "relation": "contains"},
        {"source": "math", "target": "four", "relation": "contains"},
        {"source": "math", "target": "bayes", "relation": "contains"},
        {"source": "bio", "target": "crispr", "relation": "contains"},
        {"source": "econ", "target": "sd", "relation": "contains"},
        # Cross-disciplinary synergies!
        {"source": "four", "target": "quant", "relation": "wave-mechanics"},
        {"source": "bayes", "target": "trans", "relation": "probabilistic-inference"},
        {"source": "dp", "target": "crispr", "relation": "sequence-alignment"}
    ]
    return {"nodes": nodes, "links": links, "topic": "Global Knowledge Map"}

# User Dashboard Stats & Analytics
@app.get("/api/stats")
def get_stats():
    return get_user_stats()

@app.post("/api/activity")
def log_activity(req: UpdateProgressRequest):
    record_activity(
        topic=req.topic,
        subject=req.subject,
        minutes=max(1, req.time_spent_seconds // 60),
        xp_add=req.mastery_delta * 2,
        mastery_delta=req.mastery_delta
    )
    return {"status": "success", "message": "Activity recorded"}

# Serve Frontend Static Assets
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    def serve_index():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
        return HTMLResponse(content="<h1>EduBuddy Aura is loading...</h1>")
