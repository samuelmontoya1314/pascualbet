<template>
  <div class="slot-machine-container">
    
    <!-- Fondo animado de partículas -->
    <div class="particles">
      <div class="particle" v-for="n in 30" :key="n"></div>
    </div>

    <!-- Header with theme styling -->
    <header class="game-header">
      <div class="container" style="
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
">
        <div class="brand">
          <h1 class="game-title">🎰 Tragamonedas PascualBet 🎰</h1>
        </div>
        <div class="user-actions">
          <div class="balance">
            Créditos: <strong>${{ credits.toFixed(2) }}</strong>
          </div>
          <div class="balance">
            Apuesta: <strong class="danger-text">${{ currentBet }}</strong>
          </div>
        </div>
      </div>
    </header>

    <!-- Winner Banner -->
    <div 
      v-if="lastWin > 0" 
      class="winner-banner animate-win-pulse"
    >
      <div class="winner-content">
        <div class="winner-label">🎰 ¡JACKPOT! 🎰</div>
        <div class="winner-display">
          <div class="winner-prize">
            💰 ¡GANASTE ${{ lastWin }}! 💰
          </div>
          <div class="winner-combo">{{ winMessage }}</div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- Main Game Area -->
      <div class="game-layout">
        
        <!-- Slot Machine Section -->
        <div class="machine-section">
          <div class="card machine-card">
            <div class="machine-frame">
              <!-- Screen with Canvas -->
              <div class="screen-container">
                <canvas 
                  ref="slotCanvas" 
                  width="800" 
                  height="200" 
                  class="slot-screen"
                ></canvas>
              </div>
              
              <!-- Paylines Indicator -->
              <div class="payline-indicator">
                <div class="payline-badge">
                  LÍNEA DE PAGO
                </div>
              </div>

              <!-- Spin Controls -->
              <div class="controls-section">
                <!-- Bet Controls -->
                <div class="bet-controls">
                  <button 
                    @click="decreaseBet"
                    :disabled="spinning || currentBet <= minBet"
                    class="btn control-btn decrease-btn"
                    :class="{ 'disabled': spinning || currentBet <= minBet }"
                  >
                    -
                  </button>
                  <div class="bet-display">
                    Apuesta: <strong>${{ currentBet }}</strong>
                  </div>
                  <button 
                    @click="increaseBet"
                    :disabled="spinning || currentBet >= maxBet || currentBet + betStep > credits"
                    class="btn control-btn increase-btn"
                    :class="{ 'disabled': spinning || currentBet >= maxBet || currentBet + betStep > credits }"
                  >
                    +
                  </button>
                </div>

                <!-- Action Buttons -->
                <div class="action-controls">
                  <button 
                    @click="spin"
                    :disabled="spinning || credits < currentBet"
                    class="btn play spin-btn"
                    :class="{ 'spinning': spinning, 'disabled': credits < currentBet }"
                  >
                    {{ spinning ? 'GIRANDO...' : 'GIRAR' }}
                  </button>
                  
                  <button 
                      @click="setMaxBet"
                      :disabled="spinning || credits < maxBet"
                      class="btn max-bet-btn"
                      :class="{ 'disabled': spinning || credits < maxBet }"
                    >
                      APUESTA MÁX
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Paytable Section -->
        <div class="paytable-section">
          <div class="card paytable-card">
            <h2 class="h2 paytable-title">TABLA DE PAGOS</h2>
            <div class="paytable-grid">
              <div v-for="(payout, combo) in paytable" :key="combo" class="payout-item">
                <div class="combo-symbols">{{ combo }}</div>
                <div class="payout-multiplier">{{ payout }}x</div>
              </div>
            </div>
            
            <!-- Game Info -->
            <div class="game-info">
              <div class="info-item">
                <span class="muted">Apuesta mínima:</span>
                <strong>${{ minBet }}</strong>
              </div>
              <div class="info-item">
                <span class="muted">Apuesta máxima:</span>
                <strong>${{ maxBet }}</strong>
              </div>
              <div class="info-item">
                <span class="muted">Pago por par:</span>
                <strong>0.5x</strong>
              </div>
            </div>
            
            <!-- Back Button -->
            <div class="back-section">
              <button 
                @click="goBack"
                :disabled="spinning"
                class="btn btn-outline"
              >
                Volver al Menú
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { balance, syncBalance } from '../../store/balance.js';
export default {
  name: 'SlotMachine',
  setup() {
    return { ...balance };
  },
  data() {
    return {
      currentBet: 10,
      minBet: 5,
      maxBet: 100,
      betStep: 5,
      spinning: false,
      lastWin: 0,
      winMessage: '',
      reels: ['🍒', '🍊', '🍋'],
      symbols: ['🍒', '🍊', '🍋', '🍇', '⭐', '💎', '🔔', '7️⃣'],
      paytable: {
        '� 🍒 🍒': 10,
        '🍊 🍊 ': 15,
        '🍋 🍋 🍋': 20,
        '🍇 🍇 🍇': 25,
        '⭐ ⭐ ⭐': 50,
        '💎 💎 💎': 100,
        '🔔 🔔 🔔': 200,
        '7️⃣ 7️⃣ 7️⃣': 777
      },
      animationId: null,
      spinStartTime: 0,
  spinDuration: 4000, // Giro más rápido: 4 segundos
      reelAnimations: [0, 0, 0],
      symbolTotalHeight: 100, // Total vertical space for a symbol (content + padding + margin)
      symbolContentHeight: 60, // Height of the actual symbol text/image
      targetSymbols: ['🍒', '🍊', '🍋'],
      allReelSymbols: [
        [], [], [] // Arrays to hold all symbols for each reel during animation
      ],
      spinAudio: null, // Propiedad para el objeto de audio
      jackpotAudio: null // Nuevo: audio del jackpot
    }
  },
  
  mounted() {
    this.initializeCanvas();
    this.randomizeReels();
    this.drawSlotMachine();
    // Inicializamos el audio aquí para que se precargue
    this.spinAudio = new Audio('/sounds/slot-spin.mp3');
    this.spinAudio.preload = 'auto';
    // Nuevo: inicializar el audio del jackpot
    this.jackpotAudio = new Audio('/Sounds/Slot-Machine-Jackpot-Sound-Effect.mp3');
    this.jackpotAudio.preload = 'auto';
  },

  beforeUnmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },

  methods: {
    initializeCanvas() {
      const canvas = this.$refs.slotCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Initialize reel symbol arrays
      for (let i = 0; i < 3; i++) {
        this.allReelSymbols[i] = [];
        for (let j = 0; j < 20; j++) {
          this.allReelSymbols[i].push(
            this.symbols[Math.floor(Math.random() * this.symbols.length)]
          );
        }
      }
    },

    randomizeReels() {
      this.reels = [
        this.symbols[Math.floor(Math.random() * this.symbols.length)],
        this.symbols[Math.floor(Math.random() * this.symbols.length)],
        this.symbols[Math.floor(Math.random() * this.symbols.length)]
      ];
    },

    drawSlotMachine() {
      const canvas = this.$refs.slotCanvas;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Get CSS variables
      const computedStyle = getComputedStyle(document.documentElement);
      const cardColor = computedStyle.getPropertyValue('--card-2').trim() || '#141c27';
      const borderColor = computedStyle.getPropertyValue('--border').trim() || '#1f2a37';
      const primaryColor = computedStyle.getPropertyValue('--primary').trim() || '#0ea5e9';
      
      // Clear canvas
      ctx.fillStyle = `hsl(${cardColor})`;
      ctx.fillRect(0, 0, width, height);
      
      // Draw reel backgrounds
      const reelWidth = 160;
      const reelHeight = this.symbolTotalHeight * 3; // Para mostrar 3 símbolos
      const spacing = 60; // Aumentamos el espacio para crear un "marco" más visible
      const startX = (width - (3 * reelWidth + 2 * spacing)) / 2;
      const startY = (height - reelHeight) / 2; // Centrar verticalmente
      
      // Crear degradado para el marco metálico
      const frameGradient = ctx.createLinearGradient(0, startY, 0, startY + reelHeight);
      frameGradient.addColorStop(0, '#4a5568'); // Gris oscuro
      frameGradient.addColorStop(0.5, '#1a202c'); // Negro azulado
      frameGradient.addColorStop(1, '#2d3748'); // Gris medio

      for (let i = 0; i < 3; i++) {
        const x = startX + i * (reelWidth + spacing);
        const y = startY;
        
        // Draw reel frame
        ctx.fillStyle = frameGradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.fillRect(x - 4, y - 4, reelWidth + 8, reelHeight + 8);
        ctx.shadowColor = 'transparent'; // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw reel background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, reelWidth, reelHeight);
        
        // Draw reel border
        ctx.strokeStyle = `hsl(${borderColor})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, reelWidth, reelHeight);
        
        // Draw symbols
        this.drawReel(ctx, i, x, y, reelWidth, reelHeight);
      }
      
      // Draw center payline
      if (this.lastWin > 0 && !this.spinning) {
        ctx.strokeStyle = '#fef08a'; // Amarillo brillante en ganancia
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = `hsl(${computedStyle.getPropertyValue('--danger').trim() || '#ef4444'})`;
      }
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(20, height / 2);
      ctx.lineTo(width - 20, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowColor = 'transparent'; // Reset shadow
    },

    drawReel(ctx, reelIndex, x, y, width, height) {
      const centerY = y + height / 2;
      
      if (this.spinning) {
        // Aplicar efecto de desenfoque durante el giro
        ctx.filter = 'blur(2px)';

        // Draw spinning animation with random symbols
        const animationOffset = this.reelAnimations[reelIndex];
        const symbolTotalHeight = this.symbolTotalHeight; // Usamos la altura total del símbolo
        
        // Draw multiple symbols for spinning effect
        // Dibuja una tira de símbolos que se repite para dar la ilusión de un carrete infinito.
        for (let i = -5; i <= 5; i++) {
          const symbolY = centerY + (i * symbolTotalHeight) + animationOffset;
          if (symbolY > y - 50 && symbolY < y + height + 50) {
            // Usamos el array `allReelSymbols` que contiene el símbolo final en la posición correcta.
            const symbolIndex = (Math.floor(this.allReelSymbols[reelIndex].length / 2) + i + this.allReelSymbols[reelIndex].length) % this.allReelSymbols[reelIndex].length; // Ajustamos el índice central
            const symbol = this.allReelSymbols[reelIndex][symbolIndex];
            this.drawSymbol(ctx, symbol, x + width / 2, symbolY);
          }
        }
        
        // Limpiar filtro
        ctx.filter = 'none';

        // Draw masks to hide symbols outside reel
        const cardColor = getComputedStyle(document.documentElement).getPropertyValue('--card-2').trim() || '#141c27';
        ctx.fillStyle = `hsl(${cardColor})`;
        ctx.fillRect(x - 4, y - 60, width + 8, 60); // Top mask
        ctx.fillRect(x - 4, y + height, width + 8, 60); // Bottom mask
        
      } else {
        // Cuando la animación ha terminado, `this.reels` contiene el resultado final.
        // Dibujamos ese símbolo estáticamente en el centro.
        const finalSymbol = this.reels[reelIndex];
        this.drawSymbol(ctx, finalSymbol, x + width / 2, centerY);
      }
    },

    drawSymbol(ctx, symbol, x, y) {
      const symbolFrameSize = this.symbolTotalHeight - 20; // e.g., 100 - 20 = 80px frame
      const borderRadius = 10; // Rounded corners for the frame

      // Draw symbol frame/bezel
      const frameGradient = ctx.createLinearGradient(x - symbolFrameSize / 2, y - symbolFrameSize / 2, x - symbolFrameSize / 2, y + symbolFrameSize / 2);
      frameGradient.addColorStop(0, '#4a5568'); // Darker gray
      frameGradient.addColorStop(0.5, '#2d3748'); // Medium gray
      frameGradient.addColorStop(1, '#1a202c'); // Lighter gray
      ctx.fillStyle = frameGradient;
      ctx.strokeStyle = '#6b7280'; // Lighter border for metallic look
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(x - symbolFrameSize / 2, y - symbolFrameSize / 2, symbolFrameSize, symbolFrameSize, borderRadius);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${this.symbolContentHeight}px "Poppins", Arial, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillText(symbol, x + 3, y + 3);

      // Color principal del símbolo
      if (symbol === '7️⃣') {
        const grad = ctx.createLinearGradient(x - 40, y - 40, x + 40, y + 40);
        grad.addColorStop(0, '#ff4d4d');
        grad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = grad;
      } else if (symbol === '🔔') {
        const grad = ctx.createLinearGradient(x - 40, y - 40, x + 40, y + 40);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(1, '#facc15');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#e0e0e0'; // Light gray for other symbols
      }
      ctx.fillText(symbol, x, y);
    },

    async animateReels() {
      if (!this.spinning) return;
      const elapsed = Date.now() - this.spinStartTime;
      const progress = Math.min(elapsed / this.spinDuration, 1);

      // Velocidades y tiempos de parada para cada carrete
      const speeds = [30, 35, 40]; // Ajustamos la velocidad para la nueva altura de símbolo
      const stopTimes = [0.6, 0.75, 0.9]; // Tiempos de parada escalonados

      for (let i = 0; i < 3; i++) {
        if (progress < stopTimes[i]) {
          // Fase de giro: el carrete se mueve a una velocidad constante.
          this.reelAnimations[i] -= speeds[i];
          // Cuando el offset supera la altura de un símbolo, lo reiniciamos para crear un bucle.
          if (this.reelAnimations[i] <= -this.symbolTotalHeight) {
            this.reelAnimations[i] += this.symbolTotalHeight;
            // Rotamos el array de símbolos para dar la ilusión de un carrete infinito.
            this.allReelSymbols[i].unshift(this.allReelSymbols[i].pop());
          }
        } else {
          // Fase de detención: el carrete decelera suavemente hasta la posición 0.
          const stopDuration = this.spinDuration * (1 - stopTimes[i]);
          const stopProgress = Math.min((elapsed - this.spinDuration * stopTimes[i]) / stopDuration, 1);
          const easing = 1 - Math.pow(1 - stopProgress, 4); // Usamos una curva cúbica para una parada más suave
          const targetOffset = 0;
          // El offset inicial para la animación de parada es -this.symbolTotalHeight.
          // La función de easing lo llevará suavemente de -this.symbolTotalHeight a 0.
          this.reelAnimations[i] = targetOffset + (-this.symbolTotalHeight * (1 - easing));

          // Clave: Aseguramos que el símbolo final esté en su sitio para ESTE carrete.
          this.allReelSymbols[i][10] = this.targetSymbols[i];
        }
      }

      this.drawSlotMachine();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(() => this.animateReels());
      } else if (this.spinning) { // Solo ejecutar una vez al final
        // La animación ha terminado por completo.
        this.spinning = false;
        this.reelAnimations = [0, 0, 0];
        this.reels = [...this.targetSymbols];
        this.drawSlotMachine();
        await this.checkWin();
      }
    },

    spin() {
      if (this.spinning || this.credits < this.currentBet) return;

      // Reproducir sonido de giro
      if (this.spinAudio) {
        this.spinAudio.currentTime = 0; // Reiniciar el sonido
        const playPromise = this.spinAudio.play();
        
      }
      // Nuevo: reproducir el sonido jackpot
      if (this.jackpotAudio) {
        this.jackpotAudio.currentTime = 0;
        this.jackpotAudio.play().catch(() => {});
      }

      this.spinning = true;
      this.lastWin = 0;
      this.winMessage = '';

      // Set target symbols (final result)
      this.targetSymbols = [
        this.symbols[Math.floor(Math.random() * this.symbols.length)],
        this.symbols[Math.floor(Math.random() * this.symbols.length)],
        this.symbols[Math.floor(Math.random() * this.symbols.length)]
      ];

      // Prepara los carretes para la animación.
      for (let i = 0; i < 3; i++) {
        this.allReelSymbols[i] = [];
        for (let j = 0; j < 20; j++) {
          this.allReelSymbols[i].push(
            this.symbols[Math.floor(Math.random() * this.symbols.length)]
          );
        }
        // IMPORTANTE: Asegurarnos de que el símbolo final NO esté pre-cargado aquí,
        // ya que la rotación durante el giro lo movería de su sitio.
        // Se inyectará en la fase de detención.
      }

      // Start animation
      this.spinStartTime = Date.now();
      this.reelAnimations = [0, 0, 0];
      this.animateReels();
    },

    async checkWin() {
      const combination = this.reels.join(' ');
      const payout = this.paytable[combination];
      let resultado = 'PERDIDO';
      let multiplicador = 0;

      if (payout) {
        resultado = 'GANADO';
        multiplicador = payout;
        this.lastWin = this.currentBet * multiplicador;
        this.winMessage = `¡${combination}!`;
      } else {
        // Check for any two matching symbols (smaller payout)
        const counts = {};
        this.reels.forEach(symbol => { counts[symbol] = (counts[symbol] || 0) + 1; });

        const pairs = Object.entries(counts).filter(([symbol, count]) => count >= 2);
        if (pairs.length > 0) {
          resultado = 'GANADO';
          multiplicador = 0.5;
          this.lastWin = Math.floor(this.currentBet * multiplicador);
          this.winMessage = '¡Par ganador!';
        }
      }

      // Llamada única a la API al final de la jugada
      try {
        await fetch('http://localhost:4000/api/bet/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: this.uid, id_juego: 2, monto: this.currentBet, resultado, multiplicador })
        });
        await syncBalance();
      } catch (error) {
        alert(`Error al registrar la apuesta: ${error.message}`);
      }
    },

    increaseBet() {
      if (this.currentBet + this.betStep <= this.maxBet && this.currentBet + this.betStep <= this.credits) {
        this.currentBet += this.betStep;
      }
    },

    decreaseBet() {
      if (this.currentBet - this.betStep >= this.minBet) {
        this.currentBet -= this.betStep;
      }
    },

    setMaxBet() {
      // Solo permite si hay créditos suficientes
      if (this.credits >= this.maxBet) {
        this.currentBet = this.maxBet;
      }
      this.currentBet = Math.min(this.credits, this.maxBet);
    },

    goBack() {
      this.$router.push('/menu');
    }
  }
}
</script>

<style scoped>
/* Tema principal usando CSS variables del globals.css */
.slot-machine-container {
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  color: var(--text);
  min-height: 100vh;
  overflow: hidden;
  position: relative;
}

/* Fondo de partículas animado */
.particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.particle {
  position: absolute;
  background: #4f46e5;
  border-radius: 50%;
  opacity: 0;
  animation: rise 10s infinite linear;
}
@keyframes rise {
  0% { transform: translateY(100vh) scale(0); opacity: 1; }
  100% { transform: translateY(-10vh) scale(1); opacity: 0; }
}

.slot-machine-container {
  position: relative;
  z-index: 1;
}
/* Header */
.game-header {
  background: linear-gradient(180deg, var(--primary), var(--primary-2));
  border-bottom: 1px solid var(--border);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.brand {
  display: flex;
  align-items: center;
}

.game-title {
  font-size: 2rem;
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

.danger-text {
  color: var(--danger);
}

/* Winner Banner */
.winner-banner {
  background: linear-gradient(45deg, var(--success), #16a34a);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  margin: 1rem;
  padding: 1rem;
  box-shadow: var(--shadow);
}

.winner-content {
  text-align: center;
}

.winner-label {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
}

.winner-display {
  color: var(--text);
}

.winner-prize {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.winner-combo {
  font-size: 1.2rem;
  color: var(--muted);
}

/* Game Layout */
.game-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  padding: 2rem 0;
}

@media (max-width: 1024px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}

/* Card styling using globals.css classes */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
}

/* Machine Section */
.machine-section {
  display: flex;
  justify-content: center;
}

.machine-card {
  background: linear-gradient(180deg, #2d3748, #1a202c);
  border: 3px solid #4a5568;
  border-radius: var(--radius);
  padding: 2rem;
  max-width: 900px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 15px rgba(255,255,255,0.1);
}

.machine-frame {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Screen */
.screen-container {
  background: linear-gradient(145deg, #4a5568, #2d3748); /* Degradado metálico */
  box-shadow: inset 0 0 20px rgba(0,0,0,0.6), 0 0 15px rgba(0, 212, 255, 0.3); /* Sombra interior y resplandor */

  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
}

.slot-screen {
  background: var(--card-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  max-width: 100%;
}

/* Payline */
.payline-indicator {
  display: flex;
  justify-content: center;
}

.payline-badge {
  background: var(--danger);
  color: var(--text);
  padding: 0.5rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Controls */
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.bet-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255,255,255,0.1);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.2);
}

.control-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn {
  border: none;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.decrease-btn {
  background: linear-gradient(180deg, #ef4444, #b91c1c);
}
.decrease-btn:hover:not(:disabled) { filter: brightness(1.2); }

.increase-btn {
  background: linear-gradient(180deg, #22c55e, #15803d);
}
.increase-btn:hover:not(:disabled) { filter: brightness(1.2); }


.bet-display {
  color: white;
  font-weight: bold;
  font-size: 1.25rem;
  padding: 0 1rem;
}

.action-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.spin-btn {
  font-size: 1.5rem;
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  padding: 1rem 3rem;
  border-radius: var(--radius);
  min-width: 200px;
  background: linear-gradient(180deg, #22c55e, #16a34a);
  color: white;
  border: 2px solid #86efac;
  box-shadow: 0 0 20px #22c55e, 0 5px 15px rgba(0,0,0,0.4);
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

.spin-btn.spinning {
  animation: pulse 1s infinite;
}

.spin-btn:hover:not(:disabled) {
  box-shadow: 0 0 30px #22c55e, 0 5px 20px rgba(0,0,0,0.5);
}

.max-bet-btn {
  background: linear-gradient(180deg, #a78bfa, #7c3aed);
  font-size: 1rem;
  padding: 1rem 1.5rem;
  border: 2px solid #c4b5fd;
  color: white;
  box-shadow: 0 0 20px #8b5cf6, 0 5px 15px rgba(0,0,0,0.4);
  text-shadow: 0 0 5px rgba(0,0,0,0.5);
}

/* Button disabled state */
.btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.disabled:hover {
  transform: none;
  filter: none;
}

/* Paytable Section */
.paytable-card {
  background: var(--card);
}

.paytable-title {
  color: var(--primary);
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
}

.paytable-grid {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.payout-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--card-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.payout-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14,165,233,0.15);
  border-color: var(--primary);
}

.combo-symbols {
  font-size: 1.2rem;
  font-family: "Poppins", sans-serif;
  font-weight: 500;
}

.payout-multiplier {
  color: var(--success);
  font-weight: bold;
  font-size: 1.1rem;
}

/* Game Info */
.game-info {
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
}

/* Back Section */
.back-section {
  text-align: center;
}

/* Animations using globals.css */
.animate-win-pulse {
  z-index: 10;
  animation: win-pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Responsive */
@media (max-width: 768px) {
  .machine-card {
    padding: 1rem;
  }
  
  .slot-screen {
    width: 100%;
    max-width: 600px;
  }
  
  .controls-section {
    gap: 0.75rem;
  }
  
  .bet-controls {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .action-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .spin-btn {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .game-title {
    font-size: 1.5rem;
  }
  
  .user-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .winner-prize {
    font-size: 1.5rem;
  }
  
  .container {
    padding: 0.5rem;
  }
}
</style>