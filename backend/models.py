from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Concept Simplification Models
class SimplifyRequest(BaseModel):
    topic: str = Field(..., description="The concept or topic to simplify")
    depth: str = Field("balanced", description="Target depth: 'eli5', 'balanced', 'deep_dive', 'academic'")
    subject: Optional[str] = Field("General", description="Subject domain, e.g. CS, Physics, Math, Biology")

class FlashcardItem(BaseModel):
    front: str
    back: str
    mnemonic: Optional[str] = None

class QuizQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    correct_index: int
    explanation: str
    difficulty: str = "medium"

class SimplifyResponse(BaseModel):
    topic: str
    subject: str
    eli5_summary: str
    relatable_analogy: str
    key_intuition: str
    step_by_step_breakdown: List[Dict[str, str]]
    technical_depth: str
    latex_formulas: List[str]
    common_misconceptions: List[Dict[str, str]]
    visual_diagram_mermaid: Optional[str] = None
    visual_diagram_description: Optional[str] = None
    real_world_applications: List[str]
    quick_quiz: List[QuizQuestion]
    flashcards: List[FlashcardItem]

# Socratic Tutor Models
class TutorMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class TutorInteractiveChallenge(BaseModel):
    question: str
    options: List[str]
    correct_index: int
    explanation: str

class TutorChatRequest(BaseModel):
    message: str
    topic: Optional[str] = "General Concept"
    mode: str = Field("socratic", description="'socratic', 'eli5_buddy', 'drill_sergeant', 'exam_prep', 'code_math'")
    difficulty: Optional[str] = "university" # 'elementary', 'high_school', 'university'
    history: List[TutorMessage] = []
    student_profile: Optional[Dict[str, Any]] = None
    weak_areas: Optional[List[str]] = None

class TutorChatResponse(BaseModel):
    reply: str
    persona: str = "Socratic Mentor"
    guiding_question: Optional[str] = None
    hint: Optional[str] = None
    formula: Optional[str] = None
    confidence_check: Optional[str] = None
    suggested_followups: List[str] = []
    interactive_challenge: Optional[TutorInteractiveChallenge] = None

# User Profile Models
class UserProfileUpdate(BaseModel):
    name: Optional[str] = "Alex Mercer"
    avatar: Optional[str] = "🎓"
    major: Optional[str] = "Computer Science & AI"
    learning_style: Optional[str] = "Visual & Intuitive"
    daily_goal_minutes: Optional[int] = 45
    bio: Optional[str] = "Mastering difficult concepts through first principles."

class UserProfileResponse(BaseModel):
    id: int
    name: str
    avatar: str
    major: str
    learning_style: str
    daily_goal_minutes: int
    bio: str
    xp: int
    level: int
    streak_days: int
    total_study_minutes: int

# Adaptive Quiz Models
class QuizGenerateRequest(BaseModel):
    topic: str
    subject: Optional[str] = "General"
    num_questions: int = 5
    difficulty: str = "adaptive"

class QuizSubmitRequest(BaseModel):
    topic: str
    subject: str
    answers: List[Dict[str, Any]] # [{'question_id': 1, 'selected_index': 2, 'time_seconds': 15}]

class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    xp_earned: int
    feedback: List[Dict[str, Any]]
    streak: int
    level_up: bool = False
    remediation: Optional[Dict[str, Any]] = None

# Smart Notes Summarizer Models
class NotesSummarizeRequest(BaseModel):
    content: str
    title: Optional[str] = "Study Notes"
    generate_flashcards: bool = True
    generate_cheatsheet: bool = True

class NotesSummarizeResponse(BaseModel):
    title: str
    word_count: int
    executive_summary: str
    key_takeaways: List[str]
    glossary: List[Dict[str, str]]
    cheatsheet_formulas: List[str]
    flashcards: List[FlashcardItem]
    practice_questions: List[QuizQuestion]

# Saved Notes Persistence Models
class SavedNoteCreate(BaseModel):
    title: str
    raw_content: str
    summary: str
    key_takeaways: Optional[List[str]] = []
    glossary: Optional[List[Dict[str, str]]] = []
    cheatsheet_formulas: Optional[List[str]] = []

class SavedNoteResponse(BaseModel):
    id: int
    title: str
    raw_content: str
    summary: str
    executive_summary: Optional[str] = None
    topic: Optional[str] = "STEM"
    key_takeaways: List[str]
    glossary: List[Dict[str, str]]
    cheatsheet_formulas: List[str]
    created_at: str

class SavedNoteListItem(BaseModel):
    id: int
    title: str
    summary: str
    executive_summary: Optional[str] = None
    topic: Optional[str] = "STEM"
    takeaways_count: int = 0
    created_at: str
    word_count: int = 0

# User Progress & Stats Models
class UpdateProgressRequest(BaseModel):
    topic: str
    subject: str
    time_spent_seconds: int = 60
    mastery_delta: int = 10
    activity_type: str = "study" # "study", "quiz", "flashcard", "simulation"

class FlashcardReviewRequest(BaseModel):
    card_id: int
    quality: int # 0=Blackout, 1=Wrong, 2=Hard, 3=Good, 4=Easy (SM-2 rating)

# Gemini AI Provider Settings Models
class GeminiSettingsUpdate(BaseModel):
    api_key: str
    model: Optional[str] = "gemini-3.8-flash"

class GeminiSettingsResponse(BaseModel):
    is_configured: bool
    masked_key: str = ""
    model: str = "gemini-3.8-flash"
    provider: str = "Google Gemini API"
