// Supercharged Context-Aware Socratic AI Tutor Controller
// Seamlessly powered by Google Gemini API & Multi-Persona Architecture
let tutorHistory = [];
let tutorMode = 'socratic';
let tutorDifficulty = 'university';
let activeTutorTopic = 'General Concept';
let speechRecognition = null;
let isRecognizingSpeech = false;
let currentSpeakingUtterance = null;
let currentGeminiConfig = null;

// Persona configurations
const PERSONA_CONFIGS = {
  socratic: {
    name: 'Socratic Sage',
    avatar: '🦉',
    gradient: 'from-emerald-500 to-teal-400',
    tagline: 'Guiding you to deduce answers from first principles'
  },
  eli5_buddy: {
    name: 'ELI5 Buddy',
    avatar: '🧒',
    gradient: 'from-amber-500 to-orange-400',
    tagline: 'Fun analogies and super simple real-world comparisons'
  },
  drill_sergeant: {
    name: 'Speed Quizzer',
    avatar: '⚡',
    gradient: 'from-purple-500 to-pink-500',
    tagline: 'Rapid-fire conceptual drills and reflex challenges'
  },
  exam_prep: {
    name: 'Exam Architect',
    avatar: '🏛️',
    gradient: 'from-rose-500 to-red-400',
    tagline: 'Marking schemes, high-yield traps, and keyword criteria'
  },
  code_math: {
    name: 'Math & Code Deconstructor',
    avatar: '💻',
    gradient: 'from-blue-600 to-indigo-500',
    tagline: 'Step-by-step mathematical proofs and code mechanics'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  checkGeminiStatus();
});

function setTutorMode(mode) {
  tutorMode = mode;
  const modes = ['socratic', 'eli5_buddy', 'drill_sergeant', 'exam_prep', 'code_math'];
  modes.forEach(m => {
    const btn = document.getElementById(`mode-${m}`);
    if (!btn) return;
    if (m === mode) {
      btn.className = 'px-2.5 py-1 rounded-lg font-medium bg-emerald-600 text-white transition flex items-center gap-1 shadow';
    } else {
      btn.className = 'px-2.5 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition flex items-center gap-1';
    }
  });

  const config = PERSONA_CONFIGS[mode] || PERSONA_CONFIGS.socratic;
  const avatarEl = document.getElementById('tutorPersonaAvatar');
  const nameEl = document.getElementById('tutorPersonaName');
  if (avatarEl) {
    avatarEl.textContent = config.avatar;
    avatarEl.className = `w-10 h-10 rounded-xl bg-gradient-to-tr ${config.gradient} flex items-center justify-center text-white font-bold text-lg shadow-md transition-all duration-300`;
  }
  if (nameEl) {
    nameEl.textContent = config.name;
  }
}

// Alias for backwards compatibility
function selectPersona(mode) {
  setTutorMode(mode);
}

function setTutorTopic(topic) {
  if (!topic) return;
  activeTutorTopic = topic.trim();
  const label = document.getElementById('tutorActiveTopic');
  if (label) {
    label.textContent = `Context: ${activeTutorTopic}`;
  }
}

function setTutorDifficulty(diff) {
  tutorDifficulty = diff;
}

function changeTutorTopicPrompt() {
  const current = activeTutorTopic;
  const next = prompt("Enter the concept topic you'd like the tutor to focus on:", current);
  if (next && next.trim()) {
    setTutorTopic(next);
    quickPromptToTutor(`Let's explore ${activeTutorTopic} together.`);
  }
}

function handleTutorKey(event) {
  if (event.key === 'Enter') {
    sendTutorMessage();
  }
}

function quickPromptToTutor(text) {
  const input = document.getElementById('tutorChatInput');
  if (input) input.value = text;
  sendTutorMessage();
}

async function sendTutorMessage() {
  const input = document.getElementById('tutorChatInput');
  if (!input) return;
  const msg = input.value.trim();
  if (!msg) return;

  const container = document.getElementById('tutorMessagesContainer');
  const sendBtn = document.getElementById('tutorSendBtn');

  // 1. Append user message to UI
  appendUserMessage(msg);
  input.value = '';
  if (sendBtn) sendBtn.disabled = true;

  // Append typing indicator
  const typingId = appendTypingIndicator();
  container.scrollTop = container.scrollHeight;

  try {
    // Collect student profile and weak areas for deep context awareness
    const profile = window.currentUserProfile || null;
    const weakAreas = window.currentUserStats?.weak_areas?.map(w => w.topic) || [];

    const res = await api.tutorChat(
      msg, 
      activeTutorTopic, 
      tutorMode, 
      tutorDifficulty, 
      tutorHistory,
      profile,
      weakAreas
    );
    removeTypingIndicator(typingId);
    
    // Append Assistant Response with interactive widgets
    appendAssistantMessage(res, msg);

    // Update history
    tutorHistory.push({ role: 'user', content: msg });
    tutorHistory.push({ role: 'assistant', content: res.reply });

    // Refresh XP & progress
    if (window.loadDashboardStats) window.loadDashboardStats();
  } catch (err) {
    removeTypingIndicator(typingId);
    appendSystemError('Sorry, I encountered an issue: ' + err.message);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    container.scrollTop = container.scrollHeight;
  }
}

function appendUserMessage(text) {
  const container = document.getElementById('tutorMessagesContainer');
  const row = document.createElement('div');
  row.className = 'flex justify-end gap-3 max-w-3xl ml-auto animate-in fade-in slide-in-from-bottom-2 duration-200';
  
  const studentAvatar = localStorage.getItem('edubuddy_avatar') || '🎓';

  row.innerHTML = `
    <div class="p-3.5 rounded-2xl rounded-tr-sm bg-brand-600 text-white text-sm leading-relaxed shadow-sm">
      ${escapeHtml(text)}
    </div>
    <div class="w-8 h-8 rounded-lg bg-brand-500/30 text-brand-300 flex items-center justify-center shrink-0 text-sm shadow ring-1 ring-brand-500/40">
      ${studentAvatar}
    </div>
  `;
  container.appendChild(row);
}

function appendAssistantMessage(data, userQuery) {
  const container = document.getElementById('tutorMessagesContainer');
  const row = document.createElement('div');
  const msgId = 'msg-' + Date.now();
  row.id = msgId;
  row.className = 'flex gap-3 max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-300';

  const config = PERSONA_CONFIGS[tutorMode] || PERSONA_CONFIGS.socratic;

  // 1. Interactive Expandable Hint Widget
  let hintHtml = '';
  if (data.hint) {
    const hintId = 'hint-' + Date.now();
    hintHtml = `
      <div class="pt-1">
        <button onclick="toggleTutorHint('${hintId}')" class="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition">
          <span>💡</span> <span>Need a Hint? (Click to reveal)</span>
        </button>
        <div id="${hintId}" class="hidden mt-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 leading-relaxed">
          ${escapeHtml(data.hint)}
        </div>
      </div>
    `;
  }

  // 2. LaTeX Formula Display
  let formulaHtml = '';
  if (data.formula) {
    formulaHtml = `
      <div class="my-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs font-mono text-purple-300 overflow-x-auto">
        $$${escapeHtml(data.formula)}$$
      </div>
    `;
  }

  // 3. Socratic Reflection Callout
  let guidingHtml = '';
  if (data.guiding_question) {
    guidingHtml = `
      <div class="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
        <strong class="text-white block mb-0.5 flex items-center gap-1">
          <span>🧠</span> Socratic Reflection:
        </strong>
        ${escapeHtml(data.guiding_question)}
      </div>
    `;
  }

  // 4. Interactive Mini-Challenge Widget
  let challengeHtml = '';
  if (data.interactive_challenge) {
    const chal = data.interactive_challenge;
    const chalId = 'chal-' + Date.now();
    challengeHtml = `
      <div id="${chalId}" class="mt-3 p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-3">
        <div class="flex items-center justify-between text-xs font-bold text-indigo-300">
          <span class="flex items-center gap-1.5"><span>⚡</span> Rapid Intuition Check</span>
          <span class="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full text-indigo-200 border border-indigo-500/30 font-semibold">+30 XP</span>
        </div>
        <p class="text-xs font-semibold text-white">${escapeHtml(chal.question)}</p>
        <div class="space-y-1.5">
          ${chal.options.map((opt, optIdx) => `
            <button onclick="handleTutorChallengeAnswer('${chalId}', ${optIdx}, ${chal.correct_index}, '${escapeQuotes(chal.explanation)}')" 
                    class="w-full text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition">
              <span class="font-bold text-slate-400 mr-1.5">${String.fromCharCode(65 + optIdx)}.</span>
              ${escapeHtml(opt)}
            </button>
          `).join('')}
        </div>
        <div id="${chalId}-feedback" class="hidden text-xs p-2.5 rounded-xl border"></div>
      </div>
    `;
  }

  // 5. Suggested Follow-Up Prompt Pills
  let followupsHtml = '';
  if (data.suggested_followups && data.suggested_followups.length > 0) {
    followupsHtml = `
      <div class="flex flex-wrap gap-1.5 pt-2">
        ${data.suggested_followups.map(f => `
          <button onclick="quickPromptToTutor('${escapeQuotes(f)}')" class="px-2.5 py-1 text-xs rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1">
            <span>👉</span> ${escapeHtml(f)}
          </button>
        `).join('')}
      </div>
    `;
  }

  // 6. Action Tools Strip (Speak, Copy, Convert to Flashcard)
  const escapedReply = escapeQuotes(data.reply);
  const actionToolsHtml = `
    <div class="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
      <button onclick="speakTutorMessage('${msgId}')" title="Listen to explanation" class="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white flex items-center gap-1 transition">
        <span>🔊</span> <span>Listen</span>
      </button>
      <button onclick="copyMessageText('${msgId}')" title="Copy to clipboard" class="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 hover:text-white flex items-center gap-1 transition">
        <span>📋</span> <span>Copy</span>
      </button>
      <button onclick="convertReplyToFlashcard('${escapeQuotes(userQuery)}', '${escapedReply}')" title="Save as revision flashcard" class="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 flex items-center gap-1 transition">
        <span>📇</span> <span>Add to Flashcards</span>
      </button>
    </div>
  `;

  row.innerHTML = `
    <div class="w-8 h-8 rounded-lg bg-gradient-to-tr ${config.gradient} text-white flex items-center justify-center shrink-0 text-sm shadow">
      ${config.avatar}
    </div>
    <div class="space-y-2 flex-1 min-w-0">
      <div class="flex items-center gap-2 text-[10px] text-slate-400">
        <span class="font-bold text-slate-300">${data.persona || config.name}</span>
        <span>•</span>
        <span>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <div class="tutor-bubble p-4 rounded-2xl rounded-tl-sm bg-slate-800 text-slate-200 text-sm leading-relaxed border border-slate-700 shadow-sm space-y-2">
        ${formatMarkdownLinksAndCode(data.reply)}
        ${formulaHtml}
        ${hintHtml}
        ${guidingHtml}
        ${challengeHtml}
      </div>

      ${actionToolsHtml}
      ${followupsHtml}
    </div>
  `;
  container.appendChild(row);

  // Trigger KaTeX math rendering on all mathematical segments in the reply
  if (window.renderMathInElement) {
    window.renderMathInElement(row, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

// Interactive challenge answer checker
function handleTutorChallengeAnswer(chalId, selectedIdx, correctIdx, explanation) {
  const container = document.getElementById(chalId);
  if (!container) return;
  const feedbackEl = document.getElementById(`${chalId}-feedback`);
  const buttons = container.querySelectorAll('button:not(#close)');

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correctIdx) {
      btn.className = 'w-full text-left p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 font-bold';
    } else if (idx === selectedIdx) {
      btn.className = 'w-full text-left p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300';
    }
  });

  const isCorrect = (selectedIdx === correctIdx);
  if (isCorrect) {
    feedbackEl.className = 'text-xs p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 space-y-1 block';
    feedbackEl.innerHTML = `<strong>✓ Spot On!</strong><br>${escapeHtml(explanation)}`;
    if (window.confetti) {
      window.confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
  } else {
    feedbackEl.className = 'text-xs p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 space-y-1 block';
    feedbackEl.innerHTML = `<strong>Not quite, but great effort!</strong><br>${escapeHtml(explanation)}`;
  }
}

function toggleTutorHint(hintId) {
  const el = document.getElementById(hintId);
  if (el) {
    el.classList.toggle('hidden');
  }
}

// Convert chatbot reply into a Spaced Repetition Flashcard
async function convertReplyToFlashcard(question, answer) {
  try {
    const cleanFront = question.length > 120 ? question.slice(0, 120) + '...' : question;
    const cleanBack = answer.length > 220 ? answer.slice(0, 220) + '...' : answer;
    await api.addFlashcard(activeTutorTopic, 'Tutor Notes', cleanFront, cleanBack, 'Socratic deduction insight');
    
    if (window.confetti) {
      window.confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
    }
    alert('🎉 Flashcard saved to your Spaced Repetition study deck!');
    if (window.loadDueFlashcards) window.loadDueFlashcards();
    if (window.loadDashboardStats) window.loadDashboardStats();
  } catch (e) {
    alert('Failed to save flashcard: ' + e.message);
  }
}

// Speech Synthesis Read Aloud for specific message
function speakTutorMessage(msgId) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported on this browser.');
    return;
  }
  const msgEl = document.getElementById(msgId);
  if (!msgEl) return;
  const bubble = msgEl.querySelector('.tutor-bubble');
  if (!bubble) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    return;
  }

  const text = bubble.innerText.replace(/\$\$[\s\S]*?\$\$/g, '').trim();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Copy message to clipboard
function copyMessageText(msgId) {
  const msgEl = document.getElementById(msgId);
  if (!msgEl) return;
  const bubble = msgEl.querySelector('.tutor-bubble');
  if (!bubble) return;
  navigator.clipboard.writeText(bubble.innerText);
  alert('Copied to clipboard!');
}

// Voice Speech Recognition (Speech-to-Text)
function toggleVoiceRecognition() {
  if (isRecognizingSpeech) {
    stopVoiceRecognition();
  } else {
    startVoiceRecognition();
  }
}

function startVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Voice recognition (Speech-to-Text) is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
    return;
  }

  try {
    speechRecognition = new SpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    const indicator = document.getElementById('voiceListeningIndicator');
    const micIcon = document.getElementById('tutorMicIcon');
    const input = document.getElementById('tutorChatInput');

    speechRecognition.onstart = () => {
      isRecognizingSpeech = true;
      indicator.classList.remove('hidden');
      micIcon.textContent = '🔴';
      micIcon.classList.add('animate-pulse');
    };

    speechRecognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      input.value = transcript;
    };

    speechRecognition.onerror = (e) => {
      console.warn('Speech recognition error:', e);
      stopVoiceRecognition();
    };

    speechRecognition.onend = () => {
      stopVoiceRecognition();
    };

    speechRecognition.start();
  } catch (e) {
    console.error('Speech recognition start error:', e);
  }
}

function stopVoiceRecognition() {
  if (speechRecognition) {
    try { speechRecognition.stop(); } catch (e) {}
    speechRecognition = null;
  }
  isRecognizingSpeech = false;
  const indicator = document.getElementById('voiceListeningIndicator');
  const micIcon = document.getElementById('tutorMicIcon');
  if (indicator) indicator.classList.add('hidden');
  if (micIcon) {
    micIcon.textContent = '🎤';
    micIcon.classList.remove('animate-pulse');
  }
}

// Clear conversation
function clearTutorChat() {
  if (!confirm('Clear your conversation with the AI tutor?')) return;
  tutorHistory = [];
  const container = document.getElementById('tutorMessagesContainer');
  const firstChild = container.firstElementChild;
  container.innerHTML = '';
  if (firstChild) container.appendChild(firstChild);
}

// Export Chat to Markdown File
function exportChatNotes() {
  if (tutorHistory.length === 0) {
    alert('No conversation history to export yet.');
    return;
  }
  let md = `# 🎓 Socratic AI Tutor Study Session Notes\n\n`;
  md += `**Topic:** ${activeTutorTopic}\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n`;
  md += `**Mode:** ${PERSONA_CONFIGS[tutorMode]?.name || 'Socratic'}\n\n---\n\n`;

  tutorHistory.forEach(item => {
    if (item.role === 'user') {
      md += `### 👤 Question / Reflection\n${item.content}\n\n`;
    } else {
      md += `### 🦉 AI Tutor Explanation\n${item.content}\n\n---\n\n`;
    }
  });

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `EduBuddy_Tutor_${activeTutorTopic.replace(/\s+/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function appendTypingIndicator() {
  const container = document.getElementById('tutorMessagesContainer');
  const id = 'typing-' + Date.now();
  const row = document.createElement('div');
  row.id = id;
  row.className = 'flex gap-3 max-w-3xl';
  const config = PERSONA_CONFIGS[tutorMode] || PERSONA_CONFIGS.socratic;

  row.innerHTML = `
    <div class="w-8 h-8 rounded-lg bg-gradient-to-tr ${config.gradient} text-white flex items-center justify-center shrink-0 text-sm shadow animate-pulse">
      ${config.avatar}
    </div>
    <div class="p-3.5 rounded-2xl rounded-tl-sm bg-slate-800 text-slate-400 text-xs flex items-center gap-1.5 border border-slate-700">
      <span>${config.name} is formulating intuition</span>
      <span class="inline-flex gap-1">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style="animation-delay: 0.2s"></span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style="animation-delay: 0.4s"></span>
      </span>
    </div>
  `;
  container.appendChild(row);
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function appendSystemError(msg) {
  const container = document.getElementById('tutorMessagesContainer');
  const row = document.createElement('div');
  row.className = 'p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center';
  row.textContent = msg;
  container.appendChild(row);
}

// Markdown formatting helper with lists, bold, italics, code, and LaTeX preservation
function formatMarkdownLinksAndCode(text) {
  if (!text) return '';
  let formatted = text;
  
  // 1. Triple backtick code blocks with language
  formatted = formatted.replace(/```(?:python|py)?([\s\S]*?)```/g, '<pre class="my-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto">$1</pre>');
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="my-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">$1</pre>');
  
  // 2. Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-brand-300 text-xs">$1</code>');
  
  // 3. Bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
  
  // 4. Italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="text-slate-300 italic">$1</em>');
  
  // 5. Bullet list items
  formatted = formatted.replace(/^[•\-\*]\s+(.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-emerald-400 font-bold shrink-0 mt-0.5">▪</span><span>$1</span></div>');

  // 6. Numbered list items
  formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-amber-400 font-bold shrink-0">$1.</span><span>$2</span></div>');
  
  return formatted;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

/* ========================================================
   GEMINI AI PROVIDER CONFIGURATION & STATUS
   ======================================================== */
async function checkGeminiStatus() {
  try {
    const config = await api.getGeminiSettings();
    currentGeminiConfig = config;
    updateGeminiUI(config);
  } catch (e) {
    console.warn('Failed to fetch Gemini status:', e);
  }
}

function updateGeminiUI(config) {
  const tutorBadge = document.getElementById('tutorGeminiBadge');
  const navBadge = document.getElementById('navbarGeminiBadge');
  
  if (config && config.is_configured) {
    const modelLabel = config.model || 'gemini-3.8-flash';
    if (tutorBadge) {
      tutorBadge.className = 'text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-500/30 transition shadow-sm';
      tutorBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> <span>Gemini Active (${modelLabel})</span>`;
      tutorBadge.title = `Powered by Google Gemini (${modelLabel}). Click to configure.`;
    }
    if (navBadge) {
      navBadge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition';
      navBadge.innerHTML = `<span>🟢</span> <span>Gemini AI</span>`;
      navBadge.title = `Google Gemini Active (${modelLabel}). Click to configure.`;
    }
  } else {
    if (tutorBadge) {
      tutorBadge.className = 'text-[10px] px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/25 transition shadow-sm';
      tutorBadge.innerHTML = `<span>⚡</span> <span>Connect Gemini API</span>`;
      tutorBadge.title = 'Click to connect Google Gemini API for real-time intelligence';
    }
    if (navBadge) {
      navBadge.className = 'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-medium cursor-pointer transition';
      navBadge.innerHTML = `<span>⚡</span> <span>Connect Gemini</span>`;
      navBadge.title = 'Click to enter your Google Gemini API key';
    }
  }
}

function openGeminiModal() {
  const modal = document.getElementById('geminiKeyModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const statusText = document.getElementById('geminiCurrentStatus');
  const disconnectBtn = document.getElementById('disconnectGeminiBtn');

  if (currentGeminiConfig && currentGeminiConfig.is_configured) {
    if (statusText) statusText.innerHTML = `<span class="text-emerald-400 font-bold">✓ Connected:</span> Active Key: <code>${currentGeminiConfig.masked_key}</code> (${currentGeminiConfig.model})`;
    if (disconnectBtn) disconnectBtn.classList.remove('hidden');
  } else {
    if (statusText) statusText.innerHTML = `<span class="text-amber-400 font-medium">⚪ Offline Socratic Engine:</span> No Gemini API key saved. Running built-in pedagogical knowledge base.`;
    if (disconnectBtn) disconnectBtn.classList.add('hidden');
  }
}

function closeGeminiModal() {
  const modal = document.getElementById('geminiKeyModal');
  if (modal) modal.classList.add('hidden');
}

async function saveGeminiKeyFromModal() {
  const input = document.getElementById('geminiApiKeyInput');
  const modelSelect = document.getElementById('geminiModelSelect');
  const btn = document.getElementById('saveGeminiBtn');
  const feedback = document.getElementById('geminiModalFeedback');

  const key = input ? input.value.trim() : '';
  const model = modelSelect ? modelSelect.value : 'gemini-3.8-flash';

  if (!key) {
    alert('Please enter your Google Gemini API key.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Verifying Key with Google API...';
  if (feedback) feedback.classList.add('hidden');

  try {
    const res = await api.saveGeminiSettings(key, model);
    if (feedback) {
      feedback.className = 'p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs block';
      feedback.innerHTML = `<strong>✓ Success!</strong> Connected to Google Gemini (${res.model}). Your Socratic Tutor is now powered by Gemini!`;
    }
    if (input) input.value = '';
    await checkGeminiStatus();

    if (window.confetti) {
      window.confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }

    setTimeout(() => {
      closeGeminiModal();
    }, 1500);
  } catch (err) {
    if (feedback) {
      feedback.className = 'p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs block';
      feedback.innerHTML = `<strong>Verification Failed:</strong> ${err.message}<br><span class="text-[11px] text-slate-400">Please verify your key is active and has Gemini API enabled in Google AI Studio.</span>`;
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🚀</span> Verify & Connect Gemini API';
  }
}

async function disconnectGeminiApi() {
  if (!confirm('Disconnect Gemini API and switch back to offline Socratic mode?')) return;
  try {
    await api.disconnectGemini();
    await checkGeminiStatus();
    closeGeminiModal();
    alert('Switched back to offline Socratic mode.');
  } catch (e) {
    alert('Failed to disconnect: ' + e.message);
  }
}
