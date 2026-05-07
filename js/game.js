const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const screens = {
  title: $('#screenTitle'),
  hub: $('#screenHub'),
  long: $('#screenLong'),
  hammer: $('#screenHammer'),
  hurdles: $('#screenHurdles'),
  high: $('#screenHigh'),
  cv: $('#screenCV')
};

const state = {
  screen: 'title',
  completed: { long: false, hammer: false, hurdles: false, high: false },
  keys: {},
  player: { x: 50, y: 62, nearby: null }
};

const eventNames = {
  long: 'Salto de Longitud',
  hammer: 'Lanzamiento de Martillo',
  hurdles: 'Salto con Vallas',
  high: 'Salto de Altura'
};

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[name].classList.add('active');
  state.screen = name;

  if (name === 'hub') updateHub();
  if (name === 'long') startLong();
  if (name === 'hammer') startHammer();
  if (name === 'hurdles') startHurdles();
  if (name === 'high') startHigh();
  if (name === 'cv') burstConfetti(120);
}

function completedCount() {
  return Object.values(state.completed).filter(Boolean).length;
}

function missingCount() {
  return 4 - completedCount();
}

function allCompleted() {
  return missingCount() === 0;
}

function updateTopProgress() {
  $('#topProgressText').textContent = `${completedCount()}/4 pruebas`;
  $('#btnCV').textContent = allCompleted() ? '📄 CV' : '🔒 CV';
  $('#btnCV').classList.toggle('locked', !allCompleted());
}

function updateHub() {
  updateTopProgress();
  const left = missingCount();
  $('#podiumStatus').textContent = allCompleted()
    ? 'Podio desbloqueado. Acércate y presiona E para ver el CV.'
    : `Te faltan ${left} ${left === 1 ? 'prueba' : 'pruebas'} para desbloquear el podio.`;

  $('#podiumMsg').innerHTML = allCompleted()
    ? 'Podio desbloqueado<br><small>Presiona E para ver el CV</small>'
    : `Podio bloqueado<br><small>Faltan ${left} ${left === 1 ? 'prueba' : 'pruebas'}</small>`;

  $('#podium').classList.toggle('locked-podium', !allCompleted());
  $('#podium').classList.toggle('unlocked-podium', allCompleted());

  $$('.event-marker').forEach((marker) => {
    const event = marker.dataset.event;
    marker.classList.toggle('completed', state.completed[event]);
  });

  $$('[data-medal]').forEach((item) => {
    const key = item.dataset.medal;
    item.textContent = `${state.completed[key] ? '✅' : '⬜'} ${eventNames[key]}`;
  });

  movePlayer(0, 0);
}

function completeEvent(eventKey) {
  if (!state.completed[eventKey]) state.completed[eventKey] = true;
  updateTopProgress();
  const left = missingCount();
  const text = allCompleted()
    ? '¡Completaste todas las pruebas! El podio ya está desbloqueado.'
    : `Te ${left === 1 ? 'falta' : 'faltan'} ${left} ${left === 1 ? 'prueba' : 'pruebas'} para abrir el podio.`;
  showCelebration('¡Prueba superada!', text, () => showScreen('hub'));
}

function showCelebration(title, text, onDone) {
  $('#celebrationTitle').textContent = title;
  $('#celebrationText').textContent = text;
  $('#celebration').classList.remove('hidden');
  burstConfetti(170);
  setTimeout(() => {
    $('#celebration').classList.add('hidden');
    if (typeof onDone === 'function') onDone();
  }, 1700);
}

function movePlayer(dx, dy) {
  const player = $('#player');
  state.player.x = Math.max(7, Math.min(93, state.player.x + dx));
  state.player.y = Math.max(14, Math.min(87, state.player.y + dy));
  player.style.left = `${state.player.x}%`;
  player.style.top = `${state.player.y}%`;
  player.classList.toggle('moving', dx !== 0 || dy !== 0);
  detectNearby();
}

const zones = [
  { event: 'long', x: 17, y: 29, r: 12 },
  { event: 'hammer', x: 82, y: 29, r: 12 },
  { event: 'hurdles', x: 17, y: 74, r: 12 },
  { event: 'high', x: 82, y: 74, r: 12 },
  { event: 'podium', x: 50, y: 47, r: 11 }
];

function detectNearby() {
  const prompt = $('#interactionPrompt');
  state.player.nearby = null;
  prompt.classList.add('hidden');

  for (const zone of zones) {
    const dist = Math.hypot(state.player.x - zone.x, state.player.y - zone.y);
    if (dist <= zone.r) {
      if (zone.event === 'podium') {
        prompt.textContent = allCompleted() ? 'E Ver CV' : `Faltan ${missingCount()} pruebas`;
        state.player.nearby = allCompleted() ? 'cv' : null;
      } else {
        prompt.textContent = state.completed[zone.event] ? 'E Repetir prueba' : 'E Participar';
        state.player.nearby = zone.event;
      }
      prompt.style.left = `${state.player.x}%`;
      prompt.style.top = `${state.player.y}%`;
      prompt.classList.remove('hidden');
      return;
    }
  }
}

function enterNearby() {
  if (!state.player.nearby) return;
  showScreen(state.player.nearby);
}

$('#startGame').addEventListener('click', () => showScreen('hub'));
$('#btnHub').addEventListener('click', () => showScreen('hub'));
$('#navHome').addEventListener('click', () => showScreen('title'));
$('#btnProgress').addEventListener('click', () => {
  if (state.screen !== 'hub') showScreen('hub');
  $('#progressPanel').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], { duration: 500 });
});
$('#btnCV').addEventListener('click', () => {
  if (allCompleted()) showScreen('cv');
  else showCelebration('CV bloqueado', `Todavía faltan ${missingCount()} ${missingCount() === 1 ? 'prueba' : 'pruebas'}.`);
});
$('#btnReset').addEventListener('click', () => {
  Object.keys(state.completed).forEach((key) => (state.completed[key] = false));
  state.player.x = 50;
  state.player.y = 62;
  showScreen('title');
  updateTopProgress();
});
$('#podium').addEventListener('click', () => { if (allCompleted()) showScreen('cv'); });
$('#interactionPrompt').addEventListener('click', enterNearby);
$('#playAgain').addEventListener('click', () => showScreen('hub'));
$('#openInstructions').addEventListener('click', () => $('#instructionsDialog').showModal());
$('#closeInstructions').addEventListener('click', () => $('#instructionsDialog').close());
$$('.event-marker').forEach((marker) => marker.addEventListener('click', () => showScreen(marker.dataset.event)));
$$('[data-exit]').forEach((button) => button.addEventListener('click', () => showScreen('hub')));

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  state.keys[key] = true;
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'spacebar'].includes(key)) event.preventDefault();

  if (key === 'escape' && state.screen !== 'title') showScreen('hub');
  if (state.screen === 'hub' && key === 'e') enterNearby();

  if (state.screen === 'long' && event.code === 'Space') jumpLong();
  if (state.screen === 'hammer' && event.code === 'Space') hitHammer();
  if (state.screen === 'hurdles') {
    if (key === 'c') hurdles.speed = Math.min(9, hurdles.speed + 1.45);
    if (event.code === 'Space') jumpHurdles();
  }
  if (state.screen === 'high') {
    if (event.code === 'Space') jumpHigh();
    if (key === 'd') archHigh();
  }
});

window.addEventListener('keyup', (event) => {
  state.keys[event.key.toLowerCase()] = false;
});

// Confetti / serpentinas
const canvas = $('#confettiCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function burstConfetti(count = 80) {
  const colors = ['#ffd957', '#ff4d4d', '#57dd69', '#28a8ff', '#ff9d25', '#b66dff'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
      y: window.innerHeight * 0.22 + Math.random() * 80,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -8 - 2,
      g: 0.22 + Math.random() * 0.14,
      size: 5 + Math.random() * 10,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 120 + Math.random() * 80
    });
  }
}

function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter((p) => p.life > 0 && p.y < canvas.height + 30);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.rot += p.vr;
    p.life--;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  requestAnimationFrame(drawConfetti);
}
drawConfetti();

// Long jump
let long = {};
function startLong() {
  long = { x: 90, attempts: 3, done: false, jumping: false };
  $('#longRunner').style.left = `${long.x}px`;
  $('#longRunner').style.bottom = '48px';
  $('#longRunner').classList.remove('jump');
  $('#longAttempts').textContent = '♥ ♥ ♥';
  $('#longMsg').textContent = 'Corre y salta en la zona correcta.';
}
function updateLong() {
  if (long.done) return;
  if (state.keys.c && !long.jumping) long.x += 4.4;
  if (long.x > window.innerWidth - 180) failLong('Te pasaste de la línea. Reiniciando intento.');
  $('#longRunner').style.left = `${long.x}px`;
}
function jumpLong() {
  if (long.done || long.jumping) return;
  const lineX = window.innerWidth * 0.48;
  const diff = Math.abs(long.x - lineX);
  long.jumping = true;
  $('#longRunner').classList.add('jump');
  setTimeout(() => $('#longRunner').classList.remove('jump'), 700);
  if (diff <= 38) {
    long.done = true;
    $('#longMsg').textContent = '¡Salto válido!';
    setTimeout(() => completeEvent('long'), 650);
  } else {
    const msg = long.x < lineX ? 'Saltaste muy temprano.' : 'Saltaste muy tarde.';
    setTimeout(() => failLong(msg), 650);
  }
}
function failLong(msg) {
  long.attempts--;
  $('#longAttempts').textContent = '♥ '.repeat(Math.max(0, long.attempts)).trim();
  $('#longMsg').textContent = msg;
  if (long.attempts <= 0) {
    $('#longMsg').textContent = 'Se acabaron los intentos. La prueba se reinicia.';
    setTimeout(startLong, 850);
  } else {
    long.x = 90;
    long.jumping = false;
  }
}

// Hammer throw
let hammer = {};
function startHammer() {
  hammer = { y: 50, dir: 1, hits: 0, done: false };
  $('#hammerMsg').textContent = 'Busca el timing perfecto.';
  updateHammerDots();
}
function updateHammer() {
  if (hammer.done) return;
  hammer.y += hammer.dir * 1.8;
  if (hammer.y > 93 || hammer.y < 7) hammer.dir *= -1;
  $('#meterArrow').style.top = `${hammer.y}%`;
}
function updateHammerDots() {
  $$('#hammerHits span').forEach((dot, index) => dot.classList.toggle('done', index < hammer.hits));
}
function hitHammer() {
  if (hammer.done) return;
  if (hammer.y >= 52 && hammer.y <= 72) {
    hammer.hits++;
    updateHammerDots();
    $('#hammerMsg').textContent = hammer.hits < 3 ? '¡Buen golpe! Repite el timing.' : '¡Lanzamiento perfecto!';
    if (hammer.hits >= 3) {
      hammer.done = true;
      $('.hammer-ball').animate([
        { transform: 'translate(0,0) scale(1)' },
        { transform: 'translate(220px,-160px) scale(.8)' },
        { transform: 'translate(520px,-80px) scale(.45)', opacity: 0 }
      ], { duration: 850, easing: 'ease-out' });
      setTimeout(() => completeEvent('hammer'), 850);
    }
  } else {
    hammer.hits = Math.max(0, hammer.hits - 1);
    updateHammerDots();
    $('#hammerMsg').textContent = hammer.y < 52 ? 'Muy tarde: presionaste arriba de la zona.' : 'Muy temprano: presionaste abajo de la zona.';
  }
}

// Hurdles
let hurdles = {};
function startHurdles() {
  hurdles = { x: 90, speed: 0, jumping: false, jumpTime: 0, cleared: 0, positions: [280, 455, 630, 805, 980, 1155], done: false };
  $('#hurdleCounter').textContent = '0';
  $('#hurdlesMsg').textContent = 'Acelera con C y salta con SPACE.';
  $('#hurdleRunner').style.left = `${hurdles.x}px`;
  $('#hurdleRunner').style.bottom = '48px';
  renderHurdles();
}
function renderHurdles() {
  $('#hurdleSet').innerHTML = hurdles.positions.map((x, i) => `<div class="hurdle" data-index="${i}" style="left:${x}px"></div>`).join('');
}
function jumpHurdles() {
  if (hurdles.jumping) return;
  hurdles.jumping = true;
  hurdles.jumpTime = 42;
}
function updateHurdles() {
  if (hurdles.done) return;
  hurdles.x += hurdles.speed;
  hurdles.speed = Math.max(0, hurdles.speed - 0.075);
  const runner = $('#hurdleRunner');
  runner.style.left = `${hurdles.x}px`;
  $('#speedFill').style.scale = `${Math.min(1, hurdles.speed / 9)} 1`;

  if (hurdles.jumping) {
    hurdles.jumpTime--;
    const progress = (42 - hurdles.jumpTime) / 42;
    const jumpHeight = Math.sin(progress * Math.PI) * 95;
    runner.style.bottom = `${48 + jumpHeight}px`;
    if (hurdles.jumpTime <= 0) {
      hurdles.jumping = false;
      runner.style.bottom = '48px';
    }
  }

  const nextIndex = hurdles.cleared;
  const nextX = hurdles.positions[nextIndex];
  if (nextX && hurdles.x > nextX - 25 && hurdles.x < nextX + 38) {
    if (hurdles.jumping) {
      const hurdle = $(`.hurdle[data-index="${nextIndex}"]`);
      if (hurdle) hurdle.classList.add('cleared');
      hurdles.cleared++;
      $('#hurdleCounter').textContent = hurdles.cleared;
      $('#hurdlesMsg').textContent = '¡Valla superada!';
    } else {
      $('#hurdlesMsg').textContent = 'Chocaste con una valla. Reiniciando.';
      setTimeout(startHurdles, 850);
    }
  }
  if (hurdles.cleared >= 6 && hurdles.x > window.innerWidth - 160) {
    hurdles.done = true;
    completeEvent('hurdles');
  }
  if (hurdles.x > window.innerWidth + 80) setTimeout(startHurdles, 500);
}

// High jump
let high = {};
function startHigh() {
  high = { x: 90, attempt: 1, jumping: false, jumpTime: 0, arched: false, done: false };
  $('#highAttempt').textContent = '1';
  $('#highRunner').style.left = `${high.x}px`;
  $('#highRunner').style.bottom = '50px';
  $('#highRunner').classList.remove('arch');
  $('#highMsg').textContent = 'Salta cerca de la barra y arquea el cuerpo.';
}
function updateHigh() {
  if (high.done) return;
  const runner = $('#highRunner');
  const barX = window.innerWidth - 335;
  if (state.keys.c && !high.jumping) high.x += 4.4;
  if (high.jumping) {
    high.jumpTime--;
    high.x += 3.6;
    const progress = (58 - high.jumpTime) / 58;
    const jumpHeight = Math.sin(progress * Math.PI) * 170;
    runner.style.bottom = `${50 + jumpHeight}px`;
    if (high.jumpTime <= 0) {
      const success = Math.abs(high.x - barX) <= 95 && high.arched;
      if (success) {
        high.done = true;
        $('#highMsg').textContent = '¡Pasaste la barra!';
        setTimeout(() => completeEvent('high'), 500);
      } else {
        high.attempt++;
        if (high.attempt > 3) {
          $('#highMsg').textContent = 'Se acabaron los intentos. Reiniciando prueba.';
          setTimeout(startHigh, 850);
        } else {
          $('#highAttempt').textContent = high.attempt;
          high.x = 90;
          high.jumping = false;
          high.arched = false;
          runner.classList.remove('arch');
          runner.style.bottom = '50px';
          $('#highMsg').textContent = 'Intenta saltar más cerca de la barra y presiona D en el aire.';
        }
      }
    }
  }
  if (!high.jumping && high.x > window.innerWidth - 120) {
    high.attempt++;
    if (high.attempt > 3) startHigh();
    else {
      high.x = 90;
      $('#highAttempt').textContent = high.attempt;
      $('#highMsg').textContent = 'Te pasaste sin saltar. Intenta otra vez.';
    }
  }
  runner.style.left = `${high.x}px`;
}
function jumpHigh() {
  if (high.jumping) return;
  high.jumping = true;
  high.jumpTime = 58;
  high.arched = false;
  $('#highRunner').classList.remove('arch');
  $('#highMsg').textContent = 'Ahora presiona D para arquearte.';
}
function archHigh() {
  if (!high.jumping) return;
  high.arched = true;
  $('#highRunner').classList.add('arch');
  $('#highMsg').textContent = '¡Buena forma!';
}

function loop() {
  if (state.screen === 'hub') {
    let dx = 0, dy = 0;
    if (state.keys.arrowleft) dx -= 0.45;
    if (state.keys.arrowright) dx += 0.45;
    if (state.keys.arrowup) dy -= 0.45;
    if (state.keys.arrowdown) dy += 0.45;
    if (dx || dy) movePlayer(dx, dy);
    else $('#player').classList.remove('moving');
  }
  if (state.screen === 'long') updateLong();
  if (state.screen === 'hammer') updateHammer();
  if (state.screen === 'hurdles') updateHurdles();
  if (state.screen === 'high') updateHigh();
  requestAnimationFrame(loop);
}

updateTopProgress();
updateHub();
loop();
