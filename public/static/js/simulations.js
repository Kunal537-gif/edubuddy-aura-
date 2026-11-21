// Deeply Interactive Concept Sandboxes & Simulations Controller
let currentSim = 'algo';

function switchSimulation(simKey) {
  currentSim = simKey;
  const sims = ['algo', 'physics', 'econ', 'attention'];
  sims.forEach(s => {
    const tabBtn = document.getElementById(`simtab-${s}`);
    const panel = document.getElementById(`sim-${s}`);
    if (!tabBtn || !panel) return;
    if (s === simKey) {
      tabBtn.className = 'px-3 py-1 rounded-lg font-medium bg-brand-600 text-white transition shadow';
      panel.classList.remove('hidden');
    } else {
      tabBtn.className = 'px-3 py-1 rounded-lg font-medium text-slate-400 hover:text-white transition';
      panel.classList.add('hidden');
    }
  });

  if (simKey === 'algo') {
    renderAlgoBars();
    updatePseudocodeDisplay();
  } else if (simKey === 'physics') {
    initPendulumSim();
  } else if (simKey === 'econ') {
    initEconSim();
  } else if (simKey === 'attention') {
    initAttentionSim();
  }
}

/* ========================================================
   1. GENUINELY INTERACTIVE ALGORITHM VISUALIZER
   ======================================================== */
let algoArray = [48, 15, 86, 32, 60, 24, 75, 10, 92, 40];
let algoSorting = false;
let algoPaused = false;
let algoComparisons = 0;
let algoSwaps = 0;
let algoStepIndex = 0;
let algoHistory = []; // Snapshots for Step-Backward functionality
let algoGenerator = null;
let algoDelay = 150;

// Algorithm Pseudocode definitions
const ALGO_PSEUDOCODE = {
  bubble: [
    { line: 1, text: "for i from 0 to n - 1:" },
    { line: 2, text: "  for j from 0 to n - i - 1:" },
    { line: 3, text: "    if array[j] > array[j + 1]:" },
    { line: 4, text: "      swap(array[j], array[j + 1])" },
    { line: 5, text: "  // rightmost elements guaranteed sorted" }
  ],
  insertion: [
    { line: 1, text: "for i from 1 to n - 1:" },
    { line: 2, text: "  key = array[i], j = i - 1" },
    { line: 3, text: "  while j >= 0 and array[j] > key:" },
    { line: 4, text: "    array[j + 1] = array[j]; j--" },
    { line: 5, text: "  array[j + 1] = key // inserted in order" }
  ],
  quick: [
    { line: 1, text: "pivot = array[high], i = low - 1" },
    { line: 2, text: "for j from low to high - 1:" },
    { line: 3, text: "  if array[j] < pivot: i++; swap(A[i], A[j])" },
    { line: 4, text: "swap(array[i + 1], array[high]) // pivot placed" },
    { line: 5, text: "return i + 1 // partition boundary" }
  ]
};

function resetAlgoSim() {
  algoSorting = false;
  algoPaused = false;
  algoComparisons = 0;
  algoSwaps = 0;
  algoStepIndex = 0;
  algoHistory = [];
  algoGenerator = null;

  document.getElementById('algoCompCount').textContent = '0';
  document.getElementById('algoSwapCount').textContent = '0';
  const playBtn = document.getElementById('algoPlayBtn');
  if (playBtn) playBtn.textContent = '▶ Play';

  updatePseudocodeDisplay(1);
  renderAlgoBars();
}

function applyCustomArray() {
  const input = document.getElementById('customArrayInput');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;

  const parsed = raw.split(/[,;\s]+/)
    .map(x => parseInt(x))
    .filter(x => !isNaN(x) && x > 0 && x <= 100);

  if (parsed.length < 3) {
    alert('Please enter at least 3 numbers between 1 and 100.');
    return;
  }

  algoArray = parsed.slice(0, 20); // Cap at 20 bars for crisp display
  resetAlgoSim();
}

function setAlgoPreset(preset) {
  if (preset === 'random') {
    algoArray = Array.from({ length: 12 }, () => Math.floor(Math.random() * 85) + 10);
  } else if (preset === 'reverse') {
    algoArray = [95, 84, 75, 66, 54, 45, 36, 25, 18, 10];
  } else if (preset === 'nearly') {
    algoArray = [12, 20, 28, 42, 35, 55, 62, 78, 70, 90];
  }
  const input = document.getElementById('customArrayInput');
  if (input) input.value = algoArray.join(', ');
  resetAlgoSim();
}

function setAlgoSpeed(ms) {
  algoDelay = parseInt(ms);
  const display = document.getElementById('algoSpeedVal');
  if (display) display.textContent = `${algoDelay}ms`;
}

function updatePseudocodeDisplay(activeLine = 1) {
  const container = document.getElementById('algoPseudocodeBox');
  if (!container) return;
  const type = document.getElementById('algoSelect')?.value || 'bubble';
  const lines = ALGO_PSEUDOCODE[type] || ALGO_PSEUDOCODE.bubble;

  container.innerHTML = lines.map(l => `
    <div class="pseudocode-line ${l.line === activeLine ? 'active' : 'text-slate-400'}">
      <span class="text-slate-600 mr-2">${l.line}</span>${escapeHtml(l.text)}
    </div>
  `).join('');
}

function renderAlgoBars(highlightIndices = [], sortedIndices = []) {
  const container = document.getElementById('algoBarsContainer');
  if (!container) return;
  container.innerHTML = '';
  
  const maxVal = Math.max(...algoArray, 100);

  algoArray.forEach((val, idx) => {
    const barWrap = document.createElement('div');
    barWrap.className = 'flex flex-col items-center gap-1 group relative';

    const bar = document.createElement('div');
    const heightPx = Math.round((val / maxVal) * 200) + 20;
    bar.style.height = `${heightPx}px`;
    bar.className = 'w-5 sm:w-6 rounded-t-lg transition-all duration-100 flex items-end justify-center shadow cursor-pointer';

    if (sortedIndices.includes(idx)) {
      bar.classList.add('bg-emerald-500', 'shadow-emerald-500/20');
    } else if (highlightIndices.includes(idx)) {
      bar.classList.add('bg-rose-500', 'shadow-rose-500/30', 'scale-105');
    } else {
      bar.classList.add('bg-brand-500', 'hover:bg-brand-400');
    }

    // Number label on bar
    const label = document.createElement('span');
    label.className = 'text-[10px] font-mono font-bold text-slate-300';
    label.textContent = val;

    barWrap.appendChild(label);
    barWrap.appendChild(bar);
    container.appendChild(barWrap);
  });
}

// Generator-based Step-by-Step execution
function* bubbleSortGenerator() {
  const n = algoArray.length;
  for (let i = 0; i < n - 1; i++) {
    yield { line: 1, highlight: [], invariant: `Outer loop iteration ${i + 1} of ${n - 1}` };
    for (let j = 0; j < n - i - 1; j++) {
      algoComparisons++;
      yield { line: 2, highlight: [j, j + 1], invariant: `Comparing array[${j}] (${algoArray[j]}) and array[${j+1}] (${algoArray[j+1]})` };
      
      if (algoArray[j] > algoArray[j + 1]) {
        algoSwaps++;
        const temp = algoArray[j];
        algoArray[j] = algoArray[j + 1];
        algoArray[j + 1] = temp;
        yield { line: 4, highlight: [j, j + 1], invariant: `Swapped: ${algoArray[j]} and ${algoArray[j+1]}` };
      }
    }
    const sorted = Array.from({ length: i + 1 }, (_, k) => n - 1 - k);
    yield { line: 5, highlight: [], sorted, invariant: `Elements at indices ${sorted.join(', ')} are in their permanent sorted positions.` };
  }
  yield { line: 5, highlight: [], sorted: Array.from({ length: n }, (_, k) => k), invariant: `Array fully sorted in ${algoComparisons} comparisons!` };
}

function* insertionSortGenerator() {
  const n = algoArray.length;
  for (let i = 1; i < n; i++) {
    let key = algoArray[i];
    let j = i - 1;
    yield { line: 2, highlight: [i], invariant: `Picked key element array[${i}] = ${key}` };
    
    while (j >= 0 && algoArray[j] > key) {
      algoComparisons++;
      algoSwaps++;
      algoArray[j + 1] = algoArray[j];
      yield { line: 4, highlight: [j, j + 1], invariant: `Shifted ${algoArray[j]} right to make room for ${key}` };
      j = j - 1;
    }
    algoArray[j + 1] = key;
    yield { line: 5, highlight: [j + 1], invariant: `Inserted key ${key} at position ${j + 1}. Subarray [0...${i}] is now sorted.` };
  }
  yield { line: 5, highlight: [], sorted: Array.from({ length: n }, (_, k) => k), invariant: `Insertion Sort complete!` };
}

function getActiveGenerator() {
  const type = document.getElementById('algoSelect')?.value || 'bubble';
  if (type === 'insertion') {
    return insertionSortGenerator();
  }
  return bubbleSortGenerator();
}

// Step Forward execution
function stepForwardAlgo() {
  if (!algoGenerator) {
    algoGenerator = getActiveGenerator();
  }

  // Save snapshot to history for step backward
  algoHistory.push({
    array: [...algoArray],
    comparisons: algoComparisons,
    swaps: algoSwaps
  });

  const next = algoGenerator.next();
  if (next.done) {
    algoSorting = false;
    document.getElementById('algoPlayBtn').textContent = '✓ Done';
    return false;
  }

  const state = next.value;
  document.getElementById('algoCompCount').textContent = algoComparisons;
  document.getElementById('algoSwapCount').textContent = algoSwaps;
  document.getElementById('algoInvariantText').textContent = state.invariant || 'State updated';

  updatePseudocodeDisplay(state.line);
  renderAlgoBars(state.highlight || [], state.sorted || []);
  return true;
}

// Step Backward execution
function stepBackwardAlgo() {
  if (algoHistory.length === 0) return;
  const prev = algoHistory.pop();
  algoArray = [...prev.array];
  algoComparisons = prev.comparisons;
  algoSwaps = prev.swaps;

  document.getElementById('algoCompCount').textContent = algoComparisons;
  document.getElementById('algoSwapCount').textContent = algoSwaps;
  document.getElementById('algoInvariantText').textContent = 'Stepped back to previous state';

  renderAlgoBars();
}

// Continuous Play / Pause
async function toggleAlgoPlay() {
  const playBtn = document.getElementById('algoPlayBtn');
  if (algoSorting) {
    algoSorting = false;
    playBtn.textContent = '▶ Play';
    return;
  }

  algoSorting = true;
  playBtn.textContent = '⏸ Pause';

  while (algoSorting) {
    const hasMore = stepForwardAlgo();
    if (!hasMore) break;
    await sleep(algoDelay);
  }

  algoSorting = false;
  if (playBtn.textContent !== '✓ Done') {
    playBtn.textContent = '▶ Play';
  }
}

/* ========================================================
   2. GENUINELY INTERACTIVE PENDULUM WITH MOUSE DRAG & PHASE SPACE
   ======================================================== */
let pendulumRunning = false;
let pendulumAngle = Math.PI / 4;
let pendulumAngularVelocity = 0.0;
let pendulumLength = 150; // pixels
let isDraggingBob = false;
let pendulumMass = 1.0;
let phaseSpaceHistory = []; // stores (theta, omega) pairs for trajectory

function initPendulumSim() {
  const canvas = document.getElementById('pendulumCanvas');
  if (!canvas) return;

  // Attach mouse dragging listeners for genuine physical interactivity!
  canvas.onmousedown = handlePendulumMouseDown;
  window.onmousemove = handlePendulumMouseMove;
  window.onmouseup = handlePendulumMouseUp;

  // Touch support for tablets/mobiles
  canvas.ontouchstart = (e) => {
    const touch = e.touches[0];
    handlePendulumMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };
  window.ontouchmove = (e) => {
    if (isDraggingBob && e.touches[0]) {
      handlePendulumMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    }
  };
  window.ontouchend = handlePendulumMouseUp;

  if (!pendulumRunning) {
    pendulumRunning = true;
    loopPendulum();
  }
}

function handlePendulumMouseDown(e) {
  const canvas = document.getElementById('pendulumCanvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const originX = canvas.width / 2;
  const originY = 30;
  const bobX = originX + pendulumLength * Math.sin(pendulumAngle);
  const bobY = originY + pendulumLength * Math.cos(pendulumAngle);

  // Check if click is near the bob
  const dist = Math.hypot(mouseX - bobX, mouseY - bobY);
  if (dist < 36) {
    isDraggingBob = true;
    pendulumAngularVelocity = 0;
  }
}

function handlePendulumMouseMove(e) {
  if (!isDraggingBob) return;
  const canvas = document.getElementById('pendulumCanvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const originX = canvas.width / 2;
  const originY = 30;

  // Calculate new displacement angle from origin
  const dx = mouseX - originX;
  const dy = Math.max(15, mouseY - originY);
  pendulumAngle = Math.atan2(dx, dy);

  // Clamp angle to -80 deg to +80 deg
  pendulumAngle = Math.max(-1.4, Math.min(1.4, pendulumAngle));
  pendulumAngularVelocity = 0;
}

function handlePendulumMouseUp() {
  if (isDraggingBob) {
    isDraggingBob = false;
    phaseSpaceHistory = []; // Reset phase trajectory on release
  }
}

function togglePendulum() {
  pendulumRunning = !pendulumRunning;
  const btn = document.getElementById('pendulumToggleBtn');
  if (btn) btn.textContent = pendulumRunning ? '⏸ Pause' : '▶ Resume';
  if (pendulumRunning) loopPendulum();
}

function loopPendulum() {
  if (!pendulumRunning) return;
  const canvas = document.getElementById('pendulumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const g = parseFloat(document.getElementById('gravitySlider')?.value || 9.8);
  const damping = parseFloat(document.getElementById('dampingSlider')?.value || 0.001);
  const lengthSlider = parseFloat(document.getElementById('lengthSlider')?.value || 150);
  pendulumLength = lengthSlider;

  const gravEl = document.getElementById('gravityVal');
  const dampEl = document.getElementById('dampingVal');
  if (gravEl) gravEl.textContent = `${g.toFixed(1)} m/s²`;
  if (dampEl) dampEl.textContent = damping.toString();

  // If not currently dragging with mouse, integrate physics
  if (!isDraggingBob) {
    const angularAcceleration = (-g / (pendulumLength * 0.1)) * Math.sin(pendulumAngle);
    pendulumAngularVelocity += angularAcceleration * 0.05;
    pendulumAngularVelocity *= (1 - damping);
    pendulumAngle += pendulumAngularVelocity * 0.05;

    // Record phase space trajectory
    phaseSpaceHistory.push({ theta: pendulumAngle, omega: pendulumAngularVelocity });
    if (phaseSpaceHistory.length > 100) phaseSpaceHistory.shift();
  }

  // Energy calculations
  const v = (pendulumLength * 0.05) * pendulumAngularVelocity;
  const ke = 0.5 * pendulumMass * (v * v) * 12; // Kinetic Energy
  const h = (pendulumLength * 0.05) * (1 - Math.cos(pendulumAngle));
  const pe = pendulumMass * g * h * 3; // Potential Energy
  const totalE = Math.max(0.1, ke + pe);

  const kePct = Math.min(100, Math.round((ke / totalE) * 100));
  const pePct = 100 - kePct;

  const keVal = document.getElementById('keVal');
  const peVal = document.getElementById('peVal');
  const keBar = document.getElementById('keBar');
  const peBar = document.getElementById('peBar');
  if (keVal) keVal.textContent = `${Math.round(ke * 10)} J (${kePct}%)`;
  if (peVal) peVal.textContent = `${Math.round(pe * 10)} J (${pePct}%)`;
  if (keBar) keBar.style.width = `${kePct}%`;
  if (peBar) peBar.style.width = `${pePct}%`;

  // Draw on Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const originX = canvas.width / 2;
  const originY = 30;
  const bobX = originX + pendulumLength * Math.sin(pendulumAngle);
  const bobY = originY + pendulumLength * Math.cos(pendulumAngle);

  // If dragging, draw dashed arc showing release angle
  if (isDraggingBob) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(originX, originY, pendulumLength, Math.PI / 2 - 1.4, Math.PI / 2 + 1.4);
    ctx.stroke();
    ctx.setLineDash([]);

    // Angle degree callout
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px sans-serif';
    const deg = Math.round(pendulumAngle * (180 / Math.PI));
    ctx.fillText(`Release Angle: ${deg}°`, bobX - 35, bobY - 25);
  }

  // Draw Pivot
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(originX, originY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Draw String
  ctx.strokeStyle = isDraggingBob ? '#fbbf24' : '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(bobX, bobY);
  ctx.stroke();

  // Draw Pendulum Bob
  const grad = ctx.createRadialGradient(bobX, bobY, 4, bobX, bobY, 20);
  grad.addColorStop(0, isDraggingBob ? '#fbbf24' : '#60a5fa');
  grad.addColorStop(1, isDraggingBob ? '#d97706' : '#2563eb');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(bobX, bobY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw interactive drag hint on bob
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isDraggingBob ? 'Release' : 'Drag', bobX, bobY + 3.5);

  requestAnimationFrame(loopPendulum);
}

/* ========================================================
   3. SUPPLY & DEMAND EQUILIBRIUM SIMULATOR
   ======================================================== */
function initEconSim() {
  updateEconSim();
}

function updateEconSim() {
  const canvas = document.getElementById('econCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const P = parseInt(document.getElementById('econPriceSlider')?.value || 50);
  const demandShift = parseInt(document.getElementById('econDemandSlider')?.value || 0);

  const priceLabel = document.getElementById('econPriceLabel');
  const shiftLabel = document.getElementById('econDemandShiftLabel');
  if (priceLabel) priceLabel.textContent = `$${P}`;
  if (shiftLabel) shiftLabel.textContent = `${demandShift > 0 ? '+' : ''}${demandShift}`;

  // Qd = 100 - P + shift, Qs = P
  const Qd = Math.max(0, 100 - P + demandShift);
  const Qs = Math.max(0, P);
  const P_star = Math.round((100 + demandShift) / 2);
  const Q_star = P_star;

  const qdEl = document.getElementById('econQd');
  const qsEl = document.getElementById('econQs');
  if (qdEl) qdEl.textContent = `${Qd} units`;
  if (qsEl) qsEl.textContent = `${Qs} units`;

  // Status badge
  const badge = document.getElementById('econStatusBadge');
  if (badge) {
    if (P === P_star) {
      badge.className = 'text-emerald-400 font-bold';
      badge.textContent = '✓ Market Clears (Equilibrium)';
    } else if (P > P_star) {
      badge.className = 'text-amber-400 font-bold';
      badge.textContent = `Surplus: ${Qs - Qd} units (Supply exceeds demand)`;
    } else {
      badge.className = 'text-rose-400 font-bold';
      badge.textContent = `Shortage: ${Qd - Qs} units (Excess demand)`;
    }
  }

  // Draw Curves & Surplus Polygons
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pad = 40;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;

  // Axes
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, canvas.height - pad);
  ctx.lineTo(canvas.width - pad, canvas.height - pad);
  ctx.stroke();

  // Demand Line
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad + 10, pad + 10);
  ctx.lineTo(canvas.width - pad - 10, canvas.height - pad - 10);
  ctx.stroke();

  // Supply Line
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad + 10, canvas.height - pad - 10);
  ctx.lineTo(canvas.width - pad - 10, pad + 10);
  ctx.stroke();

  // Current Price Line
  const pY = (canvas.height - pad) - (P / 100) * h;
  ctx.strokeStyle = '#f59e0b';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, pY);
  ctx.lineTo(canvas.width - pad, pY);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ========================================================
   4. ATTENTION MECHANISM SPOTLIGHT MATRIX
   ======================================================== */
const ATTENTION_SENTENCE = ["The", "bank", "of", "the", "river", "had", "overflowing", "water"];
const ATTENTION_WEIGHTS = {
  "bank": { "river": 0.42, "water": 0.35, "overflowing": 0.12, "The": 0.05, "of": 0.03, "the": 0.02, "had": 0.01 },
  "river": { "water": 0.38, "overflowing": 0.30, "bank": 0.22, "The": 0.04, "of": 0.03, "had": 0.02, "the": 0.01 },
  "water": { "overflowing": 0.40, "river": 0.34, "bank": 0.18, "The": 0.03, "had": 0.03, "the": 0.01, "of": 0.01 }
};

function initAttentionSim() {
  const row = document.getElementById('attentionTokensRow');
  if (!row) return;
  row.innerHTML = '';

  ATTENTION_SENTENCE.forEach((word) => {
    const chip = document.createElement('button');
    chip.className = 'px-3.5 py-1.5 rounded-xl font-mono text-sm bg-slate-800 hover:bg-brand-600 text-white border border-slate-700 transition';
    chip.textContent = word;
    chip.onclick = () => selectAttentionWord(word);
    row.appendChild(chip);
  });

  selectAttentionWord('bank');
}

function selectAttentionWord(word) {
  const wordEl = document.getElementById('attentionActiveWord');
  if (wordEl) wordEl.textContent = `Query Token Spotlight: "${word}"`;
  const container = document.getElementById('attentionWeightsBars');
  if (!container) return;
  container.innerHTML = '';

  const weights = ATTENTION_WEIGHTS[word] || {
    "bank": 0.25, "river": 0.25, "water": 0.20, "overflowing": 0.15, "The": 0.08, "of": 0.04, "had": 0.02, "the": 0.01
  };

  Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .forEach(([targetWord, weight]) => {
      const pct = Math.round(weight * 100);
      const item = document.createElement('div');
      item.className = 'space-y-1 text-xs';
      item.innerHTML = `
        <div class="flex justify-between text-slate-300">
          <span class="font-mono font-medium">${targetWord}</span>
          <span class="text-brand-400 font-bold font-mono">${pct}%</span>
        </div>
        <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
        </div>
      `;
      container.appendChild(item);
    });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
