<template>
  <div class="plinko-game-container">
    <div class="controls-panel">
      <div class="balance-bar left">
        <span class="balance-icon">💰</span>
        <span class="balance-label">Saldo:</span>
        <span class="balance-amount">$ {{ balance.toFixed(2) }}</span>
      </div>
      <!-- Selector de Modo -->
      <div class="control-group mode-selector">
        <button :class="{ active: gameMode === 'manual' }" @click="setGameMode('manual')" :disabled="isAutoBetting">Manual</button>
        <button :class="{ active: gameMode === 'auto' }" @click="setGameMode('auto')" :disabled="isAutoBetting">Auto</button>
      </div>

      <div class="control-group">
        <label>cantidad de apuesta</label>
        <div class="input-group">
          <input type="number" v-model.number="betAmount" :disabled="isBettingLocked" />
        </div>
      </div>

      <div class="control-group">
        <label>nivel de riesgo</label>
        <select v-model="riskLevel" :disabled="isBettingLocked">
          <option value="low">bajo</option>
          <option value="medium">medio</option>
          <option value="high">alto</option>
        </select>
      </div>

      <div class="control-group">
        <label>numero de bolas</label>
        <select v-model.number="ballsPerBet" :disabled="isBettingLocked">
          <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- Controles Modo Automático -->
      <div v-if="gameMode === 'auto'" class="control-group">
        <label>numeros de apuestas</label>
        <div class="input-group">
          <input type="number" v-model.number="numberOfBets" :disabled="isBettingLocked" placeholder="∞" />
        </div>
      </div>

      <div class="control-group">
        <label>Costo Total</label>
        <div class="total-cost-display">
          $ {{ totalBetCost.toFixed(2) }}
        </div>
      </div>

      <div v-if="isBalanceInsufficient" class="error-message">
        Saldo insuficiente para esta apuesta.
      </div>

      <button 
        class="action-button"
        :class="buttonClass"
        @click="handleAction"
        :disabled="isButtonDisabled"
      >
        <template v-if="isAutoBetting && gameMode === 'auto'">
          Auto-Bet en progreso...
        </template>
        <template v-else>
          {{ buttonText }}
        </template>
      </button>

      <div v-if="totalWinThisRound !== null" class="game-message" :class="totalWinThisRound > 0 ? 'win-message' : 'loss-message'">
        {{ totalWinThisRound > 0 ? `Total Win: ${totalWinThisRound.toFixed(2)}` : 'No luck this round!' }}
      </div>

      <button @click="goBack" class="back-button" :disabled="isBettingLocked">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
        </svg>
        Volver al Menú
      </button>
    </div>

    <!-- Área del Juego (Tablero) -->
    <div class="game-area" ref="gameAreaRef">
      <svg :viewBox="`0 0 ${boardWidth} ${boardHeight}`" class="plinko-board">
        <!-- Pivotes (Pegs) -->
        <circle
          v-for="peg in pegs"
          :key="peg.id"
          :cx="peg.x"
          :cy="peg.y"
          :r="pegRadius"
          :class="['peg', { 'hit': hitPegs.has(peg.id) }]"
        />

        <!-- Cubos Multiplicadores -->
        <g v-for="(bucket, index) in buckets" :key="`bucket-${index}`">
          <rect
            :x="bucket.x"
            :y="bucket.y"
            :width="bucketWidth"
            :height="bucketHeight"
            :class="['bucket', `bucket-color-${bucket.color}`, { 'pressed': lastHitBucketIndex === index }]"
          />
          <text
            :x="bucket.x + bucketWidth / 2"
            :y="bucket.y + bucketHeight / 2 + 5"
            class="bucket-text"
          >
            {{ bucket.multiplier }}x
          </text>
        </g>

        <!-- Bolas (plural) -->
        <circle
          v-for="b in balls"
          :key="b.id"
          :cx="b.x"
          :cy="b.y"
          :r="ballRadius"
          class="ball"
        />
      </svg>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from 'vue-router';
import { balance, updateBalance, syncBalance } from '../../store/balance.js';
import * as Tone from 'tone';

// --- Funciones de Lógica y Probabilidad (integradas desde plinko-logic.js) ---

function binomialCoefficient(n, k) {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k === 0 || k === n) {
    return 1;
  }
  if (k > n / 2) {
    k = n - k;
  }
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - i + 1) / i;
  }
  return res;
}

function calculateBinomialProbabilities(filas_estacas, probabilidad_desvio_izq) {
  const num_casillas = filas_estacas + 1;
  const probabilities = new Array(num_casillas).fill(0);
  const p = probabilidad_desvio_izq;

  for (let k = 0; k < num_casillas; k++) {
    const combinations = binomialCoefficient(filas_estacas, k);
    const probability = combinations * Math.pow(p, k) * Math.pow(1 - p, filas_estacas - k);
    probabilities[k] = probability;
  }

  return probabilities;
}

function adjustMultipliersForER(probabilities, targetER, baseMultipliers = null) {
  const num_casillas = probabilities.length;
  let multipliers = new Array(num_casillas);

  if (baseMultipliers) {
    const mid = Math.floor(num_casillas / 2);
    for (let i = 0; i < num_casillas; i++) {
      const distFromMid = Math.abs(i - mid);
      multipliers[i] = baseMultipliers[distFromMid] || baseMultipliers[baseMultipliers.length - 1];
    }
  } else {
    const totalProb = probabilities.reduce((sum, p) => sum + (p > 0 ? 1 / p : 0), 0);
    for (let i = 0; i < num_casillas; i++) {
      multipliers[i] = (probabilities[i] > 0) ? (1 / probabilities[i]) / totalProb * num_casillas : 0;
    }
  }

  const currentER = probabilities.reduce((sum, prob, i) => sum + prob * multipliers[i], 0);

  if (currentER === 0) {
    return multipliers.map(m => parseFloat(m.toFixed(2)));
  }

  const scaleFactor = targetER / currentER;
  const finalMultipliers = multipliers.map(m => m * scaleFactor);

  return finalMultipliers.map(m => parseFloat(m.toFixed(2)));
}

export default {
  name: "Plinko",
  setup() {
    const { uid } = balance;

    function goBack() {
      router.push('/menu');
    }

    // --- Configuración del Tablero ---
    const gameAreaRef = ref(null);
    const filas_estacas = ref(12);
    const boardWidth = ref(500);
    const boardHeight = ref(550);
    const pegRadius = 8;
    const ballRadius = 10;
    const bucketHeight = 30;
    
    // --- Estado del Juego ---
    const gameMode = ref('manual');
    const router = useRouter();
    const betAmount = ref(10);
    const riskLevel = ref("medium");
    const ballsPerBet = ref(1);
    const numberOfBets = ref(10);
    
    const gameState = ref("betting");
    const isAutoBetting = ref(false);
    const betsPlayed = ref(0);
    const totalWinThisRound = ref(null);
    
    const balls = ref([]);
    const hitPegs = reactive(new Set());
    const lastHitBucketIndex = ref(null);

    // --- Lógica de Costo y Validación ---
    const totalBetCost = computed(() => {
      const baseCost = betAmount.value * ballsPerBet.value;
      if (gameMode.value === 'auto' && numberOfBets.value > 0) {
        return baseCost * numberOfBets.value;
      }
      return baseCost;
    });

    const isBalanceInsufficient = computed(() => {
      // For infinite auto mode, we check per-round cost. Otherwise, check total cost.
      if (gameMode.value === 'auto' && (!numberOfBets.value || numberOfBets.value <= 0)) {
        return balance.credits.value < (betAmount.value * ballsPerBet.value);
      }
      return balance.credits.value < totalBetCost.value;
    });

    // --- Lógica de Probabilidad y Multiplicadores ---
    const probabilidad_desvio_izq = computed(() => {
      if (riskLevel.value === 'low') return 0.45;
      if (riskLevel.value === 'high') return 0.55;
      return 0.5;
    });

    const probabilidades = computed(() => calculateBinomialProbabilities(filas_estacas.value, probabilidad_desvio_izq.value));
    const num_casillas = computed(() => filas_estacas.value + 1);

    // --- Lógica de la Interfaz ---
    const isBettingLocked = computed(() => gameState.value === 'dropping' || isAutoBetting.value);

    const buttonText = computed(() => {
      if (isAutoBetting.value) return `DETENER AUTO-BET (${betsPlayed.value}/${numberOfBets.value || '∞'})`;
      if (gameState.value === 'dropping') return 'JUGANDO...';
      if (gameMode.value === 'auto') return 'INICIAR AUTO-BET';
      return 'JUGAR';
    });

    const buttonClass = computed(() => {
      if (isAutoBetting.value) return 'stop-button';
      return 'bet-button';
    });

    const isButtonDisabled = computed(() => {
      return gameState.value === 'dropping' || isBalanceInsufficient.value || (isAutoBetting.value && gameMode.value === 'auto');
    });

    function setGameMode(mode) {
      if (!isAutoBetting.value) {
        gameMode.value = mode;
      }
    }

    // --- Sonidos ---
    const clickSynth = new Tone.NoiseSynth({ volume: -26 }).toDestination();
    class Note {
      constructor(note) {
        this.synth = new Tone.PolySynth().toDestination();
        this.synth.set({ volume: -6 });
        this.note = note;
      }
      play() {
        return this.synth.triggerAttackRelease(this.note, "32n", Tone.context.currentTime);
      }
    }
    const notesArr = ["C#5", "C5", "B5", "A#5", "A5", "G#4", "G4", "F#4", "F4", "F#4", "G4", "G#4", "A5", "A#5", "B5", "C5", "C#5"].map((note) => new Note(note));

    // --- Geometría del Tablero ---
    const pegs = computed(() => {
      const pegArray = [];
      const rows = filas_estacas.value;
      const verticalSpacing = (boardHeight.value - bucketHeight - 80) / rows;
      const horizontalSpacing = boardWidth.value / (rows + 2);

      for (let row = 0; row < rows; row++) {
        const numPegsInRow = row + 1;
        const y = 60 + row * verticalSpacing;
        const startX = (boardWidth.value - (numPegsInRow - 1) * horizontalSpacing) / 2;
        for (let col = 0; col < numPegsInRow; col++) {
          const x = startX + col * horizontalSpacing;
          pegArray.push({ x, y, id: `${row}-${col}` });
        }
      }
      return pegArray;
    });

    const bucketWidth = computed(() => boardWidth.value / num_casillas.value);

    const buckets = computed(() => {
      const baseMultipliers = { 
        low:    [1.1, 1, 1.2, 1.5, 3],
        medium: [0.5, 1.1, 2, 5, 15],
        high:   [0.3, 0.5, 3, 10, 30]
      };
      const adjustedMultipliers = adjustMultipliersForER(probabilidades.value, 0.95, baseMultipliers[riskLevel.value] || null);
      const bWidth = bucketWidth.value;
      const colors = {
        low:    ['green', 'blue', 'yellow'],
        medium: ['green', 'blue', 'yellow'],
        high:   ['red', 'green', 'blue', 'yellow'],
      };
      return adjustedMultipliers.map((m, i) => ({
        x: i * bWidth,
        y: boardHeight.value - bucketHeight,
        multiplier: m,
        color: colors[riskLevel.value][i % colors[riskLevel.value].length]
      }));
    });

    // --- Lógica Principal del Juego ---
    let animationFrameId = null;

    async function handleAction() {
      if (isAutoBetting.value) {
        stopAutoBetting();
        return;
      }
      if (isBalanceInsufficient.value) {
        // This check is redundant due to the button being disabled, but good for safety
        alert("Saldo insuficiente.");
        return;
      }

      if (gameMode.value === 'manual') {
        await playRound();
      } else if (gameMode.value === 'auto') {
        startAutoBetting();
      }
    }

    async function startManualDrop() {
        if (gameState.value === 'dropping') return;
        await playRound();
    }

    function startAutoBetting() {
      isAutoBetting.value = true;
      betsPlayed.value = 0;
      autoBetLoop();
    }

    function stopAutoBetting() {
      isAutoBetting.value = false;
    }
    
    async function autoBetLoop() {
      if (!isAutoBetting.value) return;
      if (numberOfBets.value > 0 && betsPlayed.value >= numberOfBets.value) {
        stopAutoBetting();
        return;
      }
      
      const roundCost = betAmount.value * ballsPerBet.value;
      if (balance.credits.value < roundCost) {
        alert("Saldo insuficiente para continuar el auto-bet.");
        stopAutoBetting();
        return;
      }

      await playRound();
      betsPlayed.value++;
      // Use a delay before starting the next auto-bet round
      setTimeout(autoBetLoop, 1000); 
    }

    async function playRound() {
      gameState.value = 'dropping';
      totalWinThisRound.value = 0;
      clickSynth.triggerAttackRelease('8n');

      await new Promise(resolveRound => {
        const ballsToDrop = ballsPerBet.value;
        let ballsFinished = 0;

        const onBallFinished = async (ball) => {
          const bucketIndex = Math.floor(ball.x / bucketWidth.value);
          const winningBucket = buckets.value[bucketIndex];

          if (winningBucket) {
            const winAmount = betAmount.value * winningBucket.multiplier;
            totalWinThisRound.value += winAmount;
            const resultado = winAmount > 0 ? 'GANADO' : 'PERDIDO';

            try {
              await fetch('http://localhost:4000/api/bet/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: uid.value, id_juego: 4, monto: betAmount.value, resultado, multiplicador: winningBucket.multiplier })
              });
              await syncBalance();
            } catch (e) {
              console.error("Error al registrar la apuesta:", e);
            }
          }

          ballsFinished++;
          if (ballsFinished >= ballsToDrop) {
            resolveRound();
          }
        };

        balls.value = [];
        for (let i = 0; i < ballsToDrop; i++) {
          balls.value.push({
            id: Date.now() + i,
            x: boardWidth.value / 2 + (Math.random() - 0.5) * 20,
            y: 20,
            vx: (Math.random() - 0.5) * 2,
            vy: 0,
            startTime: Date.now()
          });
        }

        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        gameLoop(onBallFinished);
      });

      gameState.value = 'betting';
      if (!isAutoBetting.value) { // Don't clear message immediately in auto-bet
        setTimeout(() => {
          totalWinThisRound.value = null;
        }, 3000);
      }
    }

    function gameLoop(onBallFinished) {
      for (let i = balls.value.length - 1; i >= 0; i--) {
        const ball = balls.value[i];

        const hasFinished = ball.y > boardHeight.value - bucketHeight - ballRadius;
        const hasTimedOut = (Date.now() - ball.startTime) > 10000;

        if (hasFinished || hasTimedOut) { // Si la bola ha terminado o ha expirado
          if (hasTimedOut) console.warn(`Ball ${ball.id} timed out.`);

          // Calcular el índice original
          let originalBucketIndex = Math.floor(ball.x / bucketWidth.value);
          // Ajustar el resultado para que sea una posición después (a la derecha)
          let finalBucketIndex = Math.min(num_casillas.value - 1, originalBucketIndex + 1);


          const finalX = finalBucketIndex * bucketWidth.value + bucketWidth.value / 2;
          ball.x = finalX; // Mueve la bola al centro del cubo.

          onBallFinished(ball);
          balls.value.splice(i, 1);
          continue;
        }

        ball.vy += 0.15;
        ball.x += ball.vx;
        ball.y += ball.vy;

        for (const peg of pegs.value) {
          const dx = ball.x - peg.x;
          const dy = ball.y - peg.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < ballRadius + pegRadius) {
            if (!hitPegs.has(peg.id)) {
              hitPegs.add(peg.id);
              setTimeout(() => hitPegs.delete(peg.id), 300);
              const bucketIdx = Math.round(peg.x / bucketWidth.value);
              if (notesArr[bucketIdx]) notesArr[bucketIdx].play();
            }
            ball.vy *= -0.4;
            ball.vx = (dx / distance) * 2.5 + (Math.random() - 0.5);
          }
        }

        if (ball.x < ballRadius || ball.x > boardWidth.value - ballRadius) {
          ball.vx *= -0.8;
        }
      }

      if (balls.value.length > 0) {
        animationFrameId = requestAnimationFrame(() => gameLoop(onBallFinished));
      } else {
        animationFrameId = null;
      }
    }

    watch(riskLevel, () => {
      totalWinThisRound.value = null;
    });

    // --- Lógica de Redimensionamiento ---
    let resizeObserver = null;

    onMounted(() => {
      if (gameAreaRef.value) {
        resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            boardWidth.value = width;
            boardHeight.value = height;
          }
        });
        resizeObserver.observe(gameAreaRef.value);
      }
    });

    onUnmounted(() => {
      if (resizeObserver && gameAreaRef.value) {
        resizeObserver.unobserve(gameAreaRef.value);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });

    return {
      gameMode,
      betAmount,
      riskLevel,
      gameState,
      totalWinThisRound,
      buttonText,
      boardWidth,
      boardHeight,
      pegs,
      pegRadius,
      buckets,
      bucketWidth,
      bucketHeight,
      balls,
      ballRadius,
      setGameMode,
      isBettingLocked,
      isAutoBetting,
      ballsPerBet,
      numberOfBets,
      betsPlayed,
      buttonClass,
      isButtonDisabled,
      goBack,
      gameAreaRef,
      hitPegs,
      lastHitBucketIndex,
      balance: computed(() => balance.credits.value),
      handleAction,
      totalBetCost,
      isBalanceInsufficient,
    };
  },
};
</script>

<style scoped>
.plinko-game-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  align-items: stretch; /* Para que los hijos tengan la misma altura */
  width: 100vw;
  height: 100vh; /* Ocupa exactamente la altura de la pantalla */
  padding: 2rem;
  background: #1D1E22;
  overflow: hidden; /* Evita el scroll en la página principal */
  color: #fff;
  box-sizing: border-box;
}

.controls-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: linear-gradient(180deg, #1f2c39, #0f1a24); /* Degradado sutil */
  padding: 2rem;
  border-radius: 16px; /* Bordes más redondeados */
  width: 280px;
  flex-shrink: 0; /* Evita que el panel se encoja */
  border: 1px solid #3a4c5a;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); /* Sombra para profundidad */
  font-family: 'Poppins', sans-serif; /* Fuente moderna */
  overflow-y: auto; /* Permite scroll interno si el contenido es muy alto */
}

.balance-bar.left {
  justify-content: flex-start;
  margin: 0 0 18px 0;
  padding: 10px 18px;
  font-size: 1.1rem;
  border-radius: 10px;
  background: linear-gradient(90deg, #232526 0%, #414345 100%);
  box-shadow: 0 2px 8px #0002;
}

.mode-selector {
  display: flex;
  background-color: #0f212e;
  border-radius: 4px;
  padding: 4px;
}
.mode-selector button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background-color: transparent;
  color: #b0c4de;
  font-weight: 600;
  cursor: pointer;
}
.mode-selector button.active {
  background-color: #3a4c5a;
  color: #fff;
  border-radius: 4px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-size: 0.9rem;
  font-weight: 600; /* Títulos en negrita */
  color: #b0c4de;
}

.input-group input, select {
  background-color: #0a1016;
  border: 1px solid #00d4ff; /* Borde cian */
  color: #fff;
  padding: 0.75rem;
  border-radius: 8px; /* Bordes más redondeados */
  width: 100%;
  box-sizing: border-box;
  font-family: 'Poppins', sans-serif;
  transition: all 0.2s ease;
}

.input-group input:focus, select:focus {
  outline: none;
  box-shadow: 0 0 10px rgba(0, 212, 255, 0.5); /* Resplandor al enfocar */
  border-color: #33eaff;
}

.action-button {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
}

.bet-button {
  background-color: #17a047;
  color: #fff;
  box-shadow: 0 0 15px rgba(23, 160, 71, 0.4);
}
.bet-button:hover:not(:disabled) {
  background-color: #1db954;
  transform: translateY(-2px);
  box-shadow: 0 0 25px rgba(29, 185, 84, 0.7); /* Efecto glow */
}

.stop-button {
  background-color: #ef4444;
  color: #fff;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
}
.stop-button:hover:not(:disabled) {
  background-color: #dc2626;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-message {
  text-align: center;
  padding: 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.win-message {
  background-color: rgba(23, 160, 71, 0.3);
  color: #17a047;
}

.loss-message {
  background-color: rgba(255, 77, 77, 0.3);
  color: #ff4d4d;
}

.error-message {
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
  margin-top: -1rem;
  margin-bottom: 1rem;
}

.total-cost-display {
  background-color: #0a1016;
  border: 1px solid #00d4ff;
  color: #fff;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
}

.game-area {
  flex-grow: 1; /* Ocupa el espacio restante */
  background-color: #1A1A21; /* Color solicitado */
  border-radius: 8px;
  border: 1px solid #213743;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1.1; /* Proporción casi cuadrada, ligeramente más alta */
}

.plinko-board {
  width: 100%;
  height: 100%;
}


.peg {
  fill: #fff; /* Adjust peg color */
  stroke: #3a4c5a; /* Add a dark stroke for definition */
  stroke-width: 0.2;
  transition: fill 0.3s ease, transform 0.1s ease, filter 0.1s ease; /* Add transition for hover effect */
}
.peg.hit {
  fill: #ffffff;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)); /* Brillo más intenso */
  transform: scale(1.01); /* Movimiento reducido al 1% */
  transition: fill 0.05s ease, filter 0.05s ease, transform 0.05s ease;
}


.ball {
  fill: #ff4d4d; /* Adjust ball color */
  stroke: #fff;
  stroke-width: 0.2;
  /* Add a subtle glow effect */
  filter: drop-shadow(0 0 5px rgba(255, 77, 77, 0.7));
}


.bucket {
  stroke: #213743;
  stroke-width: 1;
  transform-origin: bottom center; /* Asegura que la animación se vea correcta */
}

.bucket.pressed {
  animation: press-bucket 0.5s ease-out;
}

@keyframes press-bucket {
  0%, 100% {
    transform: scaleY(1);
    filter: brightness(1);
  }
  50% {
    transform: scaleY(0.75); /* Aumenté la profundidad de la presión */
    filter: brightness(1.6); /* Aumenté el brillo */
  }
}


.bucket-color-yellow { fill: #bfa600; } /* amarillo oscuro */
.bucket-color-blue { fill: #225a8c; }   /* azul oscuro */
.bucket-color-green { fill: #11682d; }  /* verde oscuro */
.bucket-color-red { fill: #a02a2a; }    /* rojo oscuro */

.bucket-text {
  fill: #fff;
  font-size: 14px;
  font-weight: bold;
  text-anchor: middle;
  pointer-events: none;
}

.back-button {
  margin-top: auto; /* Empuja el botón hacia abajo */
  background: #22313f;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-weight: bold;
  font-size: 1rem;
  box-shadow: 0 2px 8px #0002;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, transform 0.1s;
  cursor: pointer;
}
.back-button:hover:not(:disabled) {
  background: #1abc9c;
  color: #22313f;
  transform: translateY(-2px) scale(1.04);
}

/* Hover effect for pegs */
.peg:hover {
  fill: #f0b90b; /* Change color on hover */
  cursor: pointer; /* Change cursor to indicate interactivity */
}

/* --- Estilos Responsivos --- */
@media (max-width: 960px) {
  .plinko-game-container {
    flex-direction: column;
    position: relative; /* Cambiar de 'fixed' para permitir scroll */
    height: auto;
    min-height: 100vh;
    padding: 1rem; /* Menos padding en pantallas pequeñas */
  }

  .controls-panel {
    width: 100%;
    max-width: 500px; /* Evita que sea demasiado ancho en tablets */
    order: 1; /* El panel de control va primero */
  }

  .game-area {
    width: 100%;
    max-width: 500px;
    height: 60vh; /* Altura razonable para el tablero */
    order: 2; /* El área de juego va después */
  }
}

</style>