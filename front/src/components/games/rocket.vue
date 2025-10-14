<template>
  <div class="rocket-game-container">
    <!-- Import Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">

    <!-- Header -->
    <header class="game-header">
      <div class="header-left">
        <button @click="goBack" class="btn-back" :disabled="hasPlacedBet">⬅ Volver</button>
        <h1 class="game-title">🚀 PascualBet</h1>
      </div>
      <div class="header-center">
        <h2 class="game-subtitle">Cohete</h2>
      </div>
      <div class="header-right">
        <div class="balance-display">
          <span>Apuesta</span>
          <strong :class="{ 'bet-active': betAmount > 0 }">${{ betAmount.toFixed(2) }}</strong>
        </div>
        <div class="balance-display">
          <span>Balance</span>
          <strong>${{ credits.toFixed(2) }}</strong>
        </div>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="main-layout">
      <!-- Área del Juego (Gráfico) -->
      <div class="game-area-wrapper">
        <div class="game-area">
          <div 
            class="multiplier-display" 
            :class="{ 'crashed-text': gameState === 'crashed', 'milestone-pulse': milestoneReached }"
          >
            <span v-if="gameState === 'running'">{{ currentMultiplier.toFixed(2) }}x</span>
            <span v-if="gameState === 'crashed'">¡CRASH! @ {{ crashPoint.toFixed(2) }}x</span>
            <span v-if="gameState === 'waiting'">Esperando la siguiente ronda...</span>
            <span v-if="gameState === 'starting'">Despegando en {{ (countdown / 1000).toFixed(1) }}s</span>
          </div>
          <canvas ref="gameCanvas" width="800" height="450"></canvas>
        </div>

        <!-- Panel de Controles Inferior -->
        <div class="controls-panel-wrapper">
          <div class="controls-panel">
            <div class="bet-controls">
              <label>Monto de Apuesta</label>
              <div class="input-group">
                <button @click="decreaseBet" :disabled="isBettingLocked" class="btn control-btn">-</button>
                <input type="number" v-model.number="betAmount" :disabled="isBettingLocked" />
                <button @click="increaseBet" :disabled="isBettingLocked" class="btn control-btn">+</button>
              </div>
              <div class="quick-bet-buttons">
                <button @click="setBet(10)" :disabled="isBettingLocked" class="btn quick-bet-btn">$10</button>
                <button @click="setBet(25)" :disabled="isBettingLocked" class="btn quick-bet-btn">$25</button>
                <button @click="setBet(50)" :disabled="isBettingLocked" class="btn quick-bet-btn">$50</button>
                <button @click="setMaxBet" :disabled="isBettingLocked" class="btn quick-bet-btn">MAX</button>
              </div>
            </div>

            <div class="auto-cashout-controls">
              <label>Auto Retirar (Opcional)</label>
              <div class="input-group">
                <input type="number" v-model.number="autoCashout" :disabled="isBettingLocked" placeholder="2.00" />
                <span>x</span>
              </div>
            </div>

            <div class="action-controls">
              <button 
                class="btn action-button"
                :class="buttonClass"
                @click="handleAction"
                :disabled="buttonDisabled"
              >
                {{ buttonText }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de Información Derecho -->
      <div class="info-panel">
        <h2 class="info-title">Historial de Rondas</h2>
        <div class="history-list">
          <div v-for="(result, index) in history" :key="index" class="history-item" :class="getHistoryClass(result)">
            {{ result.toFixed(2) }}x
          </div>
        </div>
        <div v-if="gameMessage" class="game-message" :class="messageClass">
          {{ gameMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import * as Tone from 'tone';
// Importa el saldo global y las funciones de sincronización
import { balance, syncBalance } from '../../store/balance.js';
import { registerBet, GAME_IDS } from '../../utils/betApi.js';

// --- State ---
// Usar el saldo global reactivo
const { uid } = balance;
const credits = balance.credits;
const betAmount = ref(10);
const betStep = 5;
const autoCashout = ref(null);
const gameState = ref('waiting'); // 'waiting', 'starting', 'running', 'crashed'
const currentMultiplier = ref(1.00);
const hasPlacedBet = ref(false);
const hasCashedOut = ref(false);
const history = ref([]);
const countdown = ref(5000);
const gameMessage = ref('');
const milestoneReached = ref(false);
const currentBetId = ref(null); // No se usa con el nuevo SP, pero lo dejamos por si acaso
const router = useRouter();

// --- Dev & Testing ---
const crashSeed = ref(null); // Set to a number (e.g., 2.5) to force a crash point for testing. Null for random.

// --- Canvas & Animation ---
const gameCanvas = ref(null);
let ctx = null;
let animationFrameId = null;
const rocket = reactive({
  x: 50,
  y: 400, // Start at bottom
  rotation: 0,
  trail: []
});
const stars = ref([]);
let gameStartTime = 0;
let crashPoint = 0;
let gameLoopInterval = null;

// --- UI Computed Properties ---
const buttonText = computed(() => {
  if (gameState.value === 'running') {
    return hasCashedOut.value ? `RETIRADO` : `RETIRAR`;
  }
  if (hasPlacedBet.value) {
    return 'ESPERANDO RONDA';
  }
  return `APOSTAR $${betAmount.value}`;
});

const buttonClass = computed(() => {
  if (gameState.value === 'running' && !hasCashedOut.value) return 'cashout-button';
  return 'bet-button';
});

const buttonDisabled = computed(() => {
  const canBet = (gameState.value === 'waiting' || gameState.value === 'starting') && !hasPlacedBet.value && credits.value >= betAmount.value && betAmount.value > 0;
  const canCashout = gameState.value === 'running' && hasPlacedBet.value && !hasCashedOut.value;
  return !canBet && !canCashout;
});

const isBettingLocked = computed(() => gameState.value !== 'waiting' || hasPlacedBet.value);

const messageClass = computed(() => {
  if (gameMessage.value.includes('Ganaste')) {
    return 'win-message';
  }
  if (gameMessage.value.includes('perdiste')) {
    return 'loss-message';
  }
  return '';
});

// --- Game Logic ---
async function handleAction() {
  if (buttonDisabled.value) return;
  if (gameState.value === 'running') {
    cashOut(currentMultiplier.value);
  } else if (gameState.value === 'waiting' || gameState.value === 'starting') {
    if (credits.value < betAmount.value) return;
    // La apuesta se registrará al final, aquí solo marcamos que el jugador participa.
    hasPlacedBet.value = true;
  }
}

async function cashOut(multiplier) {
  if (hasPlacedBet.value && !hasCashedOut.value) {
    hasCashedOut.value = true;
    const winnings = betAmount.value * multiplier;
    
    // Registrar apuesta GANADA usando la función helper
    await registerBet({
      uid: uid.value,
      gameId: GAME_IDS.ROCKET,
      amount: betAmount.value,
      result: 'GANADA',
      multiplier: multiplier
    });
    await syncBalance();
    
    gameMessage.value = `¡Ganaste $${winnings.toFixed(2)}!`;
  }
}

function getHistoryClass(result) {
  if (result >= 10) return 'history-high';
  if (result >= 2) return 'history-medium';
  return 'history-low';
}

function decreaseBet() {
  betAmount.value = Math.max(1, Math.round(betAmount.value - betStep));
}

function increaseBet() {
  const newBet = Math.round(betAmount.value + betStep);
  betAmount.value = Math.min(1000, newBet);
}

function setMaxBet() {
  betAmount.value = Math.min(1000, credits.value);
}

function setBet(amount) {
  betAmount.value = amount;
}

function startGame() {
  gameMessage.value = '';
  hasCashedOut.value = false;
  gameState.value = 'running';
  currentMultiplier.value = 1.00;
  gameStartTime = Date.now();
  
  // En un juego real, esto vendría del servidor.
  if (crashSeed.value !== null) {
    crashPoint = crashSeed.value;
  } else {
    crashPoint = 1 + Math.pow(Math.random(), 4) * 20; // Crash entre 1x y 21x, con más probabilidad en valores bajos
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function gameLoop() {
  const elapsedTime = (Date.now() - gameStartTime) / 1000; // en segundos
  currentMultiplier.value = Math.pow(1.07, elapsedTime);

  // Check for milestones
  const milestones = [2, 5, 10];
  const lastMilestone = milestones.reverse().find(m => currentMultiplier.value >= m);
  if (lastMilestone && !milestoneReached.value) {
    milestoneReached.value = true;
    setTimeout(() => milestoneReached.value = false, 300); // Pulse for 300ms
  }

  if (hasPlacedBet.value && !hasCashedOut.value && autoCashout.value > 0 && currentMultiplier.value >= autoCashout.value) {
      cashOut(autoCashout.value);
  }

  if (currentMultiplier.value >= crashPoint) {
    endGame();
  } else {
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

let mineSynth;
onMounted(() => {
  // Sonido de explosión tipo mina, lento y más fuerte
  mineSynth = new Tone.MembraneSynth({
    pitchDecay: 0.15,
    octaves: 10,
    envelope: { attack: 0.001, decay: 1.2, sustain: 0, release: 0.8 },
    volume: 8 // volumen alto
  }).toDestination();
});

async function endGame() {
  gameState.value = 'crashed';
  currentMultiplier.value = crashPoint;

  // Añadir al historial
  history.value.unshift(crashPoint); // unshift para añadir al principio
  if (history.value.length > 20) history.value.pop(); // Mantener solo los últimos 20

  draw(); // Dibuja el estado final "crashed"
  cancelAnimationFrame(animationFrameId);

  // Sonido de explosión tipo mina, aún más lento
  if (mineSynth) {
    Tone.start && Tone.start();
    mineSynth.triggerAttackRelease('C1', '2n');
  }

  if (hasPlacedBet.value && !hasCashedOut.value) {
    gameMessage.value = `¡Crash! Perdiste $${betAmount.value.toFixed(2)}.`;
    
    // Registrar apuesta PERDIDA usando la función helper
    await registerBet({
      uid: uid.value,
      gameId: GAME_IDS.ROCKET,
      amount: betAmount.value,
      result: 'PERDIDA',
      multiplier: 0
    });
    await syncBalance();
  }
}

function resetForNextRound() {
    hasPlacedBet.value = false;
    hasCashedOut.value = false;
    countdown.value = 5000; // Reiniciar la cuenta regresiva
    gameState.value = 'waiting'; // Cambiar a 'waiting' para el próximo ciclo
    gameMessage.value = ''; // Limpiar el mensaje para la siguiente ronda
}

function goBack() {
  router.push('/menu');
}

// --- Drawing on Canvas ---
function draw() {
  const width = gameCanvas.value.width;
  const height = gameCanvas.value.height; // 800x450

  // Clear canvas
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Draw stars
  drawStars(width, height);

  if (gameState.value === 'waiting') {
    return; // No dibujar gráfico si no está en juego
  }

  // Calcular posición del cohete
  if (gameState.value === 'running' || gameState.value === 'crashed') {
    const elapsedTime = (Date.now() - gameStartTime) / 1000;
    const progress = Math.min(elapsedTime / 10, 1); // Normaliza el tiempo para la curva
    const curvePower = 2.5;

    rocket.x = 50 + Math.pow(progress, 0.8) * (width - 100);
    rocket.y = (height - 50) - Math.pow(progress, curvePower) * (height - 100);
    rocket.rotation = -Math.atan(curvePower * Math.pow(progress, curvePower - 1) * (height - 100) / ((width - 100) * 0.8 * Math.pow(progress, -0.2)));
  }

  // Actualizar y dibujar estela
  updateTrail();
  drawTrail();

  if (gameState.value === 'crashed') {
    drawExplosion(rocket.x, rocket.y);
  } else {
    drawRocket();
  }
}

function drawStars(width, height) {
  stars.value.forEach(star => {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = width;
      star.y = Math.random() * height;
    }
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  });
}

function drawRocket() {
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.rotation);
  
  // Cuerpo del cohete
  ctx.fillStyle = '#e2e8f0'; // Gris claro
  ctx.beginPath();
  ctx.moveTo(20, 0); // Punta
  ctx.lineTo(-10, 8); // Base derecha
  ctx.lineTo(-10, -8); // Base izquierda
  ctx.closePath();
  ctx.fill();

  // Aletas
  ctx.fillStyle = '#ff007f'; // Magenta
  ctx.fillRect(-12, 8, 8, 3); // Aleta derecha
  ctx.fillRect(-12, -11, 8, 3); // Aleta izquierda

  ctx.restore();
}

function updateTrail() {
  const trailX = rocket.x - 15 * Math.cos(rocket.rotation);
  const trailY = rocket.y - 15 * Math.sin(rocket.rotation);
  rocket.trail.push({ x: trailX, y: trailY, radius: 5, opacity: 1 });
  rocket.trail.forEach(p => {
    p.opacity -= 0.03;
    p.radius -= 0.15;
  });
  rocket.trail = rocket.trail.filter(p => p.opacity > 0 && p.radius > 0);
}

function drawTrail() {
  const trailGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
  trailGradient.addColorStop(0, 'rgba(255, 220, 150, 0.8)');
  trailGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  rocket.trail.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 242, 255, ${p.opacity * 0.7})`; // Cian
    ctx.fill();
  });
}

function drawExplosion(x, y) {
  ctx.fillStyle = '#ff007f'; // Magenta
  ctx.font = 'bold 48px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('💥', x, y);
}

// --- Lifecycle Hooks ---
onMounted(() => {
  if (!gameCanvas.value) return;
  ctx = gameCanvas.value.getContext('2d');

  // Initialize stars
  for (let i = 0; i < 100; i++) {
    stars.value.push({ x: Math.random() * 800, y: Math.random() * 450, radius: Math.random() * 1.5, opacity: Math.random(), speed: 0.2 + Math.random() * 0.3 });
  }

  draw();

  // Main game cycle manager
  gameLoopInterval = setInterval(() => {
    if (gameState.value === 'waiting' && hasPlacedBet.value) {
      gameState.value = 'starting'; // Inicia la cuenta regresiva
    } else if (gameState.value === 'starting') {
      countdown.value -= 100;
      // playSound('countdown');
      if (countdown.value <= 0) {
        startGame();
      }
    } else if (gameState.value === 'crashed') {
      resetForNextRound();
    }
  }, 100);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  clearInterval(gameLoopInterval);
});

</script>

<style scoped>
.rocket-game-container {
  background: #0f172a; /* Azul noche */
  color: #e2e8f0;
  min-height: 100vh;
  overflow: hidden;
  position: relative;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  flex-direction: column;
  padding-top: 70px; /* Espacio para el header fijo */
}

/* Header */
.game-header {
  display: grid;
  justify-content: space-between;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 1rem 2rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

.header-left {
  justify-self: start;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-center {
  justify-self: center;
}

.header-right {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.game-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
}

.game-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #94a3b8; /* Gris claro */
}

.balance-display {
  background: rgba(0,0,0,0.2);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #334155;
  font-size: 1rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.balance-display strong {
  color: #fff;
  font-weight: 600;
}

.balance-display strong.bet-active {
  color: #00f2ff; /* Cian para la apuesta activa */
}

.btn-back {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: white;
  border: 1px solid #475569;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}
.btn-back:hover {
  background-color: #334155;
}
.btn-back:disabled {
  background-color: #1e293b;
  color: #475569;
  cursor: not-allowed;
  border-color: #334155;
}

/* Layout */
.main-layout {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 2rem;
  padding: 2rem;
  flex-grow: 1;
}

.game-area-wrapper {
  display: flex;
  height: 65%;
  flex-direction: column;
  background: #1e293b;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.game-area {
  position: relative;
  flex-grow: 1;
  border-radius: 8px;
  overflow: hidden;
}

.multiplier-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 20px rgba(0, 242, 255, 0.5);
  z-index: 10;
  transition: color 0.3s ease;
}

.multiplier-display.crashed-text {
  color: #ff007f; /* Magenta */
  text-shadow: 0 0 20px rgba(255, 0, 127, 0.7);
}

.milestone-pulse {
  animation: pulse-glow 0.5s ease-out;
}
@keyframes pulse-glow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

/* Controls Panel */
.controls-panel-wrapper {
  background: transparent;
}
.controls-panel {
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.bet-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid #334155;
  overflow: hidden;
}

.control-btn {
  background: #334155;
  border: none;
  color: white;
  padding: 0.75rem;
  font-size: 1.2rem;
}

.input-group input {
  background: transparent;
  border: none;
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  width: 100%;
}

.quick-bet-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}
.quick-bet-btn {
  background: #334155;
  border: 1px solid #475569;
  color: #cbd5e1;
  padding: 0.5rem;
  border-radius: 6px;
}

.action-controls {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.action-button, .max-bet-btn {
  padding: 1.25rem;
  font-size: 1.5rem;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  color: white;
  transition: all 0.2s ease;
}

.action-button.bet-button {
  background: #00f2ff; /* Cian */
  color: #0f172a;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
}

.action-button.cashout-button {
  background: #ff007f; /* Magenta */
  box-shadow: 0 0 20px rgba(255, 0, 127, 0.4);
}

.auto-cashout-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.auto-cashout-controls .input-group span {
  padding: 0 0.75rem;
  color: #94a3b8;
}

/* Info Panel */
.info-panel {
  background: #1e293b;
  height: 65%;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.info-title {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: #94a3b8;
  border-bottom: 1px solid #334155;
  padding-bottom: 1rem;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.history-item {
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9rem;
  transition: transform 0.2s;
}
.history-item:hover {
  transform: scale(1.05);
}

.history-low { background-color: #334155; color: #94a3b8; }
.history-medium { background-color: #00f2ff; color: #0f172a; box-shadow: 0 0 10px rgba(0, 242, 255, 0.4); }
.history-high { background-color: #ff007f; color: #fff; box-shadow: 0 0 10px rgba(255, 0, 127, 0.4); }

.game-message { text-align: center; padding: 0.75rem; border-radius: 8px; font-weight: 600; margin-top: auto; }
.win-message { background-color: rgba(0, 242, 255, 0.1); color: #00f2ff; border: 1px solid #00f2ff; }
.loss-message { background-color: rgba(255, 0, 127, 0.1); color: #ff007f; border: 1px solid #ff007f; }

/* General Button Styles */
.btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
.btn:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }

canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>