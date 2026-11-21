// Adaptive Quiz Controller
let currentQuiz = null;
let currentQuestionIndex = 0;
let userQuizAnswers = [];
let selectedOptionIndex = null;
let quizSubmitted = false;

async function startNewQuiz() {
  const topicInput = document.getElementById('quizTopicInput');
  const topic = topicInput.value.trim() || 'Dynamic Programming';

  document.getElementById('quizActiveCard').classList.remove('hidden');
  document.getElementById('quizCompleteScreen').classList.add('hidden');

  try {
    const data = await api.getQuiz(topic);
    currentQuiz = data;
    currentQuestionIndex = 0;
    userQuizAnswers = [];
    selectedOptionIndex = null;
    quizSubmitted = false;

    renderCurrentQuizQuestion();
  } catch (e) {
    alert('Failed to load quiz: ' + e.message);
  }
}

function renderCurrentQuizQuestion() {
  if (!currentQuiz || !currentQuiz.questions || currentQuiz.questions.length === 0) return;

  const q = currentQuiz.questions[currentQuestionIndex];
  const total = currentQuiz.questions.length;

  document.getElementById('quizCurrentIndex').textContent = (currentQuestionIndex + 1).toString();
  document.getElementById('quizTotalCount').textContent = total.toString();
  document.getElementById('quizTopicLabel').textContent = currentQuiz.topic;

  // Progress Bar
  const pct = Math.round(((currentQuestionIndex + 1) / total) * 100);
  document.getElementById('quizProgressBar').style.width = `${pct}%`;

  // Question Text
  document.getElementById('quizQuestionText').textContent = q.question;

  // Reset feedback & selected state
  selectedOptionIndex = null;
  const feedbackBanner = document.getElementById('quizFeedbackBanner');
  feedbackBanner.classList.add('hidden');

  const nextBtn = document.getElementById('quizNextBtn');
  nextBtn.textContent = (currentQuestionIndex === total - 1) ? 'Submit Quiz & Check Calibration' : 'Verify Answer →';

  // Render Options
  const container = document.getElementById('quizOptionsContainer');
  container.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option-btn w-full p-4 rounded-xl bg-slate-800 border border-slate-700 text-left text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-3 transition';
    btn.id = `quiz-opt-${idx}`;
    btn.innerHTML = `
      <span class="w-7 h-7 rounded-lg bg-slate-700/80 text-slate-300 font-bold flex items-center justify-center shrink-0 text-xs">
        ${letters[idx]}
      </span>
      <span class="flex-1">${optText}</span>
    `;
    btn.onclick = () => selectQuizOption(idx);
    container.appendChild(btn);
  });
}

function selectQuizOption(index) {
  if (selectedOptionIndex !== null && document.getElementById('quizFeedbackBanner').classList.contains('hidden') === false) {
    // Already answered and feedback is shown
    return;
  }
  selectedOptionIndex = index;
  const q = currentQuiz.questions[currentQuestionIndex];

  // Highlight selected button
  q.options.forEach((_, idx) => {
    const btn = document.getElementById(`quiz-opt-${idx}`);
    if (idx === index) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
}

async function handleQuizNext() {
  if (selectedOptionIndex === null) {
    alert('Please select an option first!');
    return;
  }

  const q = currentQuiz.questions[currentQuestionIndex];
  const feedbackBanner = document.getElementById('quizFeedbackBanner');

  // If feedback is not shown yet, verify and show explanation first
  if (feedbackBanner.classList.contains('hidden')) {
    const isCorrect = (selectedOptionIndex === q.correct_index);
    userQuizAnswers.push({
      question_id: q.id,
      selected_index: selectedOptionIndex
    });

    // Style option buttons
    q.options.forEach((_, idx) => {
      const btn = document.getElementById(`quiz-opt-${idx}`);
      btn.disabled = true;
      if (idx === q.correct_index) {
        btn.classList.add('correct');
      } else if (idx === selectedOptionIndex) {
        btn.classList.add('incorrect');
      }
    });

    // Show feedback banner
    const statusEl = document.getElementById('quizFeedbackStatus');
    const explEl = document.getElementById('quizFeedbackExplanation');
    if (isCorrect) {
      feedbackBanner.className = 'p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1';
      statusEl.className = 'flex items-center gap-2 font-bold text-sm text-emerald-400';
      statusEl.innerHTML = '<span>✓ Correct!</span> <span>Cognitive intuition verified</span>';
    } else {
      feedbackBanner.className = 'p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-1';
      statusEl.className = 'flex items-center gap-2 font-bold text-sm text-rose-400';
      statusEl.innerHTML = '<span>❌ Not quite!</span> <span>Here is the underlying principle:</span>';
    }
    explEl.textContent = q.explanation;
    feedbackBanner.classList.remove('hidden');

    const nextBtn = document.getElementById('quizNextBtn');
    nextBtn.textContent = (currentQuestionIndex === currentQuiz.questions.length - 1) ? 'Finish & Claim XP 🎉' : 'Next Question →';
    return;
  }

  // Move to next question or submit
  if (currentQuestionIndex < currentQuiz.questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuizQuestion();
  } else {
    // Finish Quiz & Submit to backend
    await finishQuizSubmission();
  }
}

// Active quiz remediation object
let activeQuizRemediation = null;

async function finishQuizSubmission() {
  try {
    const res = await api.submitQuiz(currentQuiz.topic, currentQuiz.subject, userQuizAnswers);
    
    document.getElementById('quizActiveCard').classList.add('hidden');
    document.getElementById('quizCompleteScreen').classList.remove('hidden');

    document.getElementById('quizFinalScore').textContent = `${res.score} / ${res.total} (${res.percentage}%)`;
    document.getElementById('quizEarnedXP').textContent = `+${res.xp_earned} XP`;

    // Process & Render Personalized Remediation Recommendation
    activeQuizRemediation = res.remediation;
    const remediationContainer = document.getElementById('quizRemediationContainer');
    
    if (activeQuizRemediation && remediationContainer) {
      remediationContainer.classList.remove('hidden');
      
      const badge = document.getElementById('remediationScoreBadge');
      const planText = document.getElementById('remediationActionPlanText');
      const weakTags = document.getElementById('remediationWeakTags');
      
      if (res.percentage >= 80) {
        badge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30';
        badge.textContent = 'High Mastery Achieved';
      } else {
        badge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30';
        badge.textContent = 'Targeted Focus Identified';
      }

      planText.textContent = activeQuizRemediation.review_action_plan || 'Review the core concepts and test your understanding with Socratic questioning.';

      // Render weak concepts tags
      weakTags.innerHTML = '';
      const concepts = activeQuizRemediation.weak_concepts || [];
      if (concepts.length > 0) {
        concepts.forEach(c => {
          const tag = document.createElement('span');
          tag.className = 'px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-medium flex items-center gap-1';
          tag.innerHTML = `<span>⚠️</span> ${escapeHtml(c)}`;
          weakTags.appendChild(tag);
        });
      } else {
        const tag = document.createElement('span');
        tag.className = 'px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-medium';
        tag.textContent = 'No critical misconceptions detected!';
        weakTags.appendChild(tag);
      }
    }

    // Confetti celebration if score is high!
    if (res.percentage >= 70 && window.confetti) {
      window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }

    // Refresh Dashboard stats so weak areas and mastery radar update immediately
    if (window.loadDashboardStats) window.loadDashboardStats();
  } catch (e) {
    alert('Error submitting quiz: ' + e.message);
  }
}

// Seamless 1-click bridge from Quiz misses to Socratic Remediation
function launchRemediationTutor(explicitTopic, explicitPrompt) {
  const topic = explicitTopic || activeQuizRemediation?.topic_name || currentQuiz?.topic || 'Dynamic Programming';
  const prompt = explicitPrompt || activeQuizRemediation?.suggested_tutor_prompt || `I recently completed a quiz on ${topic} and need help clarifying key concepts. Could you guide me through them Socratically?`;

  // Navigate to tutor view
  navigateTo('tutor');

  // Set topic in tutor controller
  if (typeof setTutorTopic === 'function') {
    setTutorTopic(topic);
  } else {
    const topicLabel = document.getElementById('tutorActiveTopic');
    if (topicLabel) topicLabel.textContent = `Context: ${topic}`;
  }

  // Pre-fill input and trigger send
  const inputEl = document.getElementById('tutorChatInput');
  if (inputEl) {
    inputEl.value = prompt;
    setTimeout(() => {
      sendTutorMessage();
    }, 250);
  }
}
