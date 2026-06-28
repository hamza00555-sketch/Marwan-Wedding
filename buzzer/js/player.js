// منطق شاشة اللاعب: الانضمام بالكود، زرار الباصرة، الصوت/الاهتزاز، عرض الترتيب والنقاط.
import { supabase } from './supabase.js';
import { $, store, playBuzz, playArm, vibrate, unlockAudio } from './common.js';

let room = null;        // { id, code, state, round, question }
let player = null;      // { id, name, score }
let hasBuzzed = false;  // ضغطت في الجولة الحالية؟
let channel = null;

const els = {
  join: $('#join'), play: $('#play'),
  name: $('#name'), code: $('#code'), joinBtn: $('#joinBtn'), joinError: $('#joinError'),
  roomCode: $('#roomCode'), myName: $('#myName'), myScore: $('#myScore'),
  question: $('#question'), buzz: $('#buzz'), status: $('#status'),
};

// استرجاع اسم/كود محفوظين
els.name.value = store.get('buzzer_name') || '';
els.code.value = store.get('buzzer_code') || '';

els.joinBtn.addEventListener('click', join);
els.code.addEventListener('input', () => { els.code.value = els.code.value.toUpperCase(); });

async function join() {
  unlockAudio(); // فتح الصوت من داخل ضغطة المستخدم
  const name = els.name.value.trim();
  const code = els.code.value.trim().toUpperCase();
  els.joinError.textContent = '';
  if (!name) { els.joinError.textContent = 'اكتب اسمك'; return; }
  if (code.length < 4) { els.joinError.textContent = 'اكتب كود الغرفة (4 حروف)'; return; }

  els.joinBtn.disabled = true;
  els.joinBtn.textContent = 'جاري الدخول…';

  const { data: rooms, error } = await supabase
    .from('rooms').select('id, code, state, round, question').eq('code', code).limit(1);

  if (error) { fail('في مشكلة في الاتصال، جرّب تاني'); return; }
  if (!rooms || rooms.length === 0) { fail('الكود غلط أو الغرفة مش موجودة'); return; }
  room = rooms[0];

  const { data: p, error: pErr } = await supabase
    .from('players').insert({ room_id: room.id, name }).select().single();
  if (pErr) { fail('معرفناش نضيفك، جرّب تاني'); return; }
  player = p;

  store.set('buzzer_name', name);
  store.set('buzzer_code', code);

  enterPlayScreen();
  await subscribe();
  await refreshAll();
}

function fail(msg) {
  els.joinError.textContent = msg;
  els.joinBtn.disabled = false;
  els.joinBtn.textContent = 'ادخل';
}

function enterPlayScreen() {
  els.join.classList.remove('active');
  els.play.classList.add('active');
  els.roomCode.textContent = room.code;
  els.myName.textContent = player.name;
  els.myScore.textContent = player.score ?? 0;
}

async function subscribe() {
  channel = supabase
    .channel('room-' + room.id)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rooms', filter: 'id=eq.' + room.id },
      ({ new: r }) => onRoomChange(r))
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'players', filter: 'id=eq.' + player.id },
      ({ new: p }) => { player = p; els.myScore.textContent = p.score; })
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'buzzes', filter: 'room_id=eq.' + room.id },
      ({ new: b }) => { if (b.round === room.round) refreshMyRank(); })
    .subscribe();
}

async function refreshAll() {
  const { data: r } = await supabase
    .from('rooms').select('id, code, state, round, question').eq('id', room.id).single();
  if (r) onRoomChange(r);
}

function onRoomChange(r) {
  const newRound = r.round !== room.round;
  room = { ...room, ...r };

  // السؤال
  if (room.question) { els.question.textContent = room.question; els.question.classList.remove('empty'); }
  else { els.question.textContent = 'في انتظار السؤال…'; els.question.classList.add('empty'); }

  if (room.state === 'armed') {
    if (newRound || hasBuzzed === false) {
      // جولة جديدة جاهزة
      if (newRound) { hasBuzzed = false; els.status.textContent = ''; }
      if (!hasBuzzed) {
        els.buzz.disabled = false;
        els.buzz.className = 'armed';
        els.buzz.textContent = 'دوس!';
        if (newRound) { playArm(); vibrate(60); }
      }
    }
  } else {
    // lobby أو locked: مفيش ضغط
    if (room.state === 'lobby') {
      hasBuzzed = false;
      els.buzz.disabled = true;
      els.buzz.className = '';
      els.buzz.textContent = 'استنى…';
      if (!hasBuzzed) els.status.textContent = '';
    } else if (!hasBuzzed) {
      els.buzz.disabled = true;
      els.buzz.className = '';
      els.buzz.textContent = 'اتقفلت';
    }
  }
}

async function pressBuzz() {
  if (hasBuzzed || els.buzz.disabled || room.state !== 'armed') return;
  hasBuzzed = true;
  els.buzz.disabled = true;
  els.buzz.classList.add('pressed');
  els.buzz.textContent = '✓';
  playBuzz();
  vibrate([0, 80, 40, 120]);

  const { error } = await supabase
    .from('buzzes').insert({ room_id: room.id, round: room.round, player_id: player.id });
  if (error) { els.status.textContent = 'حصل خطأ، حاول الجولة الجاية'; return; }
  els.status.textContent = 'تم! بنحسب ترتيبك…';
  refreshMyRank();
}

els.buzz.addEventListener('click', pressBuzz);

async function refreshMyRank() {
  if (!hasBuzzed) return;
  const { data } = await supabase
    .from('buzzes').select('player_id, created_at')
    .eq('room_id', room.id).eq('round', room.round)
    .order('created_at', { ascending: true });
  if (!data) return;
  const idx = data.findIndex((b) => b.player_id === player.id);
  if (idx === -1) return;
  const rank = idx + 1;
  const label = rank === 1 ? '🥇 أنت الأول!' : 'أنت رقم #' + rank;
  els.status.innerHTML = '<span class="rank-badge">' + label + '</span>';
}
