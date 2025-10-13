<template>
  <div class="mines-game-container">
    <!-- Import Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">

    <!-- Encabezado del Juego -->
    <header class="game-header">
      <div class="header-container">
        <div class="brand">
          <h1 class="brand-title">PascualBet</h1>
        </div>
        <div class="game-info">
          <span class="game-subtitle">Buscaminas</span>
        </div>
        <div class="stats">
          <div class="stat-item">
            <span>Balance</span>
            <strong>${{ credits.toFixed(2) }}</strong>
          </div>
          <div class="stat-item bet-stat">
            <span>Apuesta</span>
            <strong>${{ betAmount > 0 ? betAmount.toFixed(2) : '0.00' }}</strong>
          </div>
        </div>
      </div>
    </header>

    <div class="game-content">
      <!-- Botón Volver (debajo del encabezado) -->

      <div class="main-game-area">
        <!-- Panel de Controles Izquierdo -->
        <div class="controls-panel">
          <div class="control-group">
            <button @click="goBack" class="btn-back-below-header" :disabled="gameState === 'playing'">⬅ Regresar</button>
            <label>cantida de apuesta</label>
            <div class="input-group">
              <input type="number" v-model.number="betAmount" :disabled="gameState !== 'betting'" />
            </div>
          </div>
    
          <div class="control-group">
            <label>tamaño de tabla</label>
            <select v-model.number="gridDimension" :disabled="gameState !== 'betting'">
              <option v-for="n in 7" :key="n" :value="n + 2">{{ n + 2 }}x{{ n + 2 }}</option>
            </select>
          </div>
    
          <div class="control-group">
            <label>cantidad de minas</label>
            <select v-model.number="numMines" :disabled="gameState !== 'betting'">
              <option v-for="n in maxMines" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
    
          <div v-if="betAmount > credits.value" class="error-message">
            La apuesta no puede ser mayor que tu balance.
          </div>
    
          <button v-if="gameState === 'betting'" class="action-button bet-button" @click="startGame" :disabled="isBetInvalid">
            jugar
          </button>
          <div v-if="lastWinnings !== null" class="total-win-label">
            Total Win: {{ lastWinnings.toFixed(2) }}
          </div>
          <button v-if="gameState === 'playing'" class="action-button cashout-button" @click="cashout">
            Cashout ({{ currentMultiplier.toFixed(2) }}x)
          </button>
          <div v-if="gameState === 'busted'" class="game-over-message">
            <span v-if="isCashedOut" class="win-message-color">¡Has ganado!</span>
            <span v-else>¡Has perdido!</span>
            <button class="action-button bet-button" @click="resetGame">
              Jugar de nuevo
            </button>
          </div>
        </div>
    
        <!-- Grid del Juego -->
        <div class="game-grid" :style="gridStyle">
          <div
            v-for="(tile, index) in grid"
            :key="index"
            class="tile"
            :class="{
              revealed: tile.isRevealed,
              mine: (tile.isRevealed && tile.isMine) || (isCashedOut && tile.isMine),
              diamond: tile.isRevealed && !tile.isMine,
              'game-over': gameState === 'busted'
            }"
            @click="onTileClick(index)"
          >
            <div class="tile-content">
              <span v-if="tile.isRevealed && !tile.isMine">💎</span>
              <span v-if="(tile.isRevealed && tile.isMine) || (isCashedOut && tile.isMine)">💣</span>
            </div>
          </div>
        </div>
      </div>

      <!-- win-info-label ahora está debajo del botón Bet -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as Tone from 'tone';
// Importa el saldo global y las funciones de sincronización
import { balance, syncBalance } from '../../store/balance.js';

// --- State ---
const gridDimension = ref(5); // 5 for 5x5, 3 for 3x3, etc.
const betAmount = ref(10.00);
const numMines = ref(3);
const gameState = ref('betting'); // 'betting', 'playing', 'busted'
const isCashedOut = ref(false);
const diamondsFound = ref(0);
// Usar el saldo global reactivo
const { uid } = balance;
const credits = balance.credits;
const router = useRouter();
const lastWinnings = ref(null);
const currentBetId = ref(null); // Para guardar el id_sesion de la apuesta

// Ocultar el mensaje de ganancia si el usuario cambia la apuesta o parámetros
watch([betAmount, gridDimension, numMines], () => {
  if (gameState.value === 'betting') {
    lastWinnings.value = null;
  }
});

// --- Computed Properties ---
const GRID_SIZE = computed(() => gridDimension.value * gridDimension.value);
const grid = ref(initializeGrid());

const maxMines = computed(() => GRID_SIZE.value - 1);

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridDimension.value}, 1fr)`,
  gridTemplateRows: `repeat(${gridDimension.value}, 1fr)`,
}));

const isBetInvalid = computed(() => betAmount.value <= 0 || betAmount.value > credits.value);

const MULTIPLIER_TABLE = {
  1: [1.01, 1.08, 1.12, 1.18, 1.24, 1.30, 1.37, 1.46, 1.55, 1.65, 1.77, 1.90, 2.06, 2.25, 2.47, 2.75, 3.09, 3.54, 4.12, 4.95, 6.19, 8.25, 12.37, 24.75],
  2: [1.08, 1.17, 1.29, 1.41, 1.56, 1.74, 1.94, 2.18, 2.47, 2.83, 3.20, 3.81, 4.50, 5.40, 6.60, 8.25, 10.61, 14.14, 19.80, 29.70, 49.50, 99, 297],
  3: [1.12, 1.29, 1.48, 1.71, 2.00, 2.35, 2.79, 3.35, 4.07, 5.00, 6.26, 7.96, 10.35, 13.80, 18.97, 27.11, 40.66, 65.06, 113.85, 227.70, 569.25, 2277],
  4: [1.18, 1.41, 1.71, 2.09, 2.58, 3.23, 4.09, 5.26, 6.88, 9.17, 12.51, 17.52, 25.30, 37.95, 59.64, 99.39, 178.91, 357.81, 834.90, 2504, 12523],
  5: [1.24, 1.56, 2.00, 2.58, 3.39, 4.52, 6.14, 8.50, 12.04, 17.52, 26.77, 40.87, 66.41, 113.85, 208.72, 417.45, 939.26, 2504, 8766, 52598],
  6: [1.30, 1.74, 2.35, 3.23, 4.52, 6.46, 9.44, 14.17, 21.89, 35.03, 58.38, 102.17, 189.75, 379.50, 834.90, 2087, 6261, 25047, 175329],
  7: [1.37, 1.94, 2.79, 4.09, 6.14, 9.44, 14.95, 24.47, 41.60, 73.95, 138.66, 277.33, 600.87, 1442, 3965, 13219, 59486, 475893],
  8: [1.46, 2.18, 3.35, 5.26, 8.50, 14.17, 24.47, 44.05, 83.20, 166.40, 356.56, 831.98, 2163, 6489, 23794, 118973, 1070759],
  9: [1.55, 2.47, 4.07, 6.88, 12.04, 21.89, 41.60, 83.20, 176.80, 404.10, 1010, 2828, 9193, 36773, 202254, 2022545],
  10: [1.65, 2.83, 5.00, 9.17, 17.52, 35.03, 73.95, 166.40, 404.10, 1077, 3232, 11314, 49031, 294188, 3236072],
  11: [1.77, 3.20, 6.26, 12.51, 26.77, 58.38, 138.66, 356.56, 1010, 3232, 12123, 56574, 367735, 4412826],
  12: [1.90, 3.81, 7.96, 17.52, 40.87, 102.17, 277.33, 831.98, 2828, 11314, 56574, 396022, 5148297],
  13: [2.06, 4.50, 10.35, 25.30, 66.41, 189.75, 600.87, 2163, 9193, 49031, 367735, 5148297],
  14: [2.25, 5.40, 13.80, 37.95, 113.85, 379.50, 1442, 6489, 36773, 294188, 4412826],
  15: [2.47, 6.60, 18.97, 59.64, 208.72, 834.90, 3965, 23794, 202254, 3236072],
  16: [2.75, 8.25, 27.11, 99.39, 417.45, 2087, 13219, 118973, 2022545],
  17: [3.09, 10.61, 40.66, 178.91, 939.3, 6261, 59486, 1070759],
  18: [3.54, 14.14, 65.06, 357.81, 2504, 25047, 475893],
  19: [4.12, 19.80, 113.85, 834.90, 8766, 175329],
  20: [4.95, 29.70, 227.70, 2504, 52598],
  21: [6.19, 49.50, 569.25, 12523],
  22: [8.25, 99.00, 2277],
  23: [12.37, 297],
  24: [24.75]
};

const currentMultiplier = computed(() => {
  if (diamondsFound.value === 0) return 1.0;

  const multipliersForMines = MULTIPLIER_TABLE[numMines.value];
  if (!multipliersForMines) {
    return 1.0; // Fallback si no hay tabla para ese número de minas
  }

  const multiplier = multipliersForMines[diamondsFound.value - 1];
  
  return multiplier || 1.0; // Fallback si se encuentran más diamantes de los que hay en la tabla
});

// Sonidos Mines (libertad creativa)
const diamondSynth = new Tone.PolySynth().toDestination();
diamondSynth.set({ volume: -10 });
const mineSynth = new Tone.MembraneSynth({
  pitchDecay: 0.02,
  octaves: 4,
  envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
  volume: -8
}).toDestination();
const cashoutSynth = new Tone.PolySynth().toDestination();
cashoutSynth.set({ volume: -8 });
const loseSynth = new Tone.MonoSynth({
  oscillator: { type: 'triangle' },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.2 },
  volume: -12
}).toDestination();

// --- Methods ---
function goBack() {
  router.push('/menu');
}

function initializeGrid() {
  return Array.from({ length: GRID_SIZE.value }, (_, i) => ({
    id: i,
    isMine: false,
    isRevealed: false,
  }));
}

watch(gridDimension, () => {
  if (numMines.value >= GRID_SIZE.value) {
    numMines.value = GRID_SIZE.value - 1;
  }
  grid.value = initializeGrid();
});

function startGame() {
  if (isBetInvalid.value) return;
  
  gameState.value = 'playing';
  diamondsFound.value = 0;
  
  grid.value = initializeGrid();
  let minesPlaced = 0;
  while (minesPlaced < numMines.value) {
    const randomIndex = Math.floor(Math.random() * GRID_SIZE.value);
    if (!grid.value[randomIndex].isMine) {
      grid.value[randomIndex].isMine = true;
      minesPlaced++;
    }
  }
}

async function onTileClick(index) {
  if (gameState.value !== 'playing' || grid.value[index].isRevealed) {
    return;
  }

  const tile = grid.value[index];
  tile.isRevealed = true;

  if (tile.isMine) {
    // Sonido de explosión
    mineSynth.triggerAttackRelease('C2', '16n');
    gameState.value = 'busted';
    revealAllMines();

    // Finalizar la apuesta como PERDIDA en un solo paso
    await fetch('http://localhost:4000/api/bet/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: uid.value, id_juego: 5, monto: betAmount.value, resultado: 'PERDIDO', multiplicador: 0 })
    });
    await syncBalance();

    // Sonido de perder
    setTimeout(() => loseSynth.triggerAttackRelease('C1', '8n'), 200);
  } else {
    // Sonido de diamante
    diamondSynth.triggerAttackRelease(['C5', 'E5', 'G5'], '16n');
    diamondsFound.value++;

    // Condición de victoria instantánea si es el único diamante posible
    if (numMines.value === maxMines.value) {
      await cashout();
    }
  }
}

function revealAllMines() {
  grid.value.forEach(tile => {
    if (tile.isMine) {
      tile.isRevealed = true;
    }
  });
}

async function cashout() {
  if (gameState.value !== 'playing' || diamondsFound.value === 0) return;
  const winnings = betAmount.value * currentMultiplier.value;
  const multiplier = currentMultiplier.value;

  // Finalizar la apuesta como GANADA en un solo paso
  await fetch('http://localhost:4000/api/bet/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: uid.value, id_juego: 5, monto: betAmount.value, resultado: 'GANADO', multiplicador: multiplier })
  });
  await syncBalance();

  // Sonido de cashout alegre
  cashoutSynth.triggerAttackRelease(['C6', 'E6', 'G6'], '8n');
  lastWinnings.value = winnings - betAmount.value; // Mostrar ganancia neta
  
  isCashedOut.value = true;
  gameState.value = 'busted'; // Reutilizamos el estado 'busted' para mostrar el tablero final
  diamondsFound.value = 0;
}

function resetGame() {
  gameState.value = 'betting';
  isCashedOut.value = false;
  grid.value = initializeGrid();
  // No borramos lastWinnings aquí
}
</script>

<style scoped>
.mines-game-container {
  padding: 8rem 2rem 2rem 2rem; /* Espacio para el header fijo */
  background-color: #0a1929;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  min-height: 100vh;
  justify-content: center;
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-content {
  text-align: left;
}

/* Header */
.game-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(180deg, #1f2937, #121212);
  border-bottom: 1px solid #2a3a50;
  padding: 1rem 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  z-index: 100;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.brand-title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  color: #d4af37;
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
  margin: 0;
}

.game-info {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.game-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: #e0e0e0;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  background: rgba(0,0,0,0.3);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #2a3a50;
  font-size: 0.9rem;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-item strong {
  color: #ffffff;
  font-size: 1.1rem;
}

.stat-item.bet-stat strong {
  color: #f0b90b;
}

.btn-back-below-header {
  margin-bottom: 1.5rem; /* Espacio entre el botón y la sección de apuestas */
  background: linear-gradient(45deg, #f0b90b, #d4af37, #b8860b);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1.2rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
}

.btn-back-below-header:hover {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.7);
  transform: translateY(-1px);
}

.btn-back-below-header:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.main-game-area {
  display: flex;
  gap: 2rem;
  justify-content: center;
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #1a2c38;
  padding: 1.5rem;
  border-radius: 8px;
  width: 250px;
  border: 1px solid #22c55e;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.2);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.9rem;
  color: #b0c4de;
  font-weight: 600;
}

.input-group {
  display: flex;
}

.input-group input, select {
  background-color: #0f212e;
  border: 1px solid #22c55e;
  color: #fff;
  padding: 0.75rem;
  border-radius: 4px;
  width: 100%;
  transition: all 0.2s ease;
}

input:focus, select:focus {
  outline: none;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  border-color: #4ade80;
}

.action-button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bet-button {
  background-color: #22c55e;
  color: #fff;
  box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
}
.bet-button:hover {
  background-color: #4ade80;
  transform: translateY(-2px);
}

.cashout-button {
  background-color: #38bdf8;
  color: #0f212e;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.3);
}
.cashout-button:hover {
  background-color: #7dd3fc;
  transform: translateY(-2px);
}

.game-over-message {
  text-align: center;
  color: #f87171;
  font-weight: bold;
}
.win-message-color {
  color: #22c55e;
}
.error-message {
  color: #f87171; /* Same red as the lose message */
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1rem;
}
.game-over-message .action-button {
  margin-top: 1rem;
}

.game-grid {
  display: grid;
  gap: 10px;
  width: 600px;
  height: 600px;
  background-color: #1a2c38;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #22c55e;
  box-shadow: 0 0 30px rgba(34, 197, 94, 0.15), inset 0 0 20px rgba(0,0,0,0.4);
}

.tile {
  background-color: #2f4553; /* Color base del cuadro */
  border-radius: 8px; /* Bordes suaves */
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.tile:not(.revealed):hover {
  border-color: #38bdf8;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
  transform: scale(1.05);
}

.tile.revealed {
  cursor: default;
  background-color: #0f212e; /* Fondo revelado */
  border-color: #475569;
}

.tile.game-over:not(.revealed) {
  opacity: 0.5;
  cursor: not-allowed;
}

.tile-content {
  font-size: 2rem;
  animation: appear 0.4s ease-out;
  text-shadow: 0 0 10px currentColor;
}

.tile.mine .tile-content {
  animation: explode 0.3s forwards;
  color: #f87171;
}

.tile.diamond .tile-content {
  color: #38bdf8;
}

@keyframes appear {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes explode {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* Deshabilitar estilos */
button:disabled, input:disabled, select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

button:disabled:hover {
  background-color: initial; /* Evita cambio de color en hover cuando está deshabilitado */
  transform: none;
}

.total-win-label {
  margin: 0.7rem 0 0.7rem 0;
  background: #18222e;
  color: #22c55e;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.6rem 0;
  text-align: center;
  letter-spacing: 1px;
  user-select: none;
  width: 100%;
  box-shadow: none;
  border: none;
}
</style>