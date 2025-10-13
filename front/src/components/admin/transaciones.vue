<template>
    <!-- El header podría ser parte de un layout global, pero lo incluyo aquí para mantener la estructura original -->
    <header class="site-header">
        <div class="container">
            <a href="/" class="brand">
                <div class="logo">PascualBet</div>
            </a>
            <div class="user-actions">
                <div class="balance">Admin: <strong>S. Montoya</strong></div>
                <div class="avatar-menu">
                    <button class="avatar">
                        <span class="avatar-fallback">SM</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- ====== Main Content ====== -->
    <main>
        <!-- ====== Historial de Transacciones ====== -->
        <div class="container main-container">
            <div class="section-header">
                <h2 class="h2">Historial de Transacciones por Usuario</h2>
                <a href="/" class="btn btn-info">Volver al Inicio</a>
            </div>
            <p class="muted">Revisa las últimas transacciones realizadas en la plataforma.</p>

            <div class="transactions-table-wrapper">
                <table class="transactions-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Juego</th>
                            <th>Cantidad</th>
                            <th>Resultado</th>
                            <th>Fecha</th>
                        </tr>
                        <tr class="filter-row">
                            <td><input type="text" v-model="filters.user" placeholder="Filtrar..." class="input"></td>
                            <td>
                                <select v-model="filters.game" class="input">
                                    <option value="">Todos</option>
                                    <option v-for="game in availableGames" :key="game" :value="game">{{ game }}</option>
                                </select>
                            </td>
                            <td><input type="text" v-model="filters.amount" placeholder="Filtrar..." class="input"></td>
                            <td>
                                <select v-model="filters.result" class="input">
                                    <option value="">Todos</option>
                                    <option value="positive">Positivo</option>
                                    <option value="negative">Negativo</option>
                                </select>
                            </td>
                            <td><input type="date" v-model="filters.date" class="input"></td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredTransactions.length === 0">
                            <td colspan="5" style="text-align: center; color: var(--muted);">No se encontraron transacciones.</td>
                        </tr>
                        <tr v-for="tx in filteredTransactions" :key="tx.id">
                            <td>{{ tx.user }}</td>
                            <td>{{ tx.game }}</td>
                            <td>${{ tx.amount.toFixed(2) }}</td>
                            <td :class="{ 'win': tx.result > 0, 'loss': tx.result < 0 }">
                                {{ tx.result > 0 ? '+' : '' }}${{ tx.result.toFixed(2) }}
                            </td>
                            <td>{{ tx.date }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

// --- Filtros para el historial de transacciones ---
const filters = reactive({
  user: '',
  game: '',
  amount: '',
  result: '',
  date: '',
});

// --- State para el historial de transacciones ---
const transactions = ref([
  { id: 1, user: 'Player_01', game: 'Plinko', amount: 10, result: 50, date: '2023-10-27 10:30' },
  { id: 2, user: 'Player_02', game: 'Slots', amount: 5, result: -5, date: '2023-10-27 10:32' },
  { id: 3, user: 'Player_01', game: 'Blackjack', amount: 25, result: 25, date: '2023-10-27 10:35' },
  { id: 4, user: 'Player_03', game: 'Slots', amount: 2, result: -2, date: '2023-10-27 10:40' },
  { id: 5, user: 'Player_02', game: 'Plinko', amount: 20, result: -20, date: '2023-10-27 10:41' },
  { id: 6, user: 'Admin', game: 'Blackjack', amount: 100, result: 150, date: '2023-10-27 10:55' },
]);

// --- Propiedades computadas para los filtros ---
const availableGames = computed(() => {
  const games = transactions.value.map(tx => tx.game);
  return [...new Set(games)]; // Devuelve una lista de juegos únicos
});

// --- Propiedad computada para filtrar transacciones ---
const filteredTransactions = computed(() => {
  return transactions.value.filter(tx => {
    const userMatch = tx.user.toLowerCase().includes(filters.user.toLowerCase());
    const gameMatch = filters.game ? tx.game === filters.game : true;
    const amountMatch = tx.amount.toString().includes(filters.amount);
    const dateMatch = filters.date ? tx.date.startsWith(filters.date) : true;

    const resultMatch = (() => {
      if (filters.result === 'positive') return tx.result > 0;
      if (filters.result === 'negative') return tx.result <= 0;
      return true;
    })();

    return userMatch && gameMatch && amountMatch && resultMatch && dateMatch;
  });
});
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

/* Estilos para la fila de filtros en la tabla */
.filter-row td {
    padding-top: 8px;
    padding-bottom: 16px;
}

.filter-row .input {
    width: 100%;
    font-size: 0.9rem;
    padding: 6px 8px; /* Hacemos los inputs un poco más pequeños */
}

/* Estilos para la tabla de transacciones */
.transactions-table-wrapper {
    margin-top: 24px;
    background: linear-gradient(180deg, var(--card), var(--card-2));
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
    overflow-x: auto; /* Para responsividad en pantallas pequeñas */
}

.transactions-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.transactions-table th,
.transactions-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
}

.transactions-table th {
    color: var(--muted);
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
}

.transactions-table .win { color: var(--success); }
.transactions-table .loss { color: var(--danger); }

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
``` 
