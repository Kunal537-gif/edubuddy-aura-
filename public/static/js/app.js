// EduBuddy Aura Main Application Coordinator
let masteryChartInstance = null;
let allCuratedTopics = [];
let currentUserProfile = null;
let selectedAvatarIcon = '🎓';

document.addEventListener('DOMContentLoaded', async () => {
  console.log('EduBuddy Aura initialized.');
  
  // Initialize Mermaid
  if (window.mermaid) {
    window.mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  }

  // Load User Profile & Dashboard Data
  await loadUserProfile();
  await loadDashboardStats();
  await loadCuratedTopics();
  await loadDueFlashcards();
  await loadConceptMap();
  await loadSavedNotesLibrary();
  if (typeof checkGeminiStatus === 'function') {
    await checkGeminiStatus();
  }
  
  // Initialize Algorithm simulation
  resetAlgoSim();
});

// Single Page View Router
function navigateTo(viewId) {
  const views = ['dashboard', 'simplifier', 'tutor', 'simulations', 'quiz', 'flashcards', 'mindmap', 'notes'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const navBtn = document.getElementById(`nav-${v}`);
    if (v === viewId) {
      if (el) el.classList.remove('hidden');
      if (navBtn) navBtn.classList.add('active');
    } else {
      if (el) el.classList.add('hidden');
      if (navBtn) navBtn.classList.remove('active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger view-specific re-renders
  if (viewId === 'mindmap') {
    setTimeout(initGraphSimulation, 100);
  } else if (viewId === 'simulations') {
    switchSimulation(currentSim);
  } else if (viewId === 'notes') {
    loadSavedNotesLibrary();
  }
}

// Global Concept Search Handler
function handleGlobalSearch(event) {
  if (event.key === 'Enter') {
    const query = document.getElementById('globalSearchInput').value.trim();
    if (query) {
      simplifyDirect(query);
    }
  }
}

function simplifyDirect(topic) {
  navigateTo('simplifier');
  document.getElementById('simplifierInput').value = topic;
  triggerSimplification();
}

// Load Dashboard Statistics & Mastery Radar
async function loadDashboardStats() {
  try {
    const stats = await api.getStats();
    const user = stats.user;

    // Header Chips
    document.getElementById('userStreak').textContent = `${user.streak_days} Days`;
    document.getElementById('userXP').textContent = `${user.xp} XP`;
    document.getElementById('userLevel').textContent = `Lvl ${user.level}`;

    // Metrics Overview Grid (Connected to real SQLite counts)
    const masteredVal = stats.mastered_count !== undefined ? stats.mastered_count : (stats.recent_concepts ? stats.recent_concepts.length : 6);
    document.getElementById('statMasteredCount').textContent = masteredVal;
    document.getElementById('statStreakDays').textContent = `${user.streak_days} Days`;
    document.getElementById('statStudyTime').textContent = `${user.total_study_minutes} min`;
    document.getElementById('statFlashcardsDue').textContent = stats.due_flashcards;
    document.getElementById('flashcardDueBadge').textContent = `${stats.due_flashcards} due`;

    // Render Recent Concepts
    renderRecentConcepts(stats.recent_concepts || []);

    // Render Adaptive Weak Areas Recovery Roadmap
    renderWeakAreas(stats.weak_areas || []);

    // Render Achievements Badges
    renderBadges(stats.badges || []);

    // Render Radar Chart
    renderMasteryRadar(stats.subject_mastery || []);

    // Update Daily Study Goal based on profile settings
    const goalMin = currentUserProfile?.daily_goal_minutes || 45;
    const currentMin = Math.min(goalMin, Math.round((user.total_study_minutes * 0.2) + 20));
    const goalPct = Math.min(100, Math.round((currentMin / goalMin) * 100));
    const goalTextEl = document.getElementById('dailyGoalText');
    const goalBarEl = document.getElementById('dailyProgressBar');
    if (goalTextEl) goalTextEl.textContent = `${currentMin} / ${goalMin} min`;
    if (goalBarEl) goalBarEl.style.width = `${goalPct}%`;
  } catch (e) {
    console.error('Failed to load user stats:', e);
  }
}

function renderRecentConcepts(concepts) {
  const container = document.getElementById('recentConceptsList');
  if (!container) return;
  container.innerHTML = '';

  if (concepts.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 py-3">No concepts reviewed yet. Start exploring below!</p>`;
    return;
  }

  concepts.slice(0, 5).forEach(c => {
    const row = document.createElement('div');
    row.className = 'p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition';
    row.onclick = () => simplifyDirect(c.topic);
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-full bg-brand-400"></span>
        <div>
          <h4 class="text-xs font-bold text-white">${c.topic}</h4>
          <span class="text-[10px] text-slate-400">${c.subject}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-16 bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div class="bg-brand-500 h-full rounded-full" style="width: ${c.mastery_percent}%"></div>
        </div>
        <span class="text-xs font-mono font-semibold text-brand-300">${c.mastery_percent}%</span>
      </div>
    `;
    container.appendChild(row);
  });
}

function renderBadges(badges) {
  const container = document.getElementById('badgesContainer');
  if (!container) return;
  container.innerHTML = '';

  badges.forEach(b => {
    const card = document.createElement('div');
    card.className = 'p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center space-y-1 hover:border-amber-500/40 transition';
    card.innerHTML = `
      <div class="text-2xl">${b.icon}</div>
      <div class="text-xs font-bold text-white truncate">${b.name}</div>
      <p class="text-[10px] text-slate-400 line-clamp-1">${b.description}</p>
    `;
    container.appendChild(card);
  });
}

function renderMasteryRadar(subjectData) {
  const ctx = document.getElementById('masteryRadarChart');
  if (!ctx) return;

  const defaultDomains = ['Computer Science', 'Physics', 'Mathematics', 'Biology', 'Economics'];
  const labels = defaultDomains;
  const values = defaultDomains.map(d => {
    const match = subjectData.find(s => s.subject.toLowerCase() === d.toLowerCase());
    return match ? match.avg_mastery : 65;
  });

  if (masteryChartInstance) {
    masteryChartInstance.destroy();
  }

  masteryChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Domain Mastery %',
        data: values,
        backgroundColor: 'rgba(59, 130, 246, 0.25)',
        borderColor: '#3b82f6',
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#3b82f6',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            display: false,
            stepSize: 20
          },
          grid: {
            color: 'rgba(51, 65, 85, 0.5)'
          },
          angleLines: {
            color: 'rgba(51, 65, 85, 0.5)'
          },
          pointLabels: {
            color: '#94a3b8',
            font: {
              size: 10,
              family: 'Inter'
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// Curated Topics Shelf
async function loadCuratedTopics() {
  try {
    const topics = await api.getTopics();
    allCuratedTopics = topics;
    renderCuratedTopics(topics);
  } catch (e) {
    console.error('Failed to load curated topics:', e);
  }
}

function filterCuratedTopics(category) {
  if (category === 'all') {
    renderCuratedTopics(allCuratedTopics);
  } else {
    const filtered = allCuratedTopics.filter(t => t.subject.toLowerCase() === category.toLowerCase());
    renderCuratedTopics(filtered);
  }
}

function renderCuratedTopics(topics) {
  const container = document.getElementById('curatedTopicsGrid');
  if (!container) return;
  container.innerHTML = '';

  topics.forEach(t => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer transition flex flex-col justify-between space-y-3 group';
    card.onclick = () => simplifyDirect(t.title);

    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-xl">${t.icon}</span>
          <span class="px-2 py-0.5 rounded-full font-semibold ${t.difficulty === 'Very Hard' ? 'bg-rose-500/20 text-rose-300' : t.difficulty === 'Hard' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}">
            ${t.difficulty}
          </span>
        </div>
        <h4 class="text-sm font-bold text-white group-hover:text-brand-400 transition">${t.title}</h4>
        <p class="text-xs text-slate-400 leading-relaxed line-clamp-2">${t.summary}</p>
      </div>

      <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span>${t.subject}</span>
        <span class="text-brand-400 font-semibold group-hover:translate-x-0.5 transition">Explore →</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Student Profile Management & Modal Handlers
async function loadUserProfile() {
  try {
    const profile = await api.getProfile();
    currentUserProfile = profile;
    selectedAvatarIcon = profile.avatar || '🎓';

    // Store avatar in localStorage for cross-module consistency
    localStorage.setItem('edubuddy_avatar', selectedAvatarIcon);

    // Update Navbar UI
    const navAvatar = document.getElementById('navbarAvatar');
    const navName = document.getElementById('navbarUserName');
    if (navAvatar) navAvatar.textContent = selectedAvatarIcon;
    if (navName) navName.textContent = profile.name || 'Alex Mercer';

    // Update Tutor Greeting
    const tutorGreet = document.getElementById('tutorGreetName');
    if (tutorGreet) tutorGreet.textContent = profile.name || 'Scholar';
  } catch (e) {
    console.error('Failed to load user profile:', e);
  }
}

function openProfileModal() {
  const modal = document.getElementById('profileModal');
  if (!modal) return;

  const profile = currentUserProfile || {
    name: 'Alex Mercer',
    avatar: '🎓',
    major: 'Computer Science & AI',
    learning_style: 'Visual & Intuitive',
    daily_goal_minutes: 45,
    bio: 'Mastering difficult concepts through first principles.'
  };

  document.getElementById('profileNameInput').value = profile.name || '';
  document.getElementById('profileMajorSelect').value = profile.major || 'Computer Science & AI';
  document.getElementById('profileStyleSelect').value = profile.learning_style || 'Visual & Intuitive';
  document.getElementById('profileGoalSlider').value = profile.daily_goal_minutes || 45;
  document.getElementById('profileGoalDisplay').textContent = `${profile.daily_goal_minutes || 45} min / day`;
  document.getElementById('profileBioInput').value = profile.bio || '';

  selectAvatar(profile.avatar || '🎓');
  modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

function selectAvatar(icon) {
  selectedAvatarIcon = icon;
  const buttons = document.querySelectorAll('.avatar-opt');
  buttons.forEach(btn => {
    if (btn.textContent.trim() === icon) {
      btn.className = 'avatar-opt p-2.5 rounded-2xl bg-brand-600/30 border-2 border-brand-500 text-xl flex items-center justify-center transition shadow-md shadow-brand-500/20';
    } else {
      btn.className = 'avatar-opt p-2.5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-brand-500 text-xl flex items-center justify-center transition';
    }
  });
}

function onGoalSliderChange(val) {
  document.getElementById('profileGoalDisplay').textContent = `${val} min / day`;
}

async function saveUserProfile() {
  const saveBtn = document.getElementById('saveProfileBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const updatedData = {
      name: document.getElementById('profileNameInput').value.trim() || 'Alex Mercer',
      avatar: selectedAvatarIcon,
      major: document.getElementById('profileMajorSelect').value,
      learning_style: document.getElementById('profileStyleSelect').value,
      daily_goal_minutes: parseInt(document.getElementById('profileGoalSlider').value),
      bio: document.getElementById('profileBioInput').value.trim()
    };

    const saved = await api.updateProfile(updatedData);
    currentUserProfile = saved;
    localStorage.setItem('edubuddy_avatar', saved.avatar);

    // Update Navbar and UI immediately
    const navAvatar = document.getElementById('navbarAvatar');
    const navName = document.getElementById('navbarUserName');
    if (navAvatar) navAvatar.textContent = saved.avatar;
    if (navName) navName.textContent = saved.name;

    const tutorGreet = document.getElementById('tutorGreetName');
    if (tutorGreet) tutorGreet.textContent = saved.name;

    closeProfileModal();

    // Trigger celebration confetti
    if (window.confetti) {
      window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }

    // Refresh Dashboard stats & goal progress bar
    await loadDashboardStats();
  } catch (e) {
    alert('Failed to save profile: ' + e.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Profile Changes';
  }
}

// Render Adaptive Weak Areas Recovery Cards
function renderWeakAreas(weakAreas) {
  const container = document.getElementById('weakAreasContainer');
  if (!container) return;
  container.innerHTML = '';

  if (!weakAreas || weakAreas.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
        <span class="text-emerald-400 font-bold">✨ All systems nominal!</span> No critical quiz misconceptions recorded. Take an adaptive quiz to identify growth areas.
      </div>
    `;
    return;
  }

  weakAreas.slice(0, 4).forEach(area => {
    const card = document.createElement('div');
    card.className = 'p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/20 hover:border-rose-500/40 transition flex items-center justify-between gap-3';
    
    card.innerHTML = `
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          <h4 class="text-xs font-bold text-white">${escapeHtml(area.topic)}</h4>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">${escapeHtml(area.subject || 'STEM')}</span>
        </div>
        <p class="text-[11px] text-slate-300">Missed concept: <strong class="text-rose-300 font-medium">${escapeHtml(area.missed_concept || 'Foundational principles')}</strong></p>
      </div>

      <button onclick="launchRemediationTutor('${escapeHtml(area.topic)}', 'I need help clarifying the concept of ${escapeHtml(area.missed_concept || area.topic)}. Could you explain it Socratically with an intuition-first analogy?')" 
              class="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition shrink-0 flex items-center gap-1">
        <span>🤖</span> Review
      </button>
    `;

    container.appendChild(card);
  });
}

/* ========================================================
   5-MINUTE INTERACTIVE LIVE DEMONSTRATION CONTROLLER
   ======================================================== */
const TOUR_STEPS = [
  {
    stepIndex: 1,
    minuteBadge: "Minute 1 of 5",
    title: "Minute 1: Intuitive Dashboard & Cognitive Scaffolding",
    description: "EduBuddy Aura provides an executive learning dashboard powered by real SQLite metrics. Notice your 5-day study streak, domain mastery radar, and our automatic weak-area remediation roadmap.",
    highlights: [
      "📊 Domain Mastery Radar: Calibrated in real time across 5 core STEM disciplines",
      "🎯 Weak-Area Recovery Roadmap: Automatically identifies specific quiz misses",
      "🔥 Habit Protection: Streak counters and daily study goal tracker"
    ],
    actionText: "Inspect Dashboard Metrics",
    action: () => {
      navigateTo('dashboard');
      const banner = document.querySelector('#view-dashboard h1');
      if (banner) banner.scrollIntoView({ behavior: 'smooth' });
    }
  },
  {
    stepIndex: 2,
    minuteBadge: "Minute 2 of 5",
    title: "Minute 2: Multi-Tier AI Simplifier & KaTeX Rigor",
    description: "Every student learns at a different cognitive depth. EduBuddy Aura breaks down complex abstract topics across 4 progressive tiers: ELI5 Analogy, High School intuition, Undergraduate mathematical rigor, and Graduate synthesis.",
    highlights: [
      "🧒 ELI5 Analogy: Translates transformer attention into a librarian prioritizing books",
      "📐 Mathematical Rigor: Full KaTeX LaTeX equations, softmax matrices, and bounds",
      "🗺️ Mermaid Architecture: Live visual diagrams generated on-the-fly"
    ],
    actionText: "⚡ Simplify 'Attention Mechanism'",
    action: () => {
      simplifyDirect('Attention Mechanism in Transformers');
    }
  },
  {
    stepIndex: 3,
    minuteBadge: "Minute 3 of 5",
    title: "Minute 3: Genuinely Interactive Visual Sandboxes",
    description: "Passive reading fails difficult concepts. Our genuinely interactive sandboxes feature step-by-step backward/forward algorithm execution with live pseudocode line highlighting, plus a physics pendulum with drag-and-drop bob release.",
    highlights: [
      "⏮️ Step-by-Step Execution: Step backward or forward through comparisons and swaps",
      "💡 Live Pseudocode Sync: Highlights exact executed lines and invariant boundaries",
      "⚙️ Physics Conservation: Click and drag the pendulum bob to observe dynamic energy conversion"
    ],
    actionText: "▶ Run Algorithm Step-by-Step",
    action: () => {
      navigateTo('simulations');
      switchSimulation('algo');
      setTimeout(() => {
        stepForwardAlgo();
        stepForwardAlgo();
      }, 300);
    }
  },
  {
    stepIndex: 4,
    minuteBadge: "Minute 4 of 5",
    title: "Minute 4: Context-Aware Socratic AI Tutor",
    description: "Rather than giving away answers, our Socratic Tutor asks guiding questions tailored to your student profile, major, and prior quiz weaknesses. Choose from 5 distinct personas and test yourself on in-chat checkpoints.",
    highlights: [
      "🎭 5 Distinct Personas: Socratic Mentor, ELI5 Buddy, Drill Sergeant, Exam Prep, Rigorous Math",
      "🧠 Memory Continuity: Knows your major, study style, and past weak spots",
      "🎯 Interactive Checkpoints: Multiple-choice challenges inside the chat stream with instant feedback"
    ],
    actionText: "🦉 Launch Socratic Persona",
    action: () => {
      navigateTo('tutor');
      if (typeof setTutorMode === 'function') setTutorMode('socratic');
      const input = document.getElementById('tutorChatInput');
      if (input) {
        input.value = "Why do we divide by sqrt(d_k) in scaled dot-product attention?";
      }
    }
  },
  {
    stepIndex: 5,
    minuteBadge: "Minute 5 of 5",
    title: "Minute 5: Adaptive Quizzing & Smart Notes Library",
    description: "Mastery requires active recall and spaced repetition. Quizzes diagnose weak areas and feed directly into remediation, while our Smart Notes generator creates LaTeX cheatsheets saved permanently to your SQLite library.",
    highlights: [
      "🏆 Misconception-Driven Quizzing: Diagnoses exact faulty intuition and builds recovery plans",
      "📇 SM-2 Spaced Flashcards: Calibrated to the human forgetting curve",
      "📝 Smart Notes & Cheatsheet Archive: Instant formula sheets with 1-click Markdown export"
    ],
    actionText: "📚 Open Notes Library",
    action: () => {
      navigateTo('notes');
      switchNotesSubTab('library');
    }
  }
];

let currentTourStepIndex = 0;

function startFiveMinuteTour() {
  currentTourStepIndex = 0;
  const modal = document.getElementById('tourModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  renderTourStep();
}

function renderTourStep() {
  const step = TOUR_STEPS[currentTourStepIndex];
  if (!step) return;

  document.getElementById('tourStepBadge').textContent = step.minuteBadge;
  document.getElementById('tourStepTitle').textContent = step.title;
  document.getElementById('tourStepDescription').textContent = step.description;

  const pct = Math.round(((currentTourStepIndex + 1) / TOUR_STEPS.length) * 100);
  document.getElementById('tourProgressBar').style.width = `${pct}%`;

  const highlightsContainer = document.getElementById('tourStepHighlights');
  highlightsContainer.innerHTML = step.highlights.map(h => `
    <div class="flex items-start gap-2">
      <span class="text-amber-400 mt-0.5">✦</span>
      <span>${escapeHtml(h)}</span>
    </div>
  `).join('');

  const actionBtn = document.getElementById('tourActionBtn');
  actionBtn.innerHTML = `<span>⚡</span> ${step.actionText}`;

  const prevBtn = document.getElementById('tourPrevBtn');
  prevBtn.disabled = (currentTourStepIndex === 0);

  const nextBtn = document.getElementById('tourNextBtn');
  if (currentTourStepIndex === TOUR_STEPS.length - 1) {
    nextBtn.textContent = 'Finish Live Tour 🎉';
  } else {
    nextBtn.textContent = 'Next Milestone →';
  }

  // Auto execute step preview navigation
  if (step.action) {
    step.action();
  }
}

function runCurrentTourAction() {
  const step = TOUR_STEPS[currentTourStepIndex];
  if (step && step.action) {
    step.action();
  }
}

function nextTourStep() {
  if (currentTourStepIndex < TOUR_STEPS.length - 1) {
    currentTourStepIndex++;
    renderTourStep();
  } else {
    closeTourModal();
    if (window.confetti) {
      window.confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    }
  }
}

function prevTourStep() {
  if (currentTourStepIndex > 0) {
    currentTourStepIndex--;
    renderTourStep();
  }
}

function closeTourModal() {
  const modal = document.getElementById('tourModal');
  if (modal) modal.classList.add('hidden');
}
