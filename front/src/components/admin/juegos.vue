<template>
    <main>
        <div class="container main-container">
            <div class="section-header">
                <h2 class="h2">Panel de Administración de Probabilidades</h2>
                <a href="/" class="btn btn-info">Volver al Inicio</a>
            </div>
            <p class="muted">Ajusta los parámetros y probabilidades de los juegos en tiempo real.</p>

            <div class="game-settings-grid">

                <!-- Settings para Plinko -->
                <section class="tab-panel">
                    <h3>Plinko</h3>
                    <form class="game-settings-form" @submit.prevent="savePlinkoSettings">
                        <div class="field">
                            <label for="plinko-house-edge">Margen de la Casa (%)</label>
                            <input id="plinko-house-edge" type="number" v-model="plinkoSettings.houseEdge" step="0.1" class="input">
                        </div>
                        <div class="field">
                            <label for="plinko-max-multiplier">Multiplicador Máximo (x)</label>
                            <input id="plinko-max-multiplier" type="number" v-model="plinkoSettings.maxMultiplier" step="100" class="input">
                        </div>
                        <div class="field">
                            <label for="plinko-risk-factor">Factor de Riesgo (0.1 - 1.0)</label>
                            <input id="plinko-risk-factor" type="number" v-model="plinkoSettings.riskFactor" step="0.1" min="0.1" max="1.0" class="input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Guardar Cambios</button>
                        </div>
                    </form>
                </section>

                <!-- Settings para Slots -->
                <section class="tab-panel">
                    <h3>Slots</h3>
                    <form class="game-settings-form" @submit.prevent="saveSlotsSettings">
                        <div class="field">
                            <label for="slots-rtp">Retorno al Jugador (RTP %)</label>
                            <input id="slots-rtp" type="number" v-model="slotsSettings.rtp" step="0.1" class="input">
                        </div>
                        <div class="field">
                            <label for="slots-volatility">Volatilidad (Baja, Media, Alta)</label>
                            <input id="slots-volatility" type="text" v-model="slotsSettings.volatility" class="input">
                        </div>
                        <div class="field">
                            <label for="slots-feature-freq">Frecuencia de Bonus (1 en X giros)</label>
                            <input id="slots-feature-freq" type="number" v-model="slotsSettings.featureFreq" step="10" class="input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Guardar Cambios</button>
                        </div>
                    </form>
                </section>

                <!-- Settings para Blackjack -->
                <section class="tab-panel">
                    <h3>Blackjack</h3>
                    <form class="game-settings-form" @submit.prevent="saveBlackjackSettings">
                        <div class="field">
                            <label for="blackjack-decks">Número de Mazos</label>
                            <input id="blackjack-decks" type="number" v-model="blackjackSettings.decks" step="1" min="1" max="8" class="input">
                        </div>
                        <div class="field">
                            <label for="blackjack-payout">Pago por Blackjack (ej: 1.5 para 3:2)</label>
                            <input id="blackjack-payout" type="number" v-model="blackjackSettings.payout" step="0.1" class="input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Guardar Cambios</button>
                        </div>
                    </form>
                </section>

                <!-- Settings para Mines -->
                <section class="tab-panel">
                    <h3>Mines</h3>
                    <form class="game-settings-form" @submit.prevent="saveMinesSettings">
                        <div class="field">
                            <label for="mines-house-edge">Margen de la Casa (%)</label>
                            <input id="mines-house-edge" type="number" v-model="minesSettings.houseEdge" step="0.1" class="input">
                        </div>
                        <div class="field">
                            <label for="mines-count">Número de Minas</label>
                            <input id="mines-count" type="number" v-model="minesSettings.minesCount" step="1" min="1" max="24" class="input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Guardar Cambios</button>
                        </div>
                    </form>
                </section>

                <!-- Settings para Rocket -->
                <section class="tab-panel">
                    <h3>Rocket</h3>
                    <form class="game-settings-form" @submit.prevent="saveRocketSettings">
                        <div class="field">
                            <label for="rocket-house-edge">Margen de la Casa (%)</label>
                            <input id="rocket-house-edge" type="number" v-model="rocketSettings.houseEdge" step="0.1" class="input">
                        </div>
                        <div class="field">
                            <label for="rocket-max-multiplier">Multiplicador Máximo (x)</label>
                            <input id="rocket-max-multiplier" type="number" v-model="rocketSettings.maxMultiplier" step="100" class="input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Guardar Cambios</button>
                        </div>
                    </form>
                </section>

                <!-- Settings para Ruleta -->
                <section class="tab-panel">
                    <h3>Ruleta</h3>
                    <form class="game-settings-form" @submit.prevent="saveRouletteSettings">
                        <div class="field">
                            <label for="roulette-type">Tipo de Ruleta</label>
                            <input id="roulette-type" type="text" v-model="rouletteSettings.type" class="input" placeholder="Europea, Americana">
                        </div>
                        <div class="field">
                            <label for="roulette-bet-limit">Límite de Apuesta ($)</label>
                            <input id="roulette-bet-limit" type="number" v-model="rouletteSettings.betLimit" step="100" class="input">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn">Guardar Cambios</button>
                        </div>
                    </form>
                </section>

            </div>
        </div>
    </main>
</template>

<script setup>
import { reactive } from 'vue';

// --- State para los formularios de configuración ---
const plinkoSettings = reactive({
  houseEdge: 1.5,
  maxMultiplier: 1000,
  riskFactor: 0.5,
});

const slotsSettings = reactive({
  rtp: 96.2,
  volatility: 'Media',
  featureFreq: 150,
});

const blackjackSettings = reactive({
  decks: 6,
  payout: 1.5,
});

const minesSettings = reactive({
  houseEdge: 2.0,
  minesCount: 5,
});

const rocketSettings = reactive({
  houseEdge: 1.8,
  maxMultiplier: 500,
});

const rouletteSettings = reactive({
  type: 'Europea',
  betLimit: 1000,
});

// --- Lógica para guardar la configuración ---
const savePlinkoSettings = () => {
  console.log("Guardando configuración de Plinko:", plinkoSettings);
  // Aquí iría la llamada a la API para guardar plinkoSettings
};
const saveSlotsSettings = () => console.log("Guardando configuración de Slots:", slotsSettings);
const saveBlackjackSettings = () => console.log("Guardando configuración de Blackjack:", blackjackSettings);
const saveMinesSettings = () => console.log("Guardando configuración de Mines:", minesSettings);
const saveRocketSettings = () => console.log("Guardando configuración de Rocket:", rocketSettings);
const saveRouletteSettings = () => console.log("Guardando configuración de Ruleta:", rouletteSettings);
</script>

<style scoped>
/* Estilos específicos para esta página de admin */
.main-container {
    padding-top: 24px;
    padding-bottom: 24px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.game-settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    margin-top: 24px;
}

.game-settings-form {
    display: grid;
    gap: 16px;
}

.tab-panel {
    background: linear-gradient(180deg, var(--card), var(--card-2));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
}

.tab-panel h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 16px;
}

.form-actions {
    margin-top: 8px;
    justify-self: start;
}

.field label {
    font-size: 0.9rem;
    color: var(--muted);
    margin-bottom: 4px;
    display: block;
}

.field input {
    margin-bottom: 4px;
    display: block;
}

/* Estilos de botones genéricos */
.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
}

.btn-info { background-color: #3182ce; }
.btn-info:hover { background-color: #2b6cb0; }
</style>
