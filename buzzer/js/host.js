// منطق شاشة المضيف: إنشاء الغرفة، عرض الأسئلة، تجهيز/قفل الباصرة، الترتيب اللحظي، النقاط.
import { supabase } from './supabase.js';
import { $, generateRoomCode } from './common.js';

let room = null;                  // { id, code, state, round, question }
const players = new Map();        // player_id -> { id, name, score }

const els = {
  start: $('#start'), host: $('#host'), createBtn: $('#createBtn'),
  roomCode: $('#roomCode'), playerCount: $('#playerCount'),
  question: $('#question'), sendQuestion: $('#sendQuestion'),
  armBtn: $('#armBtn'), lockBtn: $('#lockBtn'),
  roundNum: $('#roundNum'), ranking: $('#ranking'), players: $('#players'),
};

els.createBtn.addEventListener('click', createRoom);
els.sendQuestion.addEventListener('click', sendQuestion);
els.armBtn.addEventListener('click', armBuzzer);
els.lockBtn.addEventListener('click', lockBuzzer);

async function createRoom() {
  els.createBtn.disabled = true;
  els.createBtn.textContent = 'جاري الإنشاء…';

  // نولّد كود فريد، ونعيد المحاولة لو اتعارض (نادر).
  let created = null;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const code = generateRoomCode(4);
    const { data, error } = await supabase
      .from('rooms').insert({ code, state: 'lobby' }).select().single();
    if (!error) created = data;
  }
  if (!created) {
    els.createBtn.disabled = false;
    els.createBtn.textContent = 'أنشئ غرفة (حاول تاني)';
    return;
  }
  room = created;

  els.start.classList.remove('active');
  els.host.classList.add('active');
  els.roomCode.textContent = room.code;
  els.roundNum.textContent = room.round;
  await subscribe();
}

async function subscribe() {
  supabase
    .channel('host-' + room.id)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: 'room_id=eq.' + room.id },
      () => loadPlayers())
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'buzzes', filter: 'room_id=eq.' + room.id },
      ({ new: b }) => { if (b.round === room.round) loadRanking(); })
    .subscribe();
  await loadPlayers();
}

async function loadPlayers() {
  const { data } = await supabase
    .from('players').select('id, name, score').eq('room_id', room.id).order('joined_at');
  if (!data) return;
  players.clear();
  data.forEach((p) => players.set(p.id, p));
  els.playerCount.textContent = data.length;
  renderPlayers();
  renderRanking(currentRanking); // الأسماء ممكن تكون اتحدّثت
}

function renderPlayers() {
  if (players.size === 0) {
    els.players.innerHTML = '<li class="empty-note">في انتظار اللاعبين…</li>';
    return;
  }
  els.players.innerHTML = '';
  for (const p of players.values()) {
    const li = document.createElement('li');
    li.className = 'player-item';
    li.innerHTML =
      '<span class="rank-name">' + escapeHtml(p.name) + '</span>' +
      '<button class="btn btn-ghost mini" data-act="minus">−</button>' +
      '<span class="score-val">' + p.score + '</span>' +
      '<button class="btn btn-green mini" data-act="plus">+</button>';
    li.querySelector('[data-act="plus"]').addEventListener('click', () => changeScore(p, +1));
    li.querySelector('[data-act="minus"]').addEventListener('click', () => changeScore(p, -1));
    els.players.appendChild(li);
  }
}

async function changeScore(p, delta) {
  const newScore = (p.score ?? 0) + delta;
  p.score = newScore;
  renderPlayers();
  await supabase.from('players').update({ score: newScore }).eq('id', p.id);
}

let currentRanking = [];

async function loadRanking() {
  const { data } = await supabase
    .from('buzzes').select('player_id, created_at')
    .eq('room_id', room.id).eq('round', room.round)
    .order('created_at', { ascending: true });
  currentRanking = data || [];
  renderRanking(currentRanking);
}

function renderRanking(list) {
  if (!list || list.length === 0) {
    els.ranking.innerHTML = '<li class="empty-note">لسه محدش ضغط</li>';
    return;
  }
  const t0 = new Date(list[0].created_at).getTime();
  els.ranking.innerHTML = '';
  list.forEach((b, i) => {
    const p = players.get(b.player_id);
    const name = p ? p.name : 'لاعب';
    const delta = i === 0 ? 'الأول' : '+' + (new Date(b.created_at).getTime() - t0) + ' م.ث';
    const li = document.createElement('li');
    li.className = 'rank-item rank-' + (i + 1);
    li.innerHTML =
      '<span class="rank-num">' + (i + 1) + '</span>' +
      '<span class="rank-name">' + escapeHtml(name) + '</span>' +
      '<span class="rank-delta">' + delta + '</span>';
    els.ranking.appendChild(li);
  });
}

async function sendQuestion() {
  const q = els.question.value.trim();
  await supabase.from('rooms').update({ question: q }).eq('id', room.id);
  els.sendQuestion.textContent = 'تم العرض ✓';
  setTimeout(() => { els.sendQuestion.textContent = 'اعرض السؤال للاعبين'; }, 1500);
}

async function armBuzzer() {
  const q = els.question.value.trim();
  room.round += 1;
  room.state = 'armed';
  currentRanking = [];
  els.roundNum.textContent = room.round;
  renderRanking(currentRanking);
  // نبعت السؤال مع التجهيز عشان يبان عند اللاعبين في نفس اللحظة
  await supabase.from('rooms').update({ state: 'armed', round: room.round, question: q }).eq('id', room.id);
}

async function lockBuzzer() {
  room.state = 'locked';
  await supabase.from('rooms').update({ state: 'locked' }).eq('id', room.id);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
