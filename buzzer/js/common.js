// دوال مشتركة بين شاشة المضيف واللاعب: توليد كود الغرفة، أصوات الباصرة، الاهتزاز، helpers.

// حروف/أرقام واضحة بدون حروف ملتبسة (0/O, 1/I) عشان يسهل قراءتها صوتياً.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(length = 4) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// ---- الصوت: WebAudio beep بدون ملفات صوت ----
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  return audioCtx;
}

// لازم يتنده عليها من داخل تفاعل المستخدم (ضغطة) عشان المتصفحات تسمح بالصوت.
export function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

// صوت الباصرة عند الضغط.
export function playBuzz() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.36);
}

// نغمة قصيرة لتنبيه "الباصرة جاهزة" عند اللاعب.
export function playArm() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.setValueAtTime(880, now + 0.1);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.26);
}

// اهتزاز الموبايل (لو مدعوم).
export function vibrate(pattern = 120) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ---- helpers ----
export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// تخزين بسيط في المتصفح (اسم اللاعب، آخر كود) عشان ما يكتبهمش كل مرة.
export const store = {
  get: (k) => {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); } catch { /* ignore */ }
  },
};
