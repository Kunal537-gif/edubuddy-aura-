# 🎓 EduBuddy Aura — AI-Powered Student Learning Platform

> **"Develop an interactive learning platform that helps students simplify difficult concepts, improve their understanding and make their learning experience more effective through AI-powered assistance."**

EduBuddy Aura is a modern, full-stack, AI-driven cognitive mastery platform designed to transform intimidating, abstract academic subjects into crystal-clear mental models. Combining multi-tier concept deconstruction, Socratic AI mentorship, interactive physics and algorithm sandboxes, and spaced-repetition memory retention, EduBuddy Aura empowers students to master complex STEM and humanities concepts in minutes rather than hours.

---

## ✨ Key Features & Capabilities

### 1. 💡 AI Concept Simplifier & Intuition Engine
- **Multi-Tier Cognitive Scaffolding**:
  - 🧒 **Explain Like I'm 5 (ELI5)**: Jargon-free, intuitive explanations using relatable metaphors.
  - 🧩 **Everyday Analogies**: Concrete real-world mental models (e.g., Fourier Transform as a smoothie separator; Attention Mechanism as a detective's spotlight).
  - 🪜 **Step-by-Step Algorithmic Breakdown**: Deconstructs processes into clear sequential milestones.
  - 📐 **Rigorous Technical & Mathematical Depth**: Exact definitions, invariant analysis, and LaTeX-formatted equations rendered via KaTeX.
  - ⚠️ **High-Yield Pitfalls & Misconceptions**: Clarifies common traps where 70%+ of students lose marks on exams.
  - 📊 **Visual Flowcharts & Architecture**: Dynamic process diagrams rendered with Mermaid.js.
  - 🔊 **Voice Audio Read-Aloud**: Browser-native Web Speech API synthesis to listen to explanations hands-free.

### 2. 🎓 Supercharged Interactive AI Tutor
- Real-time conversational AI mentor that avoids passive copy-paste answers and instead guides students to derive first-principles insights.
- **Five Specialized Persona Modes**:
  - 🦉 *Socratic Sage*: Leads with guided questioning, tests unstated assumptions, and clarifies foundational trade-offs.
  - 🧒 *ELI5 Buddy*: Explains concepts using joyful playground metaphors, everyday objects, and emoji analogies.
  - ⚡ *Speed Quizzer*: Fires rapid-fire conceptual challenge questions with clickable interactive answer options embedded right in the chat!
  - 🏛️ *Exam Architect*: Focuses on marking-scheme rubrics, keyword must-haves, and typical traps where students lose marks.
  - 💻 *Math & Code Deconstructor*: Provides rigorous LaTeX proofs, pseudocode traces, and asymptotic recurrence breakdowns.
- **Interactive In-Chat Widgets**:
  - 💡 *Expandable Hints*: "Need a hint? Click to reveal" unfoldable reasoning helpers.
  - ⚡ *Interactive Mini-Challenges*: Click multiple-choice buttons right in the chat feed to test instant recall with immediate feedback and confetti.
  - 🎤 *Voice Speech-to-Text (Microphone)*: Dictate questions aloud to the AI tutor with live transcription.
  - 🔊 *Per-Message Audio Synthesis*: Play / stop audio read-aloud for any specific tutor response.
  - 📇 *One-Click Flashcard Generator*: Click 📇 on any tutor reply to convert the Q&A pair into a Spaced Repetition flashcard.
  - 📥 *Chat Export*: Export the entire study session as clean Markdown notes.

### 3. ⚙️ Student Profile & Goal Customization
- **Personalized Avatar Picker**: Choose between 8 learning avatars (🎓 Academic, 🚀 Astronaut, 🤖 AI Engineer, 🧬 Biotech, ⚡ Quantum Geek, 🎨 Creative, 🦉 Wise Sage, 🦁 Achiever).
- **Major & Learning Style Adaptation**: Configure your academic major and preferred cognitive style (Visual & Interactive, Analogy-First, Mathematical Derivations, or Socratic Questions).
- **Dynamic Daily Study Target**: Set a daily study goal (15 to 120 minutes) with a live progress bar tracking daily completion.
- **Persistent Storage**: Saved in SQLite and instantly synchronized across the navbar, tutor greetings, and study statistics.

### 3. 🧪 Genuinely Interactive Concept Sandboxes & Simulations
- **Algorithm Invariant & Complexity Sandbox**:
  - Step-by-step **Step Forward** and **Step Backward** execution.
  - Custom user array input with presets (**Random**, **Reversed**, **Nearly Sorted**).
  - Variable speed control slider (30ms – 600ms).
  - **Live Pseudocode Line-by-Line Synchronization**: Highlights the exact executed line of code and explains loop invariants and comparison/swap counters in real time.
- **Physics Pendulum & Conservation of Energy ($E = K + U$)**:
  - Interactive Canvas with **Click & Drag Release Angle ($\theta_0$)**: Mouse or touch-drag the pendulum bob directly to set any initial displacement.
  - Continuous real-time conversion between Kinetic ($K = \frac{1}{2}mv^2$) and Potential ($U = mgh$) Energy.
  - Adjustable String Length ($L$), Gravity ($g$), and Damping sliders with phase space trajectory tracking.
- **Supply & Demand Equilibrium Simulator**: Dynamic market clearing, shortages, and surpluses.
- **Transformer Self-Attention Heatmap**: Token spotlight matrix demonstrating contextual weighting.

### 4. 🏆 Adaptive Concept Quizzes & Personalized Remediation
- Diagnostic multiple-choice questions with instant rationale feedback.
- **Personalized Remediation Action Plan**: Automatically diagnoses missed concepts and provides a custom recovery roadmap.
- **1-Click Remediation Bridge to Socratic Tutor**: Seamlessly launches the Socratic AI Tutor with the student's exact missed misconception pre-loaded.
- Updates real SQLite metrics (mastered counts, weak areas, streaks, XP).

### 5. 📇 Spaced Repetition Flashcards (SuperMemo SM-2)
- 3D interactive flip cards with mnemonics.
- Calibrated recall ratings: Forgot (<10 min), Hard (1 day), Good (3 days), Easy (6 days).
- Automatically calculates review intervals and scheduling according to the student's forgetting curve.

### 6. 🌐 Interactive Knowledge Graph & Prerequisite Map
- HTML5 Canvas force-directed graph modeling foundational connections across Computer Science, Physics, Mathematics, Biology, and Economics.
- Click any node to instantly jump to its deep-dive simplification.

### 7. 📝 Smart Notes, Cheatsheet Generator & Persistent Library
- Paste raw lecture notes, slides, or textbook excerpts.
- Generates a 30-Second Executive Summary, Key Takeaways, Jargon Glossary, and LaTeX Formula Cheatsheet.
- **Persistent Notes Library**: Full SQLite CRUD (Save, List, Search/Filter, View detail modal with KaTeX math rendering, Delete).
- **1-Click Markdown & Cheatsheet Export**: Copy or download formatted `.md` notes ready for Obsidian or Notion.

### 8. 🎬 Built-In 5-Minute Live Guided Tour & Demonstration
- Click the **`🎬 5-Min Tour`** button in the header or hero banner to launch the step-by-step interactive showcase.
- Accompanied by the complete presenter script in [`DEMO_GUIDE.md`](file:///c:/Users/dell/Desktop/google%20antigravity/EDUBUDDY-AURA/DEMO_GUIDE.md).

### 9. 🎧 Ambient Focus Audio Synthesizer
- Synthesizes soothing pink rain noise and 10Hz binaural alpha waves using the browser's native **Web Audio API** (100% offline, zero external audio assets required).

---

## 🏗️ Architecture & Tech Stack

```
EDUBUDDY-AURA/
├── backend/
│   ├── app.py              # FastAPI application, REST endpoints, static files
│   ├── config.py           # Configuration settings, paths, server defaults
│   ├── database.py         # SQLite manager (user stats, mastery, flashcards, quizzes)
│   ├── ai_engine.py        # Semantic knowledge bases + dynamic AI decomposition engine
│   ├── models.py           # Pydantic schemas for requests and responses
│   └── seed_data.py        # Seed catalogue of high-yield concepts & flashcards
├── frontend/
│   ├── index.html          # Main SPA dashboard interface
│   ├── css/
│   │   └── styles.css      # Custom styles, 3D flip card, scrollbars, animations
│   └── js/
│       ├── app.js          # Core coordinator, routing, Chart.js radar, search
│       ├── api.js          # Backend API client
│       ├── simplifier.js   # Multi-tier concept breakdown & voice synthesis
│       ├── tutor.js        # Socratic AI chat interface
│       ├── simulations.js  # Interactive physics, algorithm, and economics sandboxes
│       ├── quizzes.js      # Adaptive quiz engine with instant rationale feedback
│       ├── flashcards.js   # Spaced repetition SM-2 flashcard controller
│       ├── mindmap.js      # Force-directed knowledge graph canvas
│       ├── notes.js        # Smart notes summarizer & formula extractor
│       └── audio.js        # Web Audio API ambient focus sound generator
├── edubuddy.db             # Persistent SQLite database (auto-generated)
├── requirements.txt        # Python dependencies
├── run_server.py           # One-click launch script
└── README.md               # Documentation
```

### Backend:
- **Python 3.12+**
- **FastAPI**: Asynchronous high-performance REST API.
- **Uvicorn**: Lightning-fast ASGI web server.
- **SQLite 3**: Zero-configuration, ACID-compliant local database.
- **Pydantic v2**: Type validation and schema contracts.
- **AI Engine**: Built-in high-accuracy semantic knowledge base + algorithmic cognitive scaffolding. Optional Gemini API integration if `GEMINI_API_KEY` is provided.

### Frontend:
- **Tailwind CSS (CDN)**: Modern responsive dark-mode UI.
- **KaTeX**: Fast, beautiful rendering of LaTeX mathematical equations.
- **Chart.js**: Animated domain mastery radar and study analytics.
- **Mermaid.js**: Interactive process flowcharts and architecture diagrams.
- **Canvas-Confetti**: Micro-interaction celebratory bursts upon mastering topics.
- **Web Speech & Web Audio APIs**: Voice read-aloud and synthesized ambient study soundscapes.

---

## 🚀 Quickstart Guide

### 1. Requirements
Ensure Python 3.10+ is installed on your system.

### 2. Install Dependencies (Optional if already installed)
```bash
pip install -r requirements.txt
```

### 3. Run the Application
From the `EDUBUDDY-AURA` directory, run:
```bash
python run_server.py
```

### 4. Open the Dashboard
Open your web browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health and AI engine status check |
| `GET` | `/api/profile` | Retrieve student profile, avatar, major, and daily goal |
| `POST` | `/api/profile` | Update student profile, avatar, major, and study targets |
| `GET` | `/api/stats` | User XP, streak, subject mastery %, due flashcards |
| `GET` | `/api/topics` | Curated STEM & Humanities concepts catalogue |
| `POST` | `/api/simplify` | Multi-tier AI decomposition (ELI5, Analogy, LaTeX, Diagrams) |
| `POST` | `/api/tutor/chat` | Socratic mentor dialogue with guided questioning |
| `POST` | `/api/quiz/generate` | Generates calibrated questions for a concept |
| `POST` | `/api/quiz/submit` | Grades quiz, awards XP, updates concept mastery |
| `GET` | `/api/flashcards` | Returns flashcards due for spaced review |
| `POST` | `/api/flashcards/review` | Updates review intervals via SuperMemo SM-2 |
| `POST` | `/api/notes/summarize` | Extracts key takeaways, glossary, formulas & flashcards |
| `GET` | `/api/notes` | Retrieves list of saved notes in library |
| `POST` | `/api/notes/save` | Saves notes and formulas to permanent SQLite library |
| `GET` | `/api/notes/{id}` | Fetches full saved note with formulas & glossary |
| `DELETE` | `/api/notes/{id}` | Removes a note from the library |
| `GET` | `/api/concept-map` | Dynamic node-link graph for interactive knowledge map |

---

## 🌟 License & Credits
Developed for students and lifelong learners worldwide. Designed to make difficult concepts approachable, intuitive, and unforgettable.
