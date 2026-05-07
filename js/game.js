const screens = {
  menu: document.getElementById('menuScreen'),
  hub: document.getElementById('hubScreen'),
  long: document.getElementById('longScreen'),
  hammer: document.getElementById('hammerScreen'),
  hurdles: document.getElementById('hurdlesScreen'),
  high: document.getElementById('highScreen'),
  cv: document.getElementById('cvScreen'),
};

const completed = { long: false, hammer: false, hurdles: false, high: false };
const keys = {};
let current = 'menu';

const player = document.getElementById('hubPlayer');
const participateBtn = document.getElementById('participateBtn');
let playerX = 50;
let playerY = 70;
let nearby = null;

const zones = [
  { event: 'long', x: 19, y: 36, r: 12 },
  { event: 'hammer', x: 75, y: 36, r: 12 },
  { event: 'hurdles', x: 21, y: 72, r: 12 },
  { event: 'high', x: 75, y: 72, r: 12 },
  { event: 'podium', x: 50, y: 49, r: 10 },
];

function show(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  current = name;
  Object.keys(keys).forEach(k => keys[k] = false);

  if (name === 'hub') updateHub();
  if (name === 'long') initLong();
  if (name === 'hammer') initHammer();
  if (name === 'hurdles') initHurdles();
  if (name === 'high') initHigh();
}

function totalCompleted() { return Object.values(completed).filter(Boolean).length; }
function remaining() { return 4 - totalCompleted(); }
function allCompleted() { return remaining() === 0; }

function updateHub() {
  document.getElementById('hudProgress').textContent = `${totalCompleted()} / 4 pruebas`;
  const status = document.getElementById('podiumStatus');
  status.textContent = allCompleted()
    ? '¡Podio desbloqueado! Acércate y presiona E para ver el CV.'
    : `Faltan ${remaining()} ${remaining() === 1 ? 'prueba' : 'pruebas'} para desbloquear el CV`;

  document.querySelectorAll('.zone').forEach(zone => {
    const ev = zone.dataset.event;
    zone.classList.toggle('completed', completed[ev]);
  });

  detectNearby();
}

function setPlayerPosition() {
  player.style.left = `${playerX}%`;
  player.style.top = `${playerY}%`;
}

function movePlayer(dx, dy) {
  playerX = Math.max(9, Math.min(91, playerX + dx));
  playerY = Math.max(18, Math.min(88, playerY + dy));
  player.classList.toggle('running', dx !== 0 || dy !== 0);
  setPlayerPosition();
  detectNearby();
}

function detectNearby() {
  nearby = null;
  participateBtn.classList.remove('visible');

  for (const zone of zones) {
    const dist = Math.hypot(playerX - zone.x, playerY - zone.y);
    if (dist <= zone.r) {
      if (zone.event === 'podium') {
        if (!allCompleted()) {
          participateBtn.textContent = `FALTAN ${remaining()} PRUEBAS`;
        } else {
          participateBtn.textContent = 'E · VER CURRÍCULUM';
          nearby = 'cv';
        }
      } else {
        participateBtn.textContent = completed[zone.event] ? 'E · REPETIR PRUEBA' : 'E · PARTICIPAR';
        nearby = zone.event;
      }

      participateBtn.style.left = `${playerX}%`;
      participateBtn.style.top = `${playerY}%`;
      participateBtn.classList.add('visible');
      return;
    }
  }
}

function enterNearby() { if (nearby) show(nearby); }

function celebrateThen(eventName, callback) {
  completed[eventName] = true;
  const overlay = document.getElementById('celebration');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.add('hidden');
    callback?.();
    show('hub');
  }, 1850);
}

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  keys[key] = true;
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();

  if (key === 'escape' && current !== 'menu') show('hub');
  if (current === 'hub' && key === 'e') enterNearby();
  if (current === 'long' && e.code === 'Space') tryLongJump();
  if (current === 'hammer' && e.code === 'Space') tryHammer();
  if (current === 'hurdles') {
    if (key === 'c') hurdlesSpeed = Math.min(10, hurdlesSpeed + 1.5);
    if (e.code === 'Space') jumpHurdles();
  }
  if (current === 'high') {
    if (e.code === 'Space') jumpHigh();
    if (key === 'd') archHigh();
  }
});

window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

document.getElementById('startBtn').addEventListener('click', () => show('hub'));
document.getElementById('restartBtn').addEventListener('click', () => {
  Object.keys(completed).forEach(k => completed[k] = false);
  playerX = 50; playerY = 70; setPlayerPosition();
  show('menu');
});
participateBtn.addEventListener('click', enterNearby);
document.querySelectorAll('[data-exit]').forEach(btn => btn.addEventListener('click', () => show('hub')));

// Salto de longitud
let longX, longAttempts, longDone;
function initLong() {
  longX = 7; longAttempts = 3; longDone = false;
  document.getElementById('longAttempts').textContent = longAttempts;
  document.getElementById('longToast').textContent = 'Corre con C y salta con SPACE.';
}
function updateLong() {
  if (longDone) return;
  if (keys.c) longX += 0.55;
  longX = Math.min(88, longX);
  document.getElementById('longRunner').style.left = `${longX}%`;
  document.getElementById('longRunner').classList.toggle('running', keys.c);
  document.getElementById('longPosition').style.left = `${longX}%`;
  if (longX >= 88) missLong('Te pasaste de la línea.');
}
function tryLongJump() {
  if (longDone) return;
  const diff = Math.abs(longX - 49);
  if (diff <= 4.5) {
    longDone = true;
    document.getElementById('longToast').textContent = '¡Salto válido! 🎉';
    celebrateThen('long');
  } else {
    missLong(longX < 49 ? 'Saltaste muy temprano.' : 'Saltaste muy tarde.');
  }
}
function missLong(msg) {
  longAttempts--;
  document.getElementById('longAttempts').textContent = longAttempts;
  document.getElementById('longToast').textContent = msg;
  longX = 7;
  if (longAttempts <= 0) setTimeout(initLong, 800);
}

// Martillo
let hammerY, hammerDir, hammerHits, hammerDone;
function initHammer() {
  hammerY = 50; hammerDir = 1; hammerHits = 0; hammerDone = false;
  document.getElementById('hammerHits').textContent = hammerHits;
  document.getElementById('hammerToast').textContent = 'Busca el centro verde/amarillo.';
}
function updateHammer() {
  if (hammerDone) return;
  hammerY += hammerDir * 1.15;
  if (hammerY > 95 || hammerY < 5) hammerDir *= -1;
  document.getElementById('hammerNeedle').style.top = `${hammerY}%`;
}
function tryHammer() {
  if (hammerDone) return;
  if (hammerY >= 41 && hammerY <= 59) {
    hammerHits++;
    document.getElementById('hammerHits').textContent = hammerHits;
    document.getElementById('hammerToast').textContent = '¡Perfecto!';
    if (hammerHits >= 3) {
      hammerDone = true;
      celebrateThen('hammer');
    }
  } else {
    hammerHits = Math.max(0, hammerHits - 1);
    document.getElementById('hammerHits').textContent = hammerHits;
    document.getElementById('hammerToast').textContent = hammerY < 41 ? 'Muy tarde.' : 'Muy temprano.';
  }
}

// Vallas
let hurdlesX, hurdlesSpeed, hurdlesCleared, jumping, jumpTimer, hurdlesDone;
const hurdleTargets = [26, 37, 48, 59, 70, 81];
function initHurdles() {
  hurdlesX = 8; hurdlesSpeed = 0; hurdlesCleared = 0; jumping = false; jumpTimer = 0; hurdlesDone = false;
  document.getElementById('hurdlesCleared').textContent = 0;
  document.getElementById('hurdlesToast').textContent = 'Acelera con C. Salta cuando estés cerca de cada valla.';
}
function jumpHurdles() { if (!jumping) { jumping = true; jumpTimer = 38; } }
function updateHurdles() {
  if (hurdlesDone) return;
  hurdlesX += hurdlesSpeed * 0.11;
  hurdlesSpeed = Math.max(0, hurdlesSpeed - 0.08);
  const runner = document.getElementById('hurdleRunner');
  runner.style.left = `${hurdlesX}%`;
  runner.classList.toggle('running', hurdlesSpeed > 1);
  document.getElementById('hurdlesEnergy').style.width = `${Math.min(100, hurdlesSpeed * 10)}%`;

  if (jumping) {
    jumpTimer--;
    const h = Math.sin(((38 - jumpTimer) / 38) * Math.PI) * 85;
    runner.style.bottom = `${220 + h}px`;
    if (jumpTimer <= 0) { jumping = false; runner.style.bottom = '220px'; }
  }

  const target = hurdleTargets[hurdlesCleared];
  if (target && hurdlesX >= target - 1.5 && hurdlesX <= target + 2.5) {
    if (jumping) {
      hurdlesCleared++;
      document.getElementById('hurdlesCleared').textContent = hurdlesCleared;
      document.getElementById('hurdlesToast').textContent = '¡Valla superada!';
    } else {
      document.getElementById('hurdlesToast').textContent = 'Chocaste. Reiniciando prueba.';
      setTimeout(initHurdles, 750);
    }
  }

  if (hurdlesCleared >= 6 && hurdlesX > 88) {
    hurdlesDone = true;
    celebrateThen('hurdles');
  }
  if (hurdlesX > 96) setTimeout(initHurdles, 500);
}

// Salto de altura
let highX, highAttempt, highState, highTimer, arched, highDone;
function initHigh() {
  highX = 7; highAttempt = 1; highState = 'run'; highTimer = 0; arched = false; highDone = false;
  const runner = document.getElementById('highRunner');
  runner.style.left = `${highX}%`; runner.style.bottom = '220px'; runner.style.transform = 'none';
  document.getElementById('highAttempt').textContent = highAttempt;
  document.getElementById('highToast').textContent = 'Salta antes de la barra y presiona D arriba.';
}
function updateHigh() {
  if (highDone) return;
  const runner = document.getElementById('highRunner');
  if (highState === 'run') {
    if (keys.c) highX += 0.55;
    runner.classList.toggle('running', keys.c);
    if (highX > 78) failHigh('Te pasaste sin saltar.');
  }
  if (highState === 'jump') {
    highX += 0.45;
    highTimer--;
    const progress = (54 - highTimer) / 54;
    const h = Math.sin(progress * Math.PI) * 170;
    runner.style.bottom = `${220 + h}px`;
    runner.style.transform = arched ? 'rotate(-28deg)' : 'none';
    if (highTimer <= 0) {
      const success = highX >= 64 && highX <= 76 && arched;
      if (success) {
        highDone = true;
        celebrateThen('high');
      } else {
        failHigh('No pasaste la barra. Ajusta el salto y presiona D arriba.');
      }
    }
  }
  runner.style.left = `${highX}%`;
  document.getElementById('highPosition').style.left = `${Math.min(100, highX)}%`;
}
function jumpHigh() {
  if (highState !== 'run') return;
  highState = 'jump'; highTimer = 54; arched = false;
  document.getElementById('highToast').textContent = '¡Ahora presiona D!';
}
function archHigh() {
  if (highState === 'jump') {
    arched = true;
    document.getElementById('highToast').textContent = '¡Buena forma!';
  }
}
function failHigh(msg) {
  highAttempt++;
  document.getElementById('highToast').textContent = msg;
  if (highAttempt > 3) setTimeout(initHigh, 850);
  else {
    setTimeout(() => {
      highX = 7; highState = 'run'; highTimer = 0; arched = false;
      document.getElementById('highAttempt').textContent = highAttempt;
      const runner = document.getElementById('highRunner');
      runner.style.left = `${highX}%`; runner.style.bottom = '220px'; runner.style.transform = 'none';
    }, 700);
  }
}

function loop() {
  if (current === 'hub') {
    let dx = 0, dy = 0;
    if (keys.arrowleft) dx -= .42;
    if (keys.arrowright) dx += .42;
    if (keys.arrowup) dy -= .42;
    if (keys.arrowdown) dy += .42;
    if (dx || dy) movePlayer(dx, dy);
  }
  if (current === 'long') updateLong();
  if (current === 'hammer') updateHammer();
  if (current === 'hurdles') updateHurdles();
  if (current === 'high') updateHigh();
  requestAnimationFrame(loop);
}

setPlayerPosition();
loop();
