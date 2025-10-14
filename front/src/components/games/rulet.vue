<template>
  <div class="roulette-container">
    <!-- Import Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">

    <!-- Header with theme styling -->
    <header class="game-header">
      <div class="container" style="
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
">
        <div class="brand">
          <h1 class="game-title">🎰 Ruleta PascualBet</h1>
        </div>
        <div class="user-actions">
          <div class="balance">
            Balance: <strong>${{ credits.toFixed(2) }}</strong>
          </div>
          <div class="balance">
            Apuesta: <strong style="color: var(--danger)">${{ totalBet }}</strong>
          </div>
        </div>
      </div>
    </header>

    <!-- Winner Banner -->
    <div 
      v-if="lastResult !== null && !spinning" 
      class="winner-banner animate-win-pulse"
    >
      <div class="winner-content">
        <div class="winner-label">RESULTADO FINAL</div>
        <div class="winner-display">
          <div 
            class="winner-number"
            :class="getNumberColorClass(lastResult)"
          >
            {{ lastResult }}
          </div>
          <div class="winner-info">
            <div class="winner-type">{{ getNumberType(lastResult) }}</div>
            <div class="winner-details">{{ getNumberDetails(lastResult) }}</div>
          </div>
        </div>
        <div v-if="lastWin > 0" class="winner-prize">
          GANANCIA: +${{ lastWin }}
        </div>
        <div v-else class="winner-message">
          SIN PREMIO ESTA RONDA
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Main Game Area -->
      <div class="game-layout">
        
        <!-- Roulette Wheel Section -->
        <div class="wheel-section">
          <div class="card wheel-card">
            <div class="wheel-container" :class="{ 'spinning': spinning }">
              <canvas 
                ref="wheelCanvas" 
                width="320" 
                height="320" 
                class="roulette-wheel"
              ></canvas>
              
              <!-- Wheel Pointer -->
              <div class="wheel-pointer"></div>

              <!-- Ball -->
              <div 
                ref="ballElement"
                class="roulette-ball"
                :style="ballPosition"
              >
              </div>

              <!-- Result Highlight -->
              <div 
                v-if="resultHighlight.show"
                class="result-highlight animate-win-pulse"
                :style="resultHighlight.style"
              >
                <span class="result-number">{{ lastResult }}</span>
                <div class="result-arrow"></div>
              </div>

              <!-- Big Result Overlay -->
              <div 
                v-if="showBigResult"
                class="big-result-overlay"
              >
                <div class="big-result-content">
                  <div 
                    class="big-result-number animate-win-pulse"
                    :class="getNumberColorClass(lastResult)"
                  >
                    {{ lastResult }}
                  </div>
                  <div class="big-result-text">¡SALIÓ EL {{ lastResult }}!</div>
                  <div class="big-result-type">{{ getNumberType(lastResult) }}</div>
                  <div class="big-result-indicator">
                    🎯 ¡NÚMERO GANADOR! 🎯
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Spin Button -->
            <div class="spin-section">
              <button 
                @click="spin" 
                :disabled="spinning || totalBet === 0"
                class="btn play spin-btn"
                :class="{ 'spinning': spinning }"
              >
                {{ spinning ? 'GIRANDO...' : 'GIRAR RULETA' }}
              </button>
              <button 
                class="btn back-btn" 
                @click="goBack" 
                :disabled="spinning || totalBet > 0"
              >
                VOLVER AL MENÚ
              </button>
            </div>
            
            <!-- Results Display -->
            <div v-if="lastResult !== null && !spinning" class="results-panel">
              <div class="results-header">ÚLTIMO RESULTADO</div>
              <div class="results-display">
                <div 
                  class="result-circle"
                  :class="getNumberColorClass(lastResult)"
                >
                  {{ lastResult }}
                </div>
                <div class="result-info">
                  <div class="result-label">{{ getNumberType(lastResult) }}</div>
                  <div class="result-details">{{ getNumberDetails(lastResult) }}</div>
                </div>
              </div>
              <div class="results-outcome">
                <div v-if="lastWin > 0" class="win-message">
                  GANANCIA: +${{ lastWin }}
                </div>
                <div v-else class="lose-message">
                  SIN PREMIO
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Betting Table Section -->
        <div class="betting-section">
          <div class="card betting-table">

            <h2 class="h2">MESA DE APUESTAS</h2>
            
            <div class="table-layout">
              <!-- Zero -->
              <div class="zero-container">
                <div 
                  @click="placeBet('number', 0)"
                  class="number-cell zero-cell green"
                  :class="{ 'winning-number': lastResult === 0, 'has-bet': bets.numbers[0] > 0 }"
                >
                  <span class="number-value">0</span>
                  <div v-if="bets.numbers[0] > 0" class="bet-chip">
                    ${{ bets.numbers[0] }}
                  </div>
                </div>
              </div>

              <!-- Main Grid -->
              <div class="main-grid">
                <!-- Number Grid -->
                <div class="numbers-grid">
                  <div 
                    v-for="number in numbers.slice(1)" 
                    :key="number"
                    @click="placeBet('number', number)"
                    class="number-cell"
                    :class="[
                      getNumberColorClass(number),
                      { 'winning-number': lastResult === number },
                      { 'has-bet': bets.numbers[number] > 0 }
                    ]"
                  >
                    <span class="number-value">{{ number }}</span>
                    <div v-if="bets.numbers[number] > 0" class="bet-chip">
                      ${{ bets.numbers[number] }}
                    </div>
                  </div>
                </div>

                <!-- Outside Bets -->
                <div class="outside-bets">
                  <div @click="placeBet('range', 'low')" class="bet-cell range-bet" :class="{ 'has-bet': bets.ranges.low > 0 }"><span>1-18</span><div v-if="bets.ranges.low > 0" class="bet-chip">${{ bets.ranges.low }}</div></div>
                  <div @click="placeBet('parity', 'even')" class="bet-cell parity-bet" :class="{ 'has-bet': bets.parity.even > 0 }"><span>PAR</span><div v-if="bets.parity.even > 0" class="bet-chip">${{ bets.parity.even }}</div></div>
                  <div @click="placeBet('color', 'red')" class="bet-cell red-bet" :class="{ 'has-bet': bets.colors.red > 0 }"><span>ROJO</span><div v-if="bets.colors.red > 0" class="bet-chip">${{ bets.colors.red }}</div></div>
                  <div @click="placeBet('color', 'black')" class="bet-cell black-bet" :class="{ 'has-bet': bets.colors.black > 0 }"><span>NEGRO</span><div v-if="bets.colors.black > 0" class="bet-chip">${{ bets.colors.black }}</div></div>
                  <div @click="placeBet('parity', 'odd')" class="bet-cell parity-bet" :class="{ 'has-bet': bets.parity.odd > 0 }"><span>IMPAR</span><div v-if="bets.parity.odd > 0" class="bet-chip">${{ bets.parity.odd }}</div></div>
                  <div @click="placeBet('range', 'high')" class="bet-cell range-bet" :class="{ 'has-bet': bets.ranges.high > 0 }"><span>19-36</span><div v-if="bets.ranges.high > 0" class="bet-chip">${{ bets.ranges.high }}</div></div>
                </div>
              </div>
            </div>

            <!-- Bet Controls -->
            <div class="bet-controls">
              <div class="bet-amounts">
                <div class="muted">VALOR DE LA FICHA:</div>
                <div class="amount-buttons">
                  <button 
                    v-for="amount in betAmounts" 
                    :key="amount"
                    @click="currentBetAmount = amount"
                    class="btn-outline amount-btn"
                    :class="{ 'active': currentBetAmount === amount }"
                  >
                    ${{ amount }}
                  </button>
                </div>
              </div>
              
              <div class="action-buttons">
                <button 
                  @click="clearAllBets"
                  class="btn clear-btn"
                >
                  LIMPIAR APUESTAS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { balance, syncBalance } from '../../store/balance.js';
import { registerBet, GAME_IDS } from '../../utils/betApi.js';

export default {
  name: 'Roulette',
  setup() {
    return { ...balance };
  },
  data() {
    return {
      spinning: false,
      lastResult: null,
      lastWin: 0,
      currentBetAmount: 10,
      betAmounts: [5, 10, 25, 50, 100],
      // Secuencia de números de la ruleta europea
      wheelNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
      numbers: Array.from({length: 37}, (_, i) => i), // 0-36
      redNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
      bets: {
        numbers: {},
        colors: { red: 0, black: 0 },
        parity: { even: 0, odd: 0 },
        ranges: { low: 0, high: 0 }
      },
      wheelAngle: 0,
      ballAngle: 0,
      animationId: null,
      resultHighlight: {
        show: false,
        style: {}
      },
      showBigResult: false,
      currentBetId: null, // Para guardar el id_sesion de la apuesta
    }
  },
  computed: {
    totalBet() {
      let total = 0;
      
      // Sum number bets
      for (let number in this.bets.numbers) {
        total += this.bets.numbers[number];
      }
      
      // Sum color bets
      total += this.bets.colors.red + this.bets.colors.black;
      
      // Sum parity bets
      total += this.bets.parity.even + this.bets.parity.odd;
      
      // Sum range bets
      total += this.bets.ranges.low + this.bets.ranges.high;
      
      return total;
    },
    
    ballPosition() {
      const centerX = 175; // Centro del canvas
      const centerY = 175;
      const radius = 140; // Radio donde se mueve la pelota
      
      const angleRad = (this.ballAngle * Math.PI) / 180;
      const x = centerX + Math.cos(angleRad) * radius - 8; // -8 para centrar la pelota
      const y = centerY + Math.sin(angleRad) * radius - 8;
      
      return {
        left: x + 'px',
        top: y + 'px'
      };
    }
  },
  watch: {
    wheelAngle() {
      this.drawWheel();
    },
    ballAngle() {
      // La posición de la pelota se actualiza automáticamente via computed property
    }
  },
  mounted() {
    syncBalance();
    this.initializeWheel();
    // Inicializar el audio de la ruleta
    this.rouletteAudio = new Audio('/Sounds/efecto de sonido de ruleta de juego (game roulette sound effect) 2020 - Luis Bernal.mp3');
    this.rouletteAudio.preload = 'auto';
    // Esperar a que el canvas esté renderizado antes de dibujar
    this.$nextTick(() => {
      setTimeout(() => {
        this.drawWheel();
      }, 100);
    });
  },
  methods: {
    initializeWheel() {
      // Initialize number bets object
      for (let i = 0; i <= 36; i++) {
        this.bets.numbers[i] = 0;
      }
    },
    
    getNumberColorClass(number) {
      if (number === 0) return 'green';
      return this.redNumbers.includes(number) ? 'red' : 'black';
    },
    
    getNumberType(number) {
      if (number === 0) return 'VERDE';
      return this.redNumbers.includes(number) ? 'ROJO' : 'NEGRO';
    },
    
    getNumberDetails(number) {
      if (number === 0) return 'CERO';
      
      let details = [];
      
      // Parity
      details.push(number % 2 === 0 ? 'PAR' : 'IMPAR');
      
      // Range
      if (number >= 1 && number <= 18) {
        details.push('1-18');
      } else if (number >= 19 && number <= 36) {
        details.push('19-36');
      }
      
      return details.join(', ');
    },
    
    placeBet(type, value) {
      if (this.spinning || this.credits < this.currentBetAmount) return;
      
      if (type === 'number') {
        this.bets.numbers[value] += this.currentBetAmount;
      } else if (type === 'color') {
        this.bets.colors[value] += this.currentBetAmount;
      } else if (type === 'parity') {
        this.bets.parity[value] += this.currentBetAmount;
      } else if (type === 'range') {
        this.bets.ranges[value] += this.currentBetAmount;
      }
      
      // La lógica correcta es descontar el total de la apuesta al girar,
      // no en cada ficha que se pone. Por eso, aquí no modificamos el saldo.
      // La apuesta total se descontará en el método spin().
      // this.credits -= this.currentBetAmount; // <- Lógica anterior incorrecta eliminada
    },

    clearAllBets() {
      // Este método ahora solo limpia las apuestas del frontend,
      // ya que el dinero no se ha descontado aún.
      // Si se usa después de haber girado, el dinero ya se apostó.
      if (this.spinning) return;

      // Clear number bets
      for (let number in this.bets.numbers) {
        this.bets.numbers[number] = 0;
      }
      // Clear color bets
      this.bets.colors = { red: 0, black: 0 };
      // Clear parity bets
      this.bets.parity = { even: 0, odd: 0 };
      // Clear range bets
      this.bets.ranges = { low: 0, high: 0 };
    },
    
    // Este método se usaba antes, ahora la lógica es diferente.
    // Lo mantengo por si lo necesitas para otra cosa, pero no se usa en el flujo de apuesta.
    clearAllBetsAndRefund() {
      // Reset all bets and refund credits
      let totalRefund = this.totalBet;
      
      // Clear number bets
      for (let number in this.bets.numbers) {
        this.bets.numbers[number] = 0;
      }
      
      // Clear color bets
      this.bets.colors = { red: 0, black: 0 };
      
      // Clear parity bets
      this.bets.parity = { even: 0, odd: 0 };
      
      // Clear range bets
      this.bets.ranges = { low: 0, high: 0 };
      
      // Refund credits
      syncBalance(); // Sincronizamos por si acaso, aunque no debería ser necesario.
    },
    
    async spin() {
      if (this.spinning || this.totalBet === 0) return;

      // Reproducir sonido de ruleta justo al girar
      if (this.rouletteAudio) {
        this.rouletteAudio.currentTime = 0;
        this.rouletteAudio.play().catch(() => {});
      }

      this.spinning = true;
      this.showBigResult = false;
      this.resultHighlight.show = false;

      // Reset previous results visually
      this.lastResult = null;
      this.lastWin = 0;

      // Generate random result
      const result = Math.floor(Math.random() * 37); // 0-36

      this.animateWheelAndBall(result);
    },
    
    animateWheelAndBall(result) {
      const canvas = this.$refs.wheelCanvas;
      if (!canvas) return;
      
      // Normalizamos AMBOS ángulos para que cada animación empiece desde un estado limpio.
  // Esto evita la acumulación de valores muy grandes que rompían la animación.
  const initialWheelAngle = this.wheelAngle % 360;
  const initialBallAngle = this.ballAngle % 360; 

  // Calculate target angles
  const finalWheelAngle = initialWheelAngle + 1080 + Math.random() * 720; // 3-5 giros para la ruleta
  const resultIndex = this.wheelNumbers.indexOf(result); // Encuentra el índice del número ganador
  const anglePerSegment = 360 / 37;
  // El ángulo del segmento ganador, ajustado para que el puntero (en la parte superior, 270 grados) quede en el centro del segmento.
  const targetSegmentAngle = resultIndex * anglePerSegment + anglePerSegment / 2;
  // El ángulo final de la bola es el ángulo final de la ruleta MÁS el ángulo del segmento ganador,
  // MENOS varias rotaciones completas para que la bola gire en dirección opuesta.
  const finalBallAngle = finalWheelAngle + targetSegmentAngle - (360 * 24); // 24 giros en dirección opuesta
      
  const startTime = performance.now();
  const duration = 8600; // Animación más larga: 8.6 segundos
      
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out-cubic) para una desaceleración más natural
        const easeOut = 1 - Math.pow(1 - progress, 4);
        
        // Update angles
        this.wheelAngle = initialWheelAngle + (finalWheelAngle - initialWheelAngle) * easeOut; // La ruleta gira en una dirección
        this.ballAngle = initialBallAngle + (finalBallAngle - initialBallAngle) * easeOut; // La bola interpola a su destino final (que incluye giros negativos)
        
        if (progress < 1) {
          this.animationId = requestAnimationFrame(animate); 
        } else {
          // Animation complete
          this.spinning = false;
          this.lastResult = result;
          this.calculateWinnings(result);
          this.showResultHighlight(result);
          this.showBigResult = true;
          
          // Hide big result after 3 seconds
          setTimeout(() => {
            this.showBigResult = false;
          }, 3000);
        }
      };
      
      this.animationId = requestAnimationFrame(animate);
    },
    
    showResultHighlight(result) {
      // Show highlight ring around winning number segment
      const canvas = this.$refs.wheelCanvas;
      if (!canvas) return;
      
      const segmentAngle = 360 / 37;
      const resultIndex = this.wheelNumbers.indexOf(result);
      const resultAngle = resultIndex * segmentAngle;
      
      // Calculate position for highlight
      const centerX = 160;
      const centerY = 160;
      const radius = 130;
      
      const angleRad = (resultAngle * Math.PI) / 180;
      const x = centerX + Math.cos(angleRad) * radius - 25; // -25 to center the highlight
      const y = centerY + Math.sin(angleRad) * radius - 25;
      
      this.resultHighlight = {
        show: true,
        style: {
          left: x + 'px',
          top: y + 'px'
        }
      };
      
      // Hide after 5 seconds
      setTimeout(() => {
        this.resultHighlight.show = false;
      }, 5000);
    },
    
    async calculateWinnings(result) {
      let totalWin = 0;
      let highestMultiplier = 0;
      
      // Check number bets (35:1 payout)
      if (this.bets.numbers[result] > 0) {
        totalWin += this.bets.numbers[result] * 36;
        highestMultiplier = Math.max(highestMultiplier, 36);
      }
      
      // Check color bets (1:1 payout)
      if (result !== 0) {
        if (this.redNumbers.includes(result) && this.bets.colors.red > 0) {
          totalWin += this.bets.colors.red * 2;
          highestMultiplier = Math.max(highestMultiplier, 2);
        } else if (!this.redNumbers.includes(result) && this.bets.colors.black > 0) {
          totalWin += this.bets.colors.black * 2;
          highestMultiplier = Math.max(highestMultiplier, 2);
        }
      }
      
      // Check parity bets (1:1 payout)
      if (result !== 0) {
        if (result % 2 === 0 && this.bets.parity.even > 0) {
          totalWin += this.bets.parity.even * 2;
          highestMultiplier = Math.max(highestMultiplier, 2);
        } else if (result % 2 !== 0 && this.bets.parity.odd > 0) {
          totalWin += this.bets.parity.odd * 2;
          highestMultiplier = Math.max(highestMultiplier, 2);
        }
      }
      
      // Check range bets (1:1 payout)
      if (result >= 1 && result <= 18 && this.bets.ranges.low > 0) {
        totalWin += this.bets.ranges.low * 2;
        highestMultiplier = Math.max(highestMultiplier, 2);
      } else if (result >= 19 && result <= 36 && this.bets.ranges.high > 0) {
        totalWin += this.bets.ranges.high * 2;
        highestMultiplier = Math.max(highestMultiplier, 2);
      }
      
      this.lastWin = totalWin > 0 ? totalWin - this.totalBet : 0; // Ganancia neta

      // Determinar resultado de la apuesta
      const betResult = totalWin > this.totalBet ? 'GANADO' : (totalWin === this.totalBet ? 'GANADO' : 'PERDIDA');

      try {
        // Registrar apuesta usando la función helper
        await registerBet({
          uid: this.uid,
          gameId: GAME_IDS.RULETA,
          amount: this.totalBet,
          result: betResult,
          multiplier: highestMultiplier
        });
      } catch (error) {
        console.error('Error al registrar apuesta:', error);
      }
      
      await syncBalance(); // Sincronizar saldo para reflejar la ganancia/pérdida
      
      // Clear all bets after the spin (but don't refund - money was already spent)
      setTimeout(() => {
        this.clearBetsWithoutRefund();
      }, 1000);
    },
    
    clearBetsWithoutRefund() {
      // Clear number bets
      for (let number in this.bets.numbers) {
        this.bets.numbers[number] = 0;
      }
      
      // Clear color bets
      this.bets.colors = { red: 0, black: 0 };
      
      // Clear parity bets
      this.bets.parity = { even: 0, odd: 0 };
      
      // Clear range bets
      this.bets.ranges = { low: 0, high: 0 };
    },
    
    drawWheel() {
      const canvas = this.$refs.wheelCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 150;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);      
      
      // Draw roulette wheel
      const segmentAngle = (2 * Math.PI) / 37; // 37 números (0-36)
      
      this.wheelNumbers.forEach((number, index) => {
        const startAngle = (index * segmentAngle) + (this.wheelAngle * Math.PI / 180);
        const endAngle = (index + 1) * segmentAngle + (this.wheelAngle * Math.PI / 180);
        
        // Determine color
        let color;
        if (number === 0) {
          color = '#004225'; // Verde botella oscuro
        } else if (this.redNumbers.includes(number)) {
          color = '#8b0000'; // Burdeos
        } else {
          color = '#1f2937'; // Black
        }
        
        // Draw segment
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw number
        const textAngle = startAngle + segmentAngle / 2;
        const textX = centerX + Math.cos(textAngle) * (radius * 0.8);
        const textY = centerY + Math.sin(textAngle) * (radius * 0.8);
        
        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.font = 'bold 14px Montserrat';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number.toString(), 0, 0);
        ctx.restore();
      });
      
      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
      ctx.fillStyle = '#d4af37';
      ctx.fill();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw outer rim
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 5;
      ctx.stroke();
    },
    goBack() {
      this.$router.push('/menu');
    }
  },
  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
};
</script>

<style scoped>
/* Tema principal usando CSS variables */
.roulette-container {
  background: #121212;
  color: var(--text);
  min-height: 100vh;
  font-family: 'Montserrat', sans-serif;
  text-transform: uppercase;
}

/* Header */
.game-header {
  background: transparent;
  border-bottom: 3px solid var(--border);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.brand {
  display: flex;
  align-items: center;
}

.game-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  margin: 0;
}

.user-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.balance {
  color: white;
  font-size: 1.1rem;
}

/* Winner Banner */
.winner-banner {
  background: linear-gradient(45deg, #1e1e1e, #121212);
  border: 3px solid var(--border);
  border-radius: 12px;
  margin: 1rem;
  padding: 1rem;
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.winner-content {
  text-align: center;
}

.winner-label {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 1rem;
}

.winner-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 1rem;
}

.winner-number {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  border: 4px solid #d4af37; /* Borde dorado */
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
}

.winner-number.red {
  background: var(--danger);
}

.winner-number.black {
  background: #1f2937;
}

.winner-number.green {
  background: var(--success);
}

.winner-info {
  text-align: left;
}

.winner-type {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--text);
}

.winner-details {
  font-size: 1.2rem;
  color: var(--muted);
}

.winner-prize {
  font-size: 2rem;
  font-weight: bold;
  color: var(--success);
}

.winner-message {
  font-size: 1.5rem;
  color: var(--muted);
}

/* Game Layout */
.game-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}

/* Card styling */
.card {
  background: rgba(30, 30, 30, 0.7);
  border: 1px solid var(--border);
  border-radius: 16px; /* Bordes más redondeados */
  padding: 1.5rem;
  box-shadow: 0 8px 30px rgba(0,0,0,0.3);
}

.wheel-section, .betting-section {
  display: flex;
  flex-direction: column;
}

/* Wheel Section */
.wheel-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 400px;
  height: 400px;
  margin-bottom: 2rem;
  filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.2)); /* Brillo sutil */
}

.roulette-wheel {
  border: 8px solid #c0c0c0; /* Plateado */
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4), inset 0 0 15px rgba(255,255,255,0.1); /* Efecto metálico */
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 25px solid #d4af37;
  z-index: 10;
}

.roulette-ball {
  position: absolute;
  width: 16px;
  height: 16px;
  background: radial-gradient(circle at 30% 30%, #ffffff, #e0e0e0); /* Blanco mate */
  border-radius: 50%;
  z-index: 5;
  box-shadow: 0 2px 5px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(255,255,255,0.4); /* Sombra suave */
}

/* Result Highlight */
.result-highlight {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 4px solid var(--warning);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.8);
  z-index: 8;
}

.result-number {
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.result-arrow {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 12px solid var(--warning);
}

/* Big Result Overlay */
.big-result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  z-index: 15;
}

.big-result-content {
  text-align: center;
  color: white;
}

.big-result-number {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: bold;
  margin: 0 auto 1rem;
  border: 6px solid white;
}

.big-result-text {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.big-result-type {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.big-result-indicator {
  font-size: 1.8rem;
  font-weight: bold;
}

/* Spin Button */
.spin-section {
  text-align: center;
  margin-bottom: 2rem;
  width: 400px;
}

.btn {
  border-radius: 8px;
  font-weight: 700;
  transition: all 0.2s ease;
  letter-spacing: 1px;
}

.spin-btn {
  font-size: 1.5rem; /* Botón más grande */
  padding: 1.2rem 3rem;
  background: #001f3f; /* Azul marino */
  border: none;
  color: #d4af37; /* Texto dorado */
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 31, 63, 0.4);
}

.spin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(212, 175, 55, 0.3); /* Resplandor al hover */
  filter: brightness(1.1);
}

.back-btn {
  background: #1e1e1e;
  color: #c0c0c0;
  border: 1px solid #444;
  margin-top: 1rem;
}
.back-btn:hover {
  background: #2a2a2a;
}
.back-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #1e1e1e; /* Mantener el color de fondo original */
}

.spin-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-btn.spinning {
  animation: pulse 1s infinite;
}

/* Results Panel */
.results-panel {
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  padding: 1.5rem;
  color: var(--text);
}

.results-header {
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.results-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.result-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  border: 3px solid #d4af37; /* Borde dorado */
}

.result-info {
  text-align: left;
}

.result-label {
  font-size: 1.1rem;
  font-weight: bold;
}

.result-details {
  font-size: 1rem;
  opacity: 0.8;
}

.results-outcome {
  text-align: center;
}

.win-message {
  color: var(--success);
  font-size: 1rem;
  font-weight: bold;
}

.lose-message {
  color: var(--muted);
  font-size: 1rem;
}
.betting-table{
  width: 800px;
  height: 100%;
}
/* Betting Table */
.h2 {
  font-size: 1.8rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--text);
}

/* New Table Layout */
.table-layout {
  display: flex;
  gap: 5px;
  margin-bottom: 1.5rem;
}

.zero-container {
  display: flex;
  align-items: stretch; /* Make zero cell as tall as the number grid */
}

.main-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
}

/* Numbers Grid */
.numbers-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 4px;
}

.number-cell {
  position: relative;
  /* background is now set by color class */
  color: white;
  padding: 0.6rem;
  text-align: center;
  border-radius: 6px; /* Bordes apenas redondeados */
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  border: 1px solid transparent;
  box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.number-cell:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4); /* Resplandor dorado */
}

.number-cell.red {
  background: #8b0000; /* Burdeos */
}

.number-cell.black {
  background: #1f2937;
}

.number-cell.green {
  background: #004225; /* Verde botella */
}

.number-cell.winning-number {
  border-color: var(--warning);
  box-shadow: 0 0 20px var(--warning);
  animation: pulse 1s infinite;
}

.number-cell.has-bet {
  border-color: #d4af37;
  box-shadow: 0 0 10px #d4af37;
}

.number-value {
  font-size: 1rem;
}

.bet-chip {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #d4af37;
  color: var(--text);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(212, 175, 55, 0.9); /* Golden chip */
  color: #121212;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
  z-index: 2;
}

/* Hide text when chip is present */
.bet-cell.has-bet span,
.number-cell.has-bet .number-value {
  opacity: 0;
}

.zero-cell {
  width: 45px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Outside Bets */
.outside-bets {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
}

.bet-cell {
  position: relative;
  padding: 0.6rem;
  text-align: center;
  border-radius: 8px; /* Rectangular */
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
  color: white;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.bet-cell:hover {
  transform: translateY(-2px);
  filter: brightness(1.2);
}

.bet-cell.has-bet {
  border-color: #d4af37;
  box-shadow: 0 0 10px #d4af37;
}

.bet-cell span {
  font-size: 0.8rem;
}

.red-bet {
  background: #8b0000;
  box-shadow: 0 0 15px rgba(139, 0, 0, 0.4);
}

.black-bet {
  background: linear-gradient(145deg, #4b5563, #1f2937);
  box-shadow: 0 0 15px rgba(75, 85, 99, 0.4);
}

.parity-bet {
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
}

.range-bet {
  background: linear-gradient(145deg, #6b7280, #4b5563);
  box-shadow: 0 0 15px rgba(107, 114, 128, 0.4);
}

/* Bet Controls */
.bet-controls {
  padding-top: 3rem;
  border-top: 1px solid var(--border);
}

.bet-amounts {
  margin-bottom: 1rem;
}

.muted {
  font-size: 0.9rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}

.amount-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-outline {
  background: transparent;
  border: 2px solid #d4af37;
  color: var(--primary);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.btn-outline:hover {
  background: #d4af37;
  color: white;
}

.btn-outline.active {
  background: #d4af37;
  color: white;
}

.amount-btn {
  font-size: 0.9rem;
}

.action-buttons {
  margin-top: 1rem;
  text-align: center;
}

.clear-btn {
  background: #4a4a4a;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
}
.clear-btn:hover {
  background: #616161;
}

/* Animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes win-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-win-pulse {
  animation: win-pulse 0.8s ease-in-out infinite;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.animate-flash {
  animation: flash 0.3s ease-in-out 5;
}
</style>