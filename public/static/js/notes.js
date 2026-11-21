// Smart Notes & Cheatsheet Controller with Persistent Library Support
let currentGeneratedNote = null;
let savedNotesCache = [];
let currentlyOpenedNoteId = null;

async function processSmartNotes() {
  const title = document.getElementById('notesTitleInput').value.trim() || 'Lecture Notes';
  const content = document.getElementById('notesContentInput').value.trim();
  const autoFlashcards = document.getElementById('notesGenFlashcards').checked;

  if (!content) {
    alert('Please enter or paste your study notes first.');
    return;
  }

  const submitBtn = document.getElementById('notesSubmitBtn');
  const resultContainer = document.getElementById('notesResult');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span>⏳</span> Analyzing & Synthesizing...';

  try {
    const data = await api.summarizeNotes(content, title, autoFlashcards);
    
    // Cache the generated payload for saving/exporting
    currentGeneratedNote = {
      title: title,
      raw_content: content,
      original_content: content,
      summary: data.executive_summary,
      executive_summary: data.executive_summary,
      key_takeaways: data.key_takeaways,
      cheatsheet_formulas: data.cheatsheet_formulas,
      glossary: data.glossary,
      topic: title.includes(':') ? title.split(':')[1].trim() : title
    };

    renderNotesResult(data, title);
    resultContainer.classList.remove('hidden');

    if (autoFlashcards && window.confetti) {
      window.confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
    }

    // Refresh Dashboard stats
    if (window.loadDashboardStats) window.loadDashboardStats();
  } catch (err) {
    alert('Failed to process notes: ' + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>⚡</span> Generate Smart Summary & Cheatsheet';
  }
}

function renderNotesResult(data, title) {
  // Update header title
  const titleEl = document.getElementById('currentGeneratedNoteTitle');
  if (titleEl) titleEl.textContent = title || 'Generated Synthesis';

  // 1. Executive Summary
  document.getElementById('notesExecSummary').textContent = data.executive_summary;

  // 2. Key Takeaways
  const takeawaysList = document.getElementById('notesTakeawaysList');
  takeawaysList.innerHTML = '';
  data.key_takeaways.forEach(item => {
    const li = document.createElement('li');
    li.className = 'flex items-start gap-2';
    li.innerHTML = `<span class="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span> <span>${escapeHtml(item)}</span>`;
    takeawaysList.appendChild(li);
  });

  // 3. Formula Cheatsheet
  const formulasList = document.getElementById('notesFormulasList');
  formulasList.innerHTML = '';
  data.cheatsheet_formulas.forEach(formula => {
    const box = document.createElement('div');
    box.className = 'p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-xs text-purple-300';
    box.textContent = `$$${formula}$$`;
    formulasList.appendChild(box);
  });

  // 4. Glossary
  const glossaryGrid = document.getElementById('notesGlossaryGrid');
  glossaryGrid.innerHTML = '';
  data.glossary.forEach(g => {
    const card = document.createElement('div');
    card.className = 'p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1';
    card.innerHTML = `
      <span class="font-bold text-amber-400 block">${escapeHtml(g.term)}</span>
      <p class="text-slate-300 leading-relaxed">${escapeHtml(g.definition)}</p>
    `;
    glossaryGrid.appendChild(card);
  });

  // Render MathKaTeX
  renderMathInNotes(document.getElementById('notesResult'));
}

function renderMathInNotes(element) {
  if (window.renderMathInElement && element) {
    window.renderMathInElement(element, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }
}

// Subtab switcher: Generate vs Saved Notes Library
function switchNotesSubTab(tab) {
  const genTab = document.getElementById('notesTab-generate');
  const libTab = document.getElementById('notesTab-library');
  const genPanel = document.getElementById('notesPanel-generate');
  const libPanel = document.getElementById('notesPanel-library');

  if (tab === 'generate') {
    genTab.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow transition flex items-center gap-2';
    libTab.className = 'px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60 transition flex items-center gap-2';
    genPanel.classList.remove('hidden');
    libPanel.classList.add('hidden');
  } else {
    libTab.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow transition flex items-center gap-2';
    genTab.className = 'px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700/60 transition flex items-center gap-2';
    libPanel.classList.remove('hidden');
    genPanel.classList.add('hidden');
    loadSavedNotesLibrary();
  }
}

// Save Current Note to SQLite Database
async function saveCurrentNoteToLibrary() {
  if (!currentGeneratedNote) {
    alert('Please generate notes first before saving.');
    return;
  }

  const saveBtn = document.getElementById('saveNoteBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span>⏳</span> Saving...';

  try {
    const res = await api.saveNote(currentGeneratedNote);
    saveBtn.innerHTML = '<span>✓</span> Saved!';
    saveBtn.className = 'px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold shadow flex items-center gap-1.5 transition';

    if (window.confetti) {
      window.confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }

    // Refresh Library
    await loadSavedNotesLibrary();

    setTimeout(() => {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>💾</span> Save to Library';
      saveBtn.className = 'px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition';
    }, 2500);
  } catch (err) {
    alert('Failed to save note: ' + err.message);
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span>💾</span> Save to Library';
  }
}

// Load and Render Saved Notes Library
async function loadSavedNotesLibrary() {
  try {
    const notes = await api.getSavedNotes();
    savedNotesCache = notes;

    // Update count badges
    const badge = document.getElementById('savedNotesCountBadge');
    if (badge) badge.textContent = notes.length.toString();

    renderSavedNotesGrid(notes);
  } catch (err) {
    console.error('Failed to load saved notes library:', err);
  }
}

function renderSavedNotesGrid(notes) {
  const container = document.getElementById('savedNotesList');
  if (!container) return;
  container.innerHTML = '';

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-500 space-y-2">
        <span class="text-3xl block">📚</span>
        <p class="text-sm font-semibold">Your Saved Notes Library is currently empty.</p>
        <p class="text-xs text-slate-400">Generate a summary above and click "Save to Library" to store your notes here.</p>
      </div>
    `;
    return;
  }

  notes.forEach(note => {
    const card = document.createElement('div');
    card.className = 'p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-brand-500/40 transition flex flex-col justify-between space-y-3 group';
    
    const formattedDate = note.created_at ? note.created_at.split('T')[0] : 'Recently';

    card.innerHTML = `
      <div class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30 truncate max-w-[140px]">
            ${escapeHtml(note.topic || 'STEM')}
          </span>
          <span class="text-[10px] text-slate-500 font-mono">${formattedDate}</span>
        </div>
        <h4 class="text-sm font-bold text-white group-hover:text-brand-300 transition line-clamp-1">${escapeHtml(note.title)}</h4>
        <p class="text-xs text-slate-400 line-clamp-3 leading-relaxed">${escapeHtml(note.executive_summary)}</p>
      </div>

      <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
        <span class="text-[11px] text-slate-500">✨ ${note.takeaways_count} Takeaways</span>
        <div class="flex items-center gap-1.5">
          <button onclick="viewSavedNote(${note.id})" class="px-3 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 font-semibold border border-brand-500/30 transition">
            View Note →
          </button>
          <button onclick="deleteSavedNoteById(${note.id}, event)" title="Delete" class="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition">
            🗑️
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterSavedNotes(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderSavedNotesGrid(savedNotesCache);
    return;
  }
  const filtered = savedNotesCache.filter(n => 
    (n.title && n.title.toLowerCase().includes(q)) ||
    (n.topic && n.topic.toLowerCase().includes(q)) ||
    (n.executive_summary && n.executive_summary.toLowerCase().includes(q))
  );
  renderSavedNotesGrid(filtered);
}

// View Note Detail in Modal
async function viewSavedNote(id) {
  try {
    currentlyOpenedNoteId = id;
    const note = await api.getSavedNoteById(id);
    
    document.getElementById('detailNoteTitle').textContent = note.title;
    document.getElementById('detailNoteTopicBadge').textContent = note.topic || 'General STEM';
    document.getElementById('detailNoteDate').textContent = note.created_at ? note.created_at.split('T')[0] : 'Saved';
    document.getElementById('detailNoteExecSummary').textContent = note.executive_summary;

    // Takeaways
    const takeawaysList = document.getElementById('detailNoteTakeawaysList');
    takeawaysList.innerHTML = '';
    (note.key_takeaways || []).forEach(item => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-1.5';
      li.innerHTML = `<span class="text-emerald-400 font-bold shrink-0">✓</span> <span>${escapeHtml(item)}</span>`;
      takeawaysList.appendChild(li);
    });

    // Formulas
    const formulasList = document.getElementById('detailNoteFormulasList');
    formulasList.innerHTML = '';
    (note.cheatsheet_formulas || []).forEach(f => {
      const box = document.createElement('div');
      box.className = 'p-2 rounded-lg bg-slate-950 border border-slate-800 text-center font-mono text-xs text-purple-300';
      box.textContent = `$$${f}$$`;
      formulasList.appendChild(box);
    });

    // Glossary
    const glossaryGrid = document.getElementById('detailNoteGlossaryGrid');
    glossaryGrid.innerHTML = '';
    (note.glossary || []).forEach(g => {
      const card = document.createElement('div');
      card.className = 'p-2.5 rounded-xl bg-slate-850 border border-slate-700/60 space-y-0.5';
      card.innerHTML = `
        <span class="font-bold text-amber-400 block">${escapeHtml(g.term)}</span>
        <p class="text-slate-300 leading-relaxed text-[11px]">${escapeHtml(g.definition)}</p>
      `;
      glossaryGrid.appendChild(card);
    });

    const modal = document.getElementById('savedNoteDetailModal');
    modal.classList.remove('hidden');

    renderMathInNotes(modal);
  } catch (err) {
    alert('Failed to load note: ' + err.message);
  }
}

function closeNoteDetailModal() {
  document.getElementById('savedNoteDetailModal').classList.add('hidden');
  currentlyOpenedNoteId = null;
}

async function deleteCurrentOpenedNote() {
  if (!currentlyOpenedNoteId) return;
  if (!confirm('Are you sure you want to delete this saved note?')) return;

  try {
    await api.deleteSavedNote(currentlyOpenedNoteId);
    closeNoteDetailModal();
    await loadSavedNotesLibrary();
  } catch (err) {
    alert('Failed to delete note: ' + err.message);
  }
}

async function deleteSavedNoteById(id, event) {
  if (event) event.stopPropagation();
  if (!confirm('Are you sure you want to delete this note from your library?')) return;

  try {
    await api.deleteSavedNote(id);
    await loadSavedNotesLibrary();
  } catch (err) {
    alert('Failed to delete note: ' + err.message);
  }
}

// Markdown Export Helpers
function formatNoteAsMarkdown(note) {
  let md = `# ${note.title}\n\n`;
  md += `**Topic:** ${note.topic || 'General STEM'}\n\n`;
  md += `## 30-Second Executive Summary\n${note.executive_summary}\n\n`;
  
  md += `## Key Takeaways\n`;
  (note.key_takeaways || []).forEach(t => {
    md += `- ${t}\n`;
  });
  md += `\n`;

  if (note.cheatsheet_formulas && note.cheatsheet_formulas.length > 0) {
    md += `## Formula & Invariant Cheatsheet\n`;
    note.cheatsheet_formulas.forEach(f => {
      md += `$$\n${f}\n$$\n\n`;
    });
  }

  if (note.glossary && note.glossary.length > 0) {
    md += `## Vocabulary & Glossary\n`;
    note.glossary.forEach(g => {
      md += `- **${g.term}**: ${g.definition}\n`;
    });
  }

  return md;
}

function copyNoteMarkdown() {
  if (!currentGeneratedNote) return;
  const md = formatNoteAsMarkdown(currentGeneratedNote);
  navigator.clipboard.writeText(md).then(() => {
    alert('Markdown copied to clipboard!');
  });
}

function downloadNoteMarkdown() {
  if (!currentGeneratedNote) return;
  const md = formatNoteAsMarkdown(currentGeneratedNote);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentGeneratedNote.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyOpenedNoteMarkdown() {
  if (!currentlyOpenedNoteId) return;
  try {
    const note = await api.getSavedNoteById(currentlyOpenedNoteId);
    const md = formatNoteAsMarkdown(note);
    navigator.clipboard.writeText(md).then(() => {
      alert('Note copied as Markdown!');
    });
  } catch (err) {
    alert('Failed to export markdown: ' + err.message);
  }
}
