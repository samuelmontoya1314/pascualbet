<template>
  <div class="blackjack">
    
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
          <span class="game-icon">♠️</span>
          <span class="game-subtitle">Blackjack</span>
        </div>
        <div class="stats">
          <div class="stat-item">
            <span>Balance</span>
            <strong>${{ credits.toFixed(2) }}</strong>
          </div>
          <div class="stat-item bet-stat">
            <span>Apuesta</span>
            <strong>${{ betAmount > 0 ? betAmount : '0' }}</strong>
          </div>
        </div>
      </div>
    </header>

    <div class="game-content">
      <!-- Botón Volver (debajo del encabezado) -->
      <button @click="goBack" class="btn-back-below-header" :disabled="gameStarted && !gameOver">⬅ Volver</button>
  
      <div class="bet-section" v-if="!gameStarted">
        <div class="bet-card">
          <h2>Ingresa tu Apuesta</h2>
          <div class="input-container">
            <span class="chip-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M8 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0 1a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
              </svg>
            </span>
            <input
              type="number"
              v-model="betAmount"
              class="bet-input"
              @input="validateBetAmount"
            />
          </div>
          <div class="quick-bet-buttons">
            <button class="quick-bet-button" :class="{selected: betAmount===10}" @click="betAmount=10">$10</button>
            <button class="quick-bet-button" :class="{selected: betAmount===20}" @click="betAmount=20">$20</button>
            <button class="quick-bet-button" :class="{selected: betAmount===50}" @click="betAmount=50">$50</button>
            <button class="quick-bet-button" :class="{selected: betAmount===100}" @click="betAmount=100">$100</button>
          </div>
          <button @click="startGame" :disabled="betAmount < 10 || betAmount > credits" class="deal-button">REPARTIR</button>
          <p class="bet-help-text">
            Selecciona una ficha o ingresa un monto. Mínimo: $10.
          </p>
          <button @click="openHelpModal" class="help-button">CÓMO JUGAR</button>
        </div>
      </div>
      <div v-else class="table">
        <div class="dealer">
          <h2 class="area-title">CRUPIER</h2>
          <div class="cards">
            <div v-for="(card, index) in dealerCards" :key="'dealer-' + index" class="card">
              <span v-if="index === 0 && playerTurn">🂠</span>
              <span v-else>
                <span>{{ card.rank }}</span>
                <span class="suit">{{ card.suit }}</span>
              </span>
            </div>
          </div>
          <p>Puntuación: {{ playerTurn ? '?' : dealerScore }}</p>
        </div>
        <div class="player">
          <h2 class="area-title">JUGADOR</h2>
          <div class="cards">
            <div v-for="(card, index) in playerCards" :key="'player-' + index" class="card">
              <span>{{ card.rank }}</span>
              <span class="suit">{{ card.suit }}</span>
            </div>
          </div>
          <p>Puntuación: {{ playerScore }}</p>
          <p>💵 Apuesta: {{ betAmount }}</p>
        </div>
      </div>
      <div class="actions" v-if="playerTurn && gameStarted && !gameOver">
        <button @click="hit">PEDIR CARTA</button>
        <button @click="stand">PLANTARSE</button>
      </div>
      <div v-if="gameOver" class="game-over">
        <h2>{{ resultMessage }}</h2>
        <div class="game-over-actions">
          <button @click="resetGame">JUGAR DE NUEVO</button>
          <button @click="openHelpModal" class="help-button">VER REGLAS</button>
        </div>
      </div>
    </div>
    
    <!-- Modal de Cómo Jugar -->
    <transition name="fade">
      <div v-if="showHelpModal" class="modal-overlay" @click.self="closeHelpModal">
        <div class="modal-content">
          <header class="modal-header">
            <h2 class="manual-title">Cómo Jugar al Blackjack</h2>
            <button @click="closeHelpModal" class="close-button">✕</button>
          </header>
          <div class="modal-body">
            <p><strong>Objetivo:</strong> Tu mano debe sumar un valor más cercano a 21 que la del crupier, sin pasarte de 21.</p>
            <h3 class="manual-subtitle">Valor de las Cartas</h3>
            <div class="card-examples-grid">
              <div class="card-example-item">
                <div class="card">
                  <span>7</span><span class="suit black">♠</span>
                </div>
                <p>Cartas 2-10 valen su número.</p>
              </div>
              <div class="card-example-item">
                <div class="card-group">
                  <div class="card small"><span class="red">K</span><span class="suit red">♦</span></div>
                  <div class="card small"><span class="black">Q</span><span class="suit black">♣</span></div>
                  <div class="card small"><span class="black">J</span><span class="suit black">♠</span></div>
                </div>
                <p>Figuras (J, Q, K) valen 10.</p>
              </div>
              <div class="card-example-item">
                <div class="card">
                  <span class="red">A</span><span class="suit red">♥</span>
                </div>
                <p>As (A) vale 1 u 11.</p>
              </div>
            </div>
            <h3 class="manual-subtitle">Reglas Principales</h3>
            <ul>
              <li>
                Elige tu apuesta y pulsa <span class="button-example">REPARTIR</span>.
              </li>
              <li>
                Recibes 2 cartas. El crupier también recibe 2, pero una de ellas permanece boca abajo.
              </li>
              <li>
                Pulsa <span class="button-example">PEDIR CARTA</span> para recibir otra carta.
              </li>
              <li>
                Pulsa <span class="button-example">PLANTARSE</span> para quedarte con tu mano actual y pasar el turno al crupier.
              </li>
              <li>
                Si tu puntuación supera 21, pierdes la apuesta automáticamente (Bust).
              </li>
              <li>
                El crupier debe pedir cartas hasta que su mano sume 17 o más.
              </li>
            </ul>
          </div>
          <footer class="modal-footer">
            <button @click="closeHelpModal" class="understood-button">ENTENDIDO</button>
          </footer>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { balance, syncBalance } from '../../store/balance.js';
import { registerBet, GAME_IDS } from '../../utils/betApi.js';

export default {
  setup() {
    return { ...balance };
  },
  data() {
    return {
      deck: [],
      playerCards: [],
      dealerCards: [],
      playerTurn: true,
      gameOver: false,
      gameStarted: false,
      betAmount: 0,
      predefinedAmounts: [10, 20, 50, 100],
      resultMessage: "",
      showHelpModal: false,
      currentBetId: null, // No se usa con el nuevo SP, pero lo dejamos por si acaso
    };
  },
  computed: {
    playerScore() {
      return this.calculateScore(this.playerCards);
    },
    dealerScore() {
      return this.calculateScore(this.dealerCards);
    },
  },
  mounted() {
    this.resetGame();
    // --- Sonidos suaves y acordes ---
    if (window.Tone === undefined) {
      import('tone').then(Tone => {
        window.Tone = Tone;
        // Sonido de carta (repartir y pedir)
        this.cardSynth = new Tone.NoiseSynth({
          volume: -10,
          envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.01 }
        }).toDestination();
        this.cardFilter = new Tone.Filter(1200, "highpass").toDestination();
        this.cardSynth.connect(this.cardFilter);
        // Sonido de ganar
        this.winSynth = new Tone.PolySynth().toDestination();
        this.winSynth.set({ volume: -14 });
        // Sonido de perder (acorde menor)
        this.loseSynth = new Tone.PolySynth().toDestination();
        this.loseSynth.set({ volume: -14 });
        // Sonido de empate
        this.tieSynth = new Tone.FMSynth({
          volume: -18
        }).toDestination();
      });
    } else {
      this.cardSynth = new window.Tone.NoiseSynth({
        volume: -10,
        envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.01 }
      }).toDestination();
      this.cardFilter = new window.Tone.Filter(1200, "highpass").toDestination();
      this.cardSynth.connect(this.cardFilter);
      this.winSynth = new window.Tone.PolySynth().toDestination();
      this.winSynth.set({ volume: -14 });
      this.loseSynth = new window.Tone.PolySynth().toDestination();
      this.loseSynth.set({ volume: -14 });
      this.tieSynth = new window.Tone.FMSynth({
        volume: -18
      }).toDestination();
    }
  },
  methods: {
    async startGame() {
      // Validar apuesta antes de iniciar
      if (this.betAmount < 10) {
        alert("La apuesta mínima es de $10.");
        return;
      }

      if (this.betAmount > this.credits) {
        alert("No tienes suficientes créditos para esta apuesta.");
        return;
      }

      // La llamada a la API se hará al final del juego, no al inicio.
      this.deck = this.createDeck();
      this.shuffleDeck(this.deck);
      this.playerCards = [this.drawCard(), this.drawCard()];
      this.dealerCards = [this.drawCard(), this.drawCard()];
      this.playerTurn = true;
      this.gameOver = false;
      this.gameStarted = true;
      this.resultMessage = "";

      if (window.Tone && this.cardSynth) {
        window.Tone.start && window.Tone.start();
        this.cardSynth.triggerAttackRelease('8n');
      }

      if (this.playerScore === 21) {
        this.playerTurn = false;
        if (this.dealerScore === 21) {
          await this.endGame("¡Empate! Ambos tienen Blackjack.", 'EMPATE', 1);
        } else {
          const winnings = this.betAmount * 1.5;
          await this.endGame(`¡Blackjack! Ganaste $${winnings.toFixed(2)}`, 'GANADO', 2.5);
        }
      }
    },
    resetGame() {
      this.gameStarted = false;
      this.betAmount = 0;
      this.playerCards = [];
      this.dealerCards = [];
      this.resultMessage = "";
      this.gameOver = false; // Oculta los botones de "Jugar de nuevo"
    },
    increaseBet() {
      this.betAmount = Math.max(10, (this.betAmount || 0) + 10);
    },
    decreaseBet() {
      this.betAmount = Math.max(10, (this.betAmount || 0) - 10);
    },
    setBetAmount(amount) {
      this.betAmount = amount;
    },
    createDeck() {
      const suits = ["♠", "♥", "♦", "♣"];
      const ranks = [
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "J",
        "Q",
        "K",
        "A",
      ];
      const deck = [];
      for (const suit of suits) {
        for (const rank of ranks) {
          deck.push({ suit, rank });
        }
      }
      return deck;
    },
    shuffleDeck(deck) {
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    },
    drawCard() {
      return this.deck.pop();
    },
    calculateScore(cards) {
      let score = 0;
      let aces = 0;
      for (const card of cards) {
        if (["J", "Q", "K"].includes(card.rank)) {
          score += 10;
        } else if (card.rank === "A") {
          aces += 1;
          score += 11;
        } else {
          score += parseInt(card.rank);
        }
      }
      while (score > 21 && aces > 0) {
        score -= 10;
        aces -= 1;
      }
      return score;
    },
    hit() {
      if (window.Tone && this.cardSynth) {
        window.Tone.start && window.Tone.start();
        this.cardSynth.triggerAttackRelease('16n');
      }
      if (this.gameOver) return;
      this.playerCards.push(this.drawCard());
      if (this.playerScore > 21) {
        this.endGame("¡Te pasaste! El crupier gana.", 'PERDIDO', 0);
      } else if (this.playerScore === 21) {
        // Si el jugador llega a 21, su turno termina y se pasa al crupier.
        this.stand();
      }
    },
    async stand() {
      if (this.gameOver) return;
      this.playerTurn = false;
      while (this.dealerScore < 17) {
        this.dealerCards.push(this.drawCard());
      }
      if (this.dealerScore > 21 || this.playerScore > this.dealerScore) {
        const winnings = this.betAmount;
        await this.endGame(`¡Ganaste! (+$${winnings.toFixed(2)})`, 'GANADO', 2);
      } else if (this.playerScore < this.dealerScore) {
        await this.endGame("El crupier gana.", 'PERDIDO', 0);
      } else {
        await this.endGame("Es un empate.", 'EMPATE', 1);
      }
    },
    async endGame(message, resultado, multiplicador) {
      this.gameOver = true;
      this.resultMessage = message;

      // Registrar apuesta usando la función helper
      await registerBet({
        uid: this.uid,
        gameId: GAME_IDS.BLACKJACK,
        amount: this.betAmount,
        result: resultado === 'EMPATE' ? 'GANADO' : resultado, // EMPATE se considera ganancia (devuelve apuesta)
        multiplier: multiplicador
      });
      await syncBalance();

      // Sonido según resultado
      if (window.Tone) {
        if (message.includes('Ganaste')) {
          this.winSynth && this.winSynth.triggerAttackRelease(['C6', 'E6', 'G6'], '8n');
        } else if (message.includes('empate') || message.includes('Empate')) {
          this.tieSynth && this.tieSynth.triggerAttackRelease('C5', '8n');
        } else if (message.includes('crupier gana') || message.includes('Crupier gana')) {
          // Sonido de acorde menor para perder
          this.loseSynth && this.loseSynth.triggerAttackRelease(['A3', 'C4', 'E4'], '8n');
        } else {
          this.loseSynth && this.loseSynth.triggerAttackRelease(['A3', 'C4', 'E4'], '8n');
        }
      }
    },
    openHelpModal() {
      this.showHelpModal = true;
    },
    closeHelpModal() {
      this.showHelpModal = false;
    },
    validateBetAmount() {
      // Asegurarse de que la apuesta sea un número y no esté vacía
      if (isNaN(this.betAmount) || this.betAmount === '') {
        this.betAmount = 0;
        return;
      }
      // Limitar la apuesta a un máximo de 500
      this.betAmount = Math.min(this.betAmount, 500);
    },
    goBack() {
      // Navega al menú principal
      if (this.$router) {
        this.$router.push('/menu');
      }
    }
  },
  mounted() {
    this.resetGame();
    // --- Sonidos suaves y acordes ---
    if (window.Tone === undefined) {
      import('tone').then(Tone => {
        window.Tone = Tone;
        // Sonido de carta (repartir y pedir)
        this.cardSynth = new Tone.NoiseSynth({
          volume: -10,
          envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.01 }
        }).toDestination();
        this.cardFilter = new Tone.Filter(1200, "highpass").toDestination();
        this.cardSynth.connect(this.cardFilter);
        // Sonido de ganar
        this.winSynth = new Tone.PolySynth().toDestination();
        this.winSynth.set({ volume: -14 });
        // Sonido de perder (acorde menor)
        this.loseSynth = new Tone.PolySynth().toDestination();
        this.loseSynth.set({ volume: -14 });
        // Sonido de empate
        this.tieSynth = new Tone.FMSynth({
          volume: -18
        }).toDestination();
      });
    } else {
      this.cardSynth = new window.Tone.NoiseSynth({
        volume: -10,
        envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.01 }
      }).toDestination();
      this.cardFilter = new window.Tone.Filter(1200, "highpass").toDestination();
      this.cardSynth.connect(this.cardFilter);
      this.winSynth = new window.Tone.PolySynth().toDestination();
      this.winSynth.set({ volume: -14 });
      this.loseSynth = new window.Tone.PolySynth().toDestination();
      this.loseSynth.set({ volume: -14 });
      this.tieSynth = new window.Tone.FMSynth({
        volume: -18
      }).toDestination();
    }
  },
};
</script>

<style scoped>
.blackjack {
  font-family: 'Montserrat', sans-serif;
  background: #121212; /* Negro mate */
  color: #f5f5f5; /* Blanco cálido */
  padding: 2rem;
  padding-top: 8rem; /* Espacio para el header fijo */
  min-height: 100vh;
}

/* Nuevo Encabezado */
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.game-content {
  padding: 0 2rem 2rem 2rem; /* Eliminamos el padding superior para acercar el botón */
}

.btn-back-below-header {
  /* position: absolute; ya no es necesario */
  margin-bottom: 1.5rem; /* Espacio entre el botón y la sección de apuestas */
  background: linear-gradient(45deg, #f0b90b, #d4af37, #b8860b); /* Degradado dorado */
  color: white;
  border: none; /* Sin borde para un look más limpio con el degradado */
  border-radius: 20px; /* Bordes más redondeados */
  padding: 0.6rem 1.2rem;
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3); /* Sombra sutil */
}

.btn-back-below-header:hover {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.7); /* Glow dorado suave */
  transform: translateY(-1px);
}

.btn-back-below-header:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.game-icon {
  font-size: 1.5rem;
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
  color: #f0b90b; /* Dorado para la apuesta */
}

.bet-section {
  margin-bottom: 2rem;
  background: #1a202c;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
}

.bet-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem; /* Espaciado uniforme entre todos los elementos */
}

.bet-section h2 {
  font-weight: 600;
  letter-spacing: 1px;
  margin: 0; /* Eliminamos el margen individual para usar gap */
}

.bet-input {
  padding: 0.8rem 1rem;
  font-size: 1rem;
  border: 2px solid #d4af37;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #f5f5f5;
  width: 300px;
  text-align: center;
  transition: all 0.2s ease;
}
.bet-input:focus {
  outline: none;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
}


.bet-button {
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  font-size: 1rem;
}

.deal-button {
  padding: 0.8rem 2.5rem; /* Relleno ajustado */
  font-size: 1.2rem; /* Fuente más pequeña */
  font-weight: 700;
  letter-spacing: 1px;
  background-color: #001f3f; /* Azul marino oscuro */
  color: #d4af37;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #f0b90b, #d4af37, #b8860b);
  background-size: 200% 200%;
  color: #121212;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
  animation: gradient-animation 3s ease infinite;
}

.bet-button:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
}

@keyframes gradient-animation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.deal-button:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(240, 185, 11, 0.7);
  transform: translateY(-2px);
}

.bet-button:disabled {
  background-color: #2a2a2a;
}

.deal-button:disabled {
  background: #333;
  color: #666;
  border: 1px solid #444;
  cursor: not-allowed;
  box-shadow: none;
  animation: none;
}

.help-button {
  margin-top: 0; /* Eliminamos el margen individual para usar gap */
  background: none;
  border: none;
  color: #aaa;
  font-weight: 600;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: color 0.2s;
}
.help-button:hover {
  color: #fff;
}

.table {
  display: flex;
  justify-content: space-around;
  margin: 2rem auto;
  background: radial-gradient(ellipse at center, #016A32, #014421); /* Verde terciopelo */
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  border: 3px solid #d4af37;
  max-width: 900px;
}
.area-title {
  font-family: 'Playfair Display', serif;
  color: #d4af37;
  margin-bottom: 1rem;
}

.cards {
  display: flex;
  justify-content: center;
  min-height: 100px;
  margin: 1rem 0;
}

.card {
  background: #fff;
  color: #121212;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 0.5rem;
  margin: 0.5rem;
  width: 70px;
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-family: 'Georgia', serif;
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.4);
}
.card span:first-child {
  font-weight: bold;
}

.card .suit {
  font-size: 1.8rem;
}
.card span.red { color: #8b0000; }
.card span.black { color: #121212; }

.actions {
  text-align: center;
  margin-top: 2rem;
}
.actions button {
  margin: 0.5rem;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  background-color: #1e1e1e;
  color: #d4af37;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}
.actions button:hover {
  background-color: #2a2a2a;
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
}

.game-over {
  margin-top: 2rem;
  text-align: center;
}
.game-over h2 {
  font-size: 2rem;
  color: #d4af37;
}
.game-over button {
  margin-top: 1rem;
  padding: 0.8rem 2rem;
  font-size: 1rem;
  background-color: #d4af37;
  color: #121212;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}
.game-over-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.manual {
  margin: 3rem auto 0;
  text-align: left;
  font-size: 0.9rem;
  background: rgba(1, 68, 33, 0.3); /* Verde oscuro translúcido */
  color: #f5f5f5;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #d4af37;
  max-width: 900px;
}
.manual-title {
  font-family: 'Playfair Display', serif;
  color: #d4af37;
  font-size: 1.8rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #d4af37;
  padding-bottom: 0.5rem;
}
.manual-subtitle {
  font-weight: 600;
  color: #fff;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.5);
  padding-bottom: 0.5rem;
}

.manual ul {
  list-style-position: inside; /* Mantiene las viñetas dentro del contenedor */
  padding-left: 0; /* Elimina el padding por defecto que empuja la lista */
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  align-items: start; /* Alinea los items al inicio */
}

.card-example-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.75rem;
}

.card-group {
  display: flex;
  justify-content: center;
  transform: scale(0.8); /* Hace el grupo de cartas un poco más pequeño */
}

.card-group .card {
  margin: -0.8rem; /* Superpone ligeramente las cartas */
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1a202c;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid #2a3a50;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  width: 90%;
  max-width: 800px;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a3a50;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.close-button {
  background: #2d3748;
  color: #a0aec0;
  border: 1px solid #4a5568;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #d4af37;
  color: #121212;
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

.modal-footer {
  text-align: center;
  margin-top: 2rem;
}

.example {
  margin-top: 1rem;
  background: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 6px;
  color: #f5f5f5;
}

.button-example {
  background: #1e1e1e;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  color: #d4af37;
  border: 1px solid #d4af37;
}

.understood-button {
  background: linear-gradient(45deg, #f0b90b, #d4af37, #b8860b);
  color: #121212;
  border: none;
  border-radius: 10px;
  padding: 0.8rem 2rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
  transition: all 0.2s ease;
}
.understood-button:hover {
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.7);
}
.quick-bet-buttons {
  display: flex;
  gap: 1rem;
  margin: 0; /* Eliminamos el margen individual para usar gap */
  justify-content: center;
}
.quick-bet-button {
  background: linear-gradient(90deg, #ffd700 0%, #ffb300 100%);
  color: #222;
  font-weight: bold;
  font-size: 1.1rem;
  border: none;
  border-radius: 10px;
  box-shadow: 0 2px 8px #0002;
  padding: 12px 28px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  outline: none;
  border: 2px solid #fff3;
}
.quick-bet-button:hover, .quick-bet-button:focus {
  background: linear-gradient(90deg, #ffe066 0%, #ffb300 100%);
  transform: translateY(-2px) scale(1.05);
  border-color: #ffd700;
}
.quick-bet-button.selected {
  background: linear-gradient(90deg, #fffbe6 0%, #ffd700 100%);
  color: #b8860b;
  border-color: #ffd700;
  box-shadow: 0 4px 16px #ffd70044;
}

.how-to-title-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(90deg, #ffd700 0%, #ffb300 100%);
  color: #222;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.3rem;
  font-weight: bold;
  letter-spacing: 0.18em;
  border: none;
  border-radius: 28px;
  padding: 16px 40px;
  margin: 24px auto 20px auto;
  text-align: center;
  box-shadow: 0 4px 24px #ffd70099, 0 2px 12px #0003;
  text-shadow: 0 2px 8px #fff8;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  animation: howto-glow 2.5s infinite alternate;
}
.how-to-title-btn::before {
  content: '';
  position: absolute;
  left: -75%;
  top: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 100%);
  transform: skewX(-25deg);
  filter: blur(2px);
  animation: howto-shine 2.5s infinite;
}
@keyframes howto-shine {
  0% { left: -75%; }
  100% { left: 130%; }
}
@keyframes howto-glow {
  0% { box-shadow: 0 4px 24px #ffd70099, 0 2px 12px #0003; }
  100% { box-shadow: 0 8px 40px #fffbe6cc, 0 2px 12px #ffd70099; }
}
.how-to-title-btn:hover, .how-to-title-btn:focus {
  background: linear-gradient(90deg, #fffbe6 0%, #ffd700 100%);
  color: #b8860b;
  transform: translateY(-3px) scale(1.07) rotate(-1deg);
  box-shadow: 0 8px 40px #ffd700cc, 0 2px 12px #fffbe6cc;
}
.how-to-title-btn .icon-help {
  font-size: 1.5em;
  color: #fffbe6;
  filter: drop-shadow(0 0 6px #ffd700cc);
}
</style>