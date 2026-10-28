// Synthesised sound effects: no audio files, nothing plays until the player clicks something.
const KEY = 'ai-fushengji-sfx';
let ctx = null;
let enabled = true;
try { enabled = localStorage.getItem(KEY) !== 'off'; } catch {}

export const sfxEnabled = () => enabled;
export function setSfx(on) {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
}

function audio() {
  if (!enabled) return null;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq, start, length, { type = 'square', gain = .08, slide = 0 } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + start, osc = a.createOscillator(), amp = a.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + length);
  amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(gain, t + .008);
  amp.gain.exponentialRampToValueAtTime(.0001, t + length);
  osc.connect(amp).connect(a.destination); osc.start(t); osc.stop(t + length + .02);
}

function noise(start, length, gain = .05) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + start, buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource(), amp = a.createGain(), filter = a.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 2400;
  src.buffer = buffer; amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(a.destination); src.start(t);
}

const coin = start => { tone(988, start, .07, { gain: .06 }); tone(1319, start + .06, .18, { gain: .06 }); };

export const sfx = {
  click: () => tone(660, 0, .04, { type: 'triangle', gain: .04 }),
  // Bigger amounts get more coins: the sound tells the size of the win before the number does.
  coins(amount) {
    const n = amount >= 1200 ? 7 : amount >= 600 ? 4 : amount >= 200 ? 2 : 1;
    for (let i = 0; i < n; i++) coin(i * .09);
  },
  jackpot() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .08, .22, { gain: .07 }));
    for (let i = 0; i < 6; i++) coin(.45 + i * .07);
  },
  fail() { tone(392, 0, .28, { type: 'sawtooth', gain: .05, slide: -60 }); tone(311, .3, .5, { type: 'sawtooth', gain: .05, slide: -90 }); },
  alarm() { for (let i = 0; i < 3; i++) { tone(880, i * .32, .15, { gain: .05 }); tone(660, i * .32 + .16, .15, { gain: .05 }); } },
  sparkle() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * .06, .25, { type: 'triangle', gain: .05 })); },
  calm() { tone(523, 0, .5, { type: 'sine', gain: .07 }); tone(659, .12, .6, { type: 'sine', gain: .06 }); tone(784, .24, .8, { type: 'sine', gain: .05 }); },
  register() { noise(0, .06, .06); tone(1568, .05, .25, { type: 'triangle', gain: .06 }); tone(2093, .1, .35, { type: 'triangle', gain: .05 }); },
  thud() { tone(140, 0, .18, { type: 'sine', gain: .12, slide: -60 }); },
  pop() { tone(520, 0, .06, { type: 'triangle', gain: .05, slide: 300 }); },
  tick() { tone(1200, 0, .02, { type: 'square', gain: .02 }); },
  morning() { [659, 784, 988].forEach((f, i) => tone(f, i * .1, .35, { type: 'triangle', gain: .05 })); },
};
