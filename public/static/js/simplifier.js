// Concept Simplifier Controller
let currentSimplification = null;
let currentDepth = 'balanced';
let isSpeaking = false;

function setDepth(depth) {
  currentDepth = depth;
  const depths = ['eli5', 'balanced', 'deep_dive', 'academic'];
  depths.forEach(d => {
    const btn = document.getElementById(`depth-${d}`);
    if (d === depth) {
      btn.className = 'px-3 py-1 rounded-lg font-medium bg-brand-600 text-white shadow transition';
    } else {
      btn.className = 'px-3 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition';
    }
  });
}

function selectQuickTopic(topic) {
  document.getElementById('simplifierInput').value = topic;
  triggerSimplification();
}

async function triggerSimplification() {
  const input = document.getElementById('simplifierInput');
  const topic = input.value.trim();
  if (!topic) return;

  const loadingEl = document.getElementById('simplifierLoading');
  const resultEl = document.getElementById('simplifierResult');
  const submitBtn = document.getElementById('simplifySubmitBtn');

  loadingEl.classList.remove('hidden');
  resultEl.classList.add('hidden');
  submitBtn.disabled = true;

  try {
    const data = await api.simplify(topic, currentDepth);
    currentSimplification = data;
    renderSimplification(data);
    resultEl.classList.remove('hidden');
    // Refresh stats in dashboard
    if (window.loadDashboardStats) window.loadDashboardStats();
  } catch (err) {
    alert('Error simplifying concept: ' + err.message);
  } finally {
    loadingEl.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function renderSimplification(data) {
  // Title & Header
  document.getElementById('resTopicTitle').textContent = data.topic;
  document.getElementById('resSubjectBadge').textContent = data.subject;

  // Tab 1: ELI5
  document.getElementById('resEli5Summary').textContent = data.eli5_summary;
  document.getElementById('resKeyIntuition').textContent = data.key_intuition;

  // Tab 2: Analogy
  document.getElementById('resAnalogyText').textContent = data.relatable_analogy;

  // Tab 3: Steps
  const stepsContainer = document.getElementById('resStepsContainer');
  stepsContainer.innerHTML = '';
  data.step_by_step_breakdown.forEach((step, idx) => {
    const item = document.createElement('div');
    item.className = 'p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-start gap-3';
    item.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
        ${idx + 1}
      </div>
      <div>
        <h4 class="text-xs font-bold text-white mb-0.5">${step.step}</h4>
        <p class="text-xs text-slate-300 leading-relaxed">${step.detail}</p>
      </div>
    `;
    stepsContainer.appendChild(item);
  });

  // Tab 4: Formulas & Technical Depth
  document.getElementById('resTechnicalDepth').textContent = data.technical_depth;
  const formulasContainer = document.getElementById('resFormulasContainer');
  formulasContainer.innerHTML = '';
  data.latex_formulas.forEach(formula => {
    const box = document.createElement('div');
    box.className = 'p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs overflow-x-auto text-brand-300';
    box.textContent = `$$${formula}$$`;
    formulasContainer.appendChild(box);
  });

  // Tab 5: Misconceptions
  const miscContainer = document.getElementById('resMisconceptionsContainer');
  miscContainer.innerHTML = '';
  data.common_misconceptions.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-4 rounded-xl bg-slate-800/80 border border-rose-500/20 space-y-2';
    card.innerHTML = `
      <div class="flex items-center gap-2 text-rose-400 font-semibold text-xs">
        <span>❌ Myth:</span> <span>${item.misconception}</span>
      </div>
      <div class="flex items-start gap-2 text-emerald-400 font-medium text-xs">
        <span class="shrink-0 mt-0.5">✓ Reality:</span>
        <span class="text-slate-200">${item.reality}</span>
      </div>
    `;
    miscContainer.appendChild(card);
  });

  // Tab 6: Mermaid Diagram
  const diagramDesc = document.getElementById('resDiagramDesc');
  const target = document.getElementById('mermaidDiagramTarget');
  diagramDesc.textContent = data.visual_diagram_description || '';
  if (data.visual_diagram_mermaid) {
    target.innerHTML = data.visual_diagram_mermaid;
    target.removeAttribute('data-processed');
    try {
      if (window.mermaid) {
        window.mermaid.init(undefined, target);
      }
    } catch (e) {
      console.warn('Mermaid render error:', e);
    }
  } else {
    target.innerHTML = `<span class="text-xs text-slate-500">Diagram unavailable for this topic</span>`;
  }

  // Real world applications
  const appsGrid = document.getElementById('resApplicationsGrid');
  appsGrid.innerHTML = '';
  data.real_world_applications.forEach(app => {
    const chip = document.createElement('div');
    chip.className = 'p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center gap-2 text-slate-300';
    chip.innerHTML = `<span class="text-brand-400">⚡</span> <span>${app}</span>`;
    appsGrid.appendChild(chip);
  });

  // Re-render KaTeX math equations
  if (window.renderMathInElement) {
    window.renderMathInElement(document.getElementById('simplifierResult'), {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }

  // Default to ELI5 tab
  switchConceptTab('eli5');
}

function switchConceptTab(tabId) {
  const tabs = ['eli5', 'analogy', 'steps', 'formulas', 'misconceptions', 'diagram'];
  tabs.forEach(t => {
    const tabBtn = document.getElementById(`tab-${t}`);
    const content = document.getElementById(`content-${t}`);
    if (t === tabId) {
      tabBtn.classList.add('active');
      content.classList.remove('hidden');
    } else {
      tabBtn.classList.remove('active');
      content.classList.add('hidden');
    }
  });

  // Re-run mermaid if switching to diagram
  if (tabId === 'diagram' && window.mermaid) {
    const target = document.getElementById('mermaidDiagramTarget');
    target.removeAttribute('data-processed');
    try {
      window.mermaid.init(undefined, target);
    } catch (e) {}
  }
}

// Web Speech API Read Aloud
function speakExplanation() {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis is not supported on this browser.');
    return;
  }

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    updateSpeechUI(false);
    return;
  }

  if (!currentSimplification) return;

  const textToRead = `${currentSimplification.topic}. Explain like I'm five: ${currentSimplification.eli5_summary}. Analogy: ${currentSimplification.relatable_analogy}`;
  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onend = () => {
    isSpeaking = false;
    updateSpeechUI(false);
  };
  utterance.onerror = () => {
    isSpeaking = false;
    updateSpeechUI(false);
  };

  window.speechSynthesis.speak(utterance);
  isSpeaking = true;
  updateSpeechUI(true);
}

function updateSpeechUI(active) {
  const icon = document.getElementById('voiceIcon');
  const text = document.getElementById('voiceText');
  const btn = document.getElementById('voiceSpeechBtn');
  if (active) {
    icon.textContent = '⏹️';
    text.textContent = 'Stop Audio';
    btn.classList.add('bg-brand-600', 'text-white');
  } else {
    icon.textContent = '🔊';
    text.textContent = 'Listen (Audio)';
    btn.classList.remove('bg-brand-600', 'text-white');
  }
}

function sendToTutorFromTopic() {
  if (!currentSimplification) return;
  navigateTo('tutor');
  const tutorTopicEl = document.getElementById('tutorActiveTopic');
  tutorTopicEl.textContent = `Active Topic: ${currentSimplification.topic}`;
  
  // Send prompt
  const initialMsg = `Can you guide me through understanding ${currentSimplification.topic} using Socratic questions?`;
  document.getElementById('tutorChatInput').value = initialMsg;
  sendTutorMessage();
}

async function saveAllCurrentFlashcards() {
  if (!currentSimplification || !currentSimplification.flashcards) return;
  for (const card of currentSimplification.flashcards) {
    await api.addFlashcard(currentSimplification.topic, currentSimplification.subject, card.front, card.back, card.mnemonic);
  }
  if (window.confetti) {
    window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  }
  alert(`Added ${currentSimplification.flashcards.length} flashcards to your Spaced Repetition deck!`);
  if (window.loadDueFlashcards) window.loadDueFlashcards();
}

function launchQuizForCurrentConcept() {
  if (!currentSimplification) return;
  document.getElementById('quizTopicInput').value = currentSimplification.topic;
  navigateTo('quiz');
  startNewQuiz();
}
