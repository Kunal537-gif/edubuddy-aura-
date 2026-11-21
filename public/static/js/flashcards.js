// Spaced Repetition Flashcards Controller (SM-2 Algorithm)
let dueCards = [];
let currentCardIndex = 0;
let isFlipped = false;

async function loadDueFlashcards() {
  const filter = document.getElementById('flashcardFilterSubject').value;
  try {
    const cards = await api.getFlashcards(filter);
    dueCards = cards;
    currentCardIndex = 0;
    isFlipped = false;

    renderFlashcardUI();
  } catch (e) {
    console.error('Failed to load flashcards:', e);
  }
}

function renderFlashcardUI() {
  const cardEl = document.getElementById('flashcardCard');
  cardEl.classList.remove('is-flipped');
  isFlipped = false;

  if (dueCards.length === 0) {
    document.getElementById('fcTopicTag').textContent = '🎉 Deck Clear';
    document.getElementById('fcFrontText').textContent = 'All caught up! No flashcards due for review today.';
    document.getElementById('fcBackText').textContent = 'Great job staying consistent. New cards will appear according to your memory retention curve.';
    document.getElementById('fcMnemonicText').textContent = 'Rest and let memory consolidation work.';
    document.getElementById('fcCurrentIndex').textContent = '0';
    document.getElementById('fcTotalCount').textContent = '0';
    return;
  }

  const card = dueCards[currentCardIndex];
  document.getElementById('fcTopicTag').textContent = `${card.subject} • ${card.topic}`;
  document.getElementById('fcFrontText').textContent = card.front;
  document.getElementById('fcBackText').textContent = card.back;
  document.getElementById('fcMnemonicText').textContent = card.mnemonic || 'First principles connection.';
  document.getElementById('fcCurrentIndex').textContent = (currentCardIndex + 1).toString();
  document.getElementById('fcTotalCount').textContent = dueCards.length.toString();
}

function flipFlashcard() {
  const cardEl = document.getElementById('flashcardCard');
  isFlipped = !isFlipped;
  if (isFlipped) {
    cardEl.classList.add('is-flipped');
  } else {
    cardEl.classList.remove('is-flipped');
  }
}

async function rateFlashcard(quality) {
  if (dueCards.length === 0) return;

  const card = dueCards[currentCardIndex];
  try {
    await api.reviewFlashcard(card.id, quality);

    // Advance to next card
    if (currentCardIndex < dueCards.length - 1) {
      currentCardIndex++;
      renderFlashcardUI();
    } else {
      // Completed all cards in queue!
      dueCards = [];
      renderFlashcardUI();
      if (window.confetti) {
        window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
    }

    // Refresh Dashboard stats
    if (window.loadDashboardStats) window.loadDashboardStats();
  } catch (e) {
    console.error('Flashcard rating error:', e);
  }
}
