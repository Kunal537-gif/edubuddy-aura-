// EduBuddy Aura Frontend API Service
const API_BASE = '/api';

const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await res.json();
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/profile`);
    return await res.json();
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update profile');
    }
    return await res.json();
  },

  async getTopics(category = null) {
    const url = category ? `${API_BASE}/topics?category=${encodeURIComponent(category)}` : `${API_BASE}/topics`;
    const res = await fetch(url);
    return await res.json();
  },

  async simplify(topic, depth = 'balanced', subject = 'General') {
    const res = await fetch(`${API_BASE}/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, depth, subject })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to simplify concept');
    }
    return await res.json();
  },

  async tutorChat(message, topic = 'General', mode = 'socratic', difficulty = 'university', history = [], studentProfile = null, weakAreas = null) {
    const payload = { message, topic, mode, difficulty, history };
    if (studentProfile) payload.student_profile = studentProfile;
    if (weakAreas) payload.weak_areas = weakAreas;
    const res = await fetch(`${API_BASE}/tutor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Tutor error');
    }
    return await res.json();
  },

  async getQuiz(topic, subject = 'General') {
    const res = await fetch(`${API_BASE}/quiz/generate?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}`, {
      method: 'POST'
    });
    return await res.json();
  },

  async submitQuiz(topic, subject, answers) {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subject, answers })
    });
    return await res.json();
  },

  async getFlashcards(subject = null) {
    const url = subject && subject !== 'all' 
      ? `${API_BASE}/flashcards?subject=${encodeURIComponent(subject)}` 
      : `${API_BASE}/flashcards`;
    const res = await fetch(url);
    return await res.json();
  },

  async addFlashcard(topic, subject, front, back, mnemonic = null) {
    const res = await fetch(`${API_BASE}/flashcards/add?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front, back, mnemonic })
    });
    return await res.json();
  },

  async reviewFlashcard(card_id, quality) {
    const res = await fetch(`${API_BASE}/flashcards/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id, quality })
    });
    return await res.json();
  },

  async summarizeNotes(content, title = 'Lecture Notes', generate_flashcards = true) {
    const res = await fetch(`${API_BASE}/notes/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, title, generate_flashcards })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to summarize notes');
    }
    return await res.json();
  },

  async getSavedNotes() {
    const res = await fetch(`${API_BASE}/notes`);
    return await res.json();
  },

  async saveNote(noteData) {
    const res = await fetch(`${API_BASE}/notes/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to save note');
    }
    return await res.json();
  },

  async getSavedNoteById(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`);
    if (!res.ok) throw new Error('Note not found');
    return await res.json();
  },

  async deleteSavedNote(noteId) {
    const res = await fetch(`${API_BASE}/notes/${noteId}`, {
      method: 'DELETE'
    });
    return await res.json();
  },

  async getConceptMap(topic = null) {
    const url = topic ? `${API_BASE}/concept-map?topic=${encodeURIComponent(topic)}` : `${API_BASE}/concept-map`;
    const res = await fetch(url);
    return await res.json();
  },

  async logActivity(topic, subject, time_spent_seconds = 60, mastery_delta = 5) {
    const res = await fetch(`${API_BASE}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, subject, time_spent_seconds, mastery_delta })
    });
    return await res.json();
  },

  // Gemini AI Provider Settings
  async getGeminiSettings() {
    const res = await fetch(`${API_BASE}/settings/gemini`);
    return await res.json();
  },

  async saveGeminiSettings(apiKey, model = 'gemini-3.8-flash') {
    const res = await fetch(`${API_BASE}/settings/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, model })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to verify Gemini API Key');
    }
    return await res.json();
  },

  async disconnectGemini() {
    const res = await fetch(`${API_BASE}/settings/gemini/disconnect`, {
      method: 'POST'
    });
    return await res.json();
  }
};
