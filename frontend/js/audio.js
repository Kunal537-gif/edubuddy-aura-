// Ambient Study Audio Synthesizer using Web Audio API (100% Offline, Zero Assets)
let audioCtx = null;
let isPlaying = false;
let masterGain = null;
let pinkNoiseNode = null;
let oscBinauralLeft = null;
let oscBinauralRight = null;

function toggleFocusAudio() {
  if (isPlaying) {
    stopFocusAudio();
  } else {
    startFocusAudio();
  }
}

function startFocusAudio() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // 1. Generate gentle pink noise (rain soundscape)
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter for warm soft rain
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(masterGain);
    whiteNoise.start(0);
    pinkNoiseNode = whiteNoise;

    // 2. Binaural Beats for Alpha Wave (140 Hz base, 10 Hz difference for deep focus)
    const merger = audioCtx.createChannelMerger(2);

    oscBinauralLeft = audioCtx.createOscillator();
    oscBinauralLeft.type = 'sine';
    oscBinauralLeft.frequency.setValueAtTime(140, audioCtx.currentTime);

    oscBinauralRight = audioCtx.createOscillator();
    oscBinauralRight.type = 'sine';
    oscBinauralRight.frequency.setValueAtTime(150, audioCtx.currentTime); // 10 Hz alpha rhythm

    const binGain = audioCtx.createGain();
    binGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

    oscBinauralLeft.connect(merger, 0, 0);
    oscBinauralRight.connect(merger, 0, 1);
    merger.connect(binGain);
    binGain.connect(masterGain);

    oscBinauralLeft.start();
    oscBinauralRight.start();

    isPlaying = true;
    updateAudioUI(true);
  } catch (e) {
    console.error('Audio synthesizer error:', e);
  }
}

function stopFocusAudio() {
  if (pinkNoiseNode) {
    try { pinkNoiseNode.stop(); } catch (e) {}
    pinkNoiseNode = null;
  }
  if (oscBinauralLeft) {
    try { oscBinauralLeft.stop(); } catch (e) {}
    oscBinauralLeft = null;
  }
  if (oscBinauralRight) {
    try { oscBinauralRight.stop(); } catch (e) {}
    oscBinauralRight = null;
  }
  isPlaying = false;
  updateAudioUI(false);
}

function updateAudioUI(active) {
  const btn = document.getElementById('focusAudioBtn');
  const icon = document.getElementById('audioIcon');
  const label = document.getElementById('audioLabel');
  const toast = document.getElementById('audioToast');

  if (active) {
    btn.classList.add('bg-brand-600', 'text-white', 'border-brand-500');
    btn.classList.remove('bg-slate-800', 'text-slate-300');
    icon.textContent = '🔊';
    label.textContent = 'Focusing...';
    toast.classList.remove('hidden');
  } else {
    btn.classList.remove('bg-brand-600', 'text-white', 'border-brand-500');
    btn.classList.add('bg-slate-800', 'text-slate-300');
    icon.textContent = '🎧';
    label.textContent = 'Focus Sound';
    toast.classList.add('hidden');
  }
}
