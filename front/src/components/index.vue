<script>
import { balance, updateBalance, syncBalance } from '../store/balance.js';
import Usuarios from './admin/usuarios.vue';
import Blackjack from './games/Blackjack.vue';
import Plinko from './games/plinko.vue';
import Rocket from './games/rocket.vue';

export default {
  setup() { return { ...balance }; },
  
  mounted() {
    syncBalance();
  },

  data() {
    return {
      showLogoutModal: false,
      showDepositModal: false,
      showWithdrawModal: false,
      depositAmount: '',
      withdrawAmount: '',
      depositBank: '',
      depositAccountType: '',
      depositAccountNumber: '',
      withdrawBank: '',
      withdrawAccountType: '',
      withdrawAccountNumber: '',
      depositError: '',
      withdrawError: '',
      isBackgroundActive: true, // Controla si el fondo está activo
    };
  },
  computed: {
    isDepositAccountTypeVisible() {
      return this.depositBank === 'Bancolombia' || this.depositBank === 'Davivienda';
    },
    isWithdrawAccountTypeVisible() {
      return this.withdrawBank === 'Bancolombia' || this.withdrawBank === 'Davivienda';
    }
  },
  methods: {
    openLogoutModal() {
      this.showLogoutModal = true;
    },
    closeLogoutModal() {
      this.showLogoutModal = false;
    },
    toggleBackground() {
      this.isBackgroundActive = !this.isBackgroundActive;
    },
    logout() {
      localStorage.removeItem('pb:session');
      this.$router.replace('/');
    },
    openDepositModal() {
      this.depositAmount = '';
      this.depositBank = '';
      this.depositAccountType = '';
      this.depositAccountNumber = '';
      this.depositError = '';
      this.showDepositModal = true;
    },
    closeDepositModal() {
      this.showDepositModal = false;
    },
    handleDepositInput(e) {
      this.depositAmount = e.target.value.replace(/\D/g, '');
    },
    handleDepositAccountNumberInput(e) {
      this.depositAccountNumber = e.target.value.replace(/\D/g, '').slice(0, 16);
    },
    async confirmDeposit() {
      // Helper para manejar respuestas de fetch de forma segura
      const safeFetchJSON = async (url, options) => {
        const response = await fetch(url, options);
        if (!response.ok) {
          // Si el servidor devuelve un error (4xx, 5xx), intenta leer el texto del error.
          const errorText = await response.text();
          try {
            // Intenta parsear como JSON si el servidor envía un error JSON
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Error del servidor: ${response.status}`);
          } catch (e) {
            // Si no es JSON, es probablemente una página de error HTML.
            throw new Error(`Error del servidor: ${response.status}. La URL puede ser incorrecta.`);
          }
        }
        return response.json();
      };

      const amount = Number(this.depositAmount);
      if (amount > 10000000) {
        this.depositError = "El monto máximo por depósito es $10,000,000.";
        return;
      }
      if (!this.depositBank) {
        this.depositError = "Selecciona un banco.";
        return;
      }
      if (this.isDepositAccountTypeVisible && !this.depositAccountType) {
        this.depositError = "Selecciona el tipo de cuenta.";
        return;
      }
      if (!this.depositAccountNumber || this.depositAccountNumber.length !== 16) {
        this.depositError = "El número de cuenta debe tener exactamente 16 dígitos.";
        return;
      }
      if (amount < 10) {
        this.depositError = "El monto mínimo es $10";
        return;
      }
      this.depositError = "";

      try {
        // 1. Crear la transacción
        const createData = await safeFetchJSON('http://localhost:4000/api/transaction/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: this.uid,
            tipo: 'DEPOSITO',
            monto: amount,
            banco: this.depositBank,
            cuenta_cliente: this.depositAccountNumber
          })
        });
        // 4. Sincronizar el saldo y notificar al usuario
        // 3. Sincronizar el saldo y notificar al usuario
        await syncBalance();
        alert(`¡Has depositado $${amount.toLocaleString()} con éxito!`);
        this.closeDepositModal();
      } catch (error) {
        this.depositError = error.message;
      }
    },
    openWithdrawModal() {
      this.withdrawAmount = '';
      this.withdrawBank = '';
      this.withdrawAccountType = '';
      this.withdrawAccountNumber = '';
      this.withdrawError = '';
      this.showWithdrawModal = true;
    },
    closeWithdrawModal() {
      this.showWithdrawModal = false;
    },
    handleWithdrawInput(e) {
      this.withdrawAmount = e.target.value.replace(/\D/g, '');
    },
    handleWithdrawAccountNumberInput(e) {
      this.withdrawAccountNumber = e.target.value.replace(/\D/g, '').slice(0, 16);
    },
    async confirmWithdraw() {
      // Helper para manejar respuestas de fetch de forma segura
      const safeFetchJSON = async (url, options) => {
        const response = await fetch(url, options);
        if (!response.ok) {
          // Si el servidor devuelve un error (4xx, 5xx), intenta leer el texto del error.
          const errorText = await response.text();
          try {
            // Intenta parsear como JSON si el servidor envía un error JSON
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Error del servidor: ${response.status}`);
          } catch (e) {
            // Si no es JSON, es probablemente una página de error HTML.
            throw new Error(`Error del servidor: ${response.status}. La URL puede ser incorrecta.`);
          }
        }
        return response.json();
      };

      const amount = Number(this.withdrawAmount);
      if (!this.withdrawBank) {
        this.withdrawError = "Selecciona un banco.";
        return;
      }
      if (this.isWithdrawAccountTypeVisible && !this.withdrawAccountType) {
        this.withdrawError = "Selecciona el tipo de cuenta.";
        return;
      }
      if (!this.withdrawAccountNumber || this.withdrawAccountNumber.length !== 16) {
        this.withdrawError = "El número de cuenta debe tener exactamente 16 dígitos.";
        return;
      }
      if (amount < 20) {
        this.withdrawError = "El mínimo de retiro es $20.";
        return;
      }
      if (amount > this.credits) {
        this.withdrawError = "No tienes saldo suficiente para realizar este retiro.";
        return;
      }
      this.withdrawError = "";

      try {
        // 1. Crear la transacción de retiro
        const createData = await safeFetchJSON('http://localhost:4000/api/transaction/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: this.uid,
            tipo: 'RETIRO',
            monto: amount,
            banco: this.withdrawBank,
            cuenta_cliente: this.withdrawAccountNumber
          })
        });
        // 3. Sincronizar el saldo y notificar
        await syncBalance();
        alert(`¡Has retirado $${amount.toLocaleString()} con éxito!`);
        this.closeWithdrawModal();
      } catch (error) {
        this.withdrawError = error.message;
      }
    },
    tragaperras() {
      this.$router.push('/slot');
    },
    ruleta() {
      this.$router.push('/rulete');
    },
    Blackjack() {
      this.$router.push('/BJ');
    },
    Usuarios() {
      this.$router.push('/admin/usuarios');
    },
    Plinko() {
      this.$router.push('/plinko');
    },
    mines() {
      this.$router.push('/mines');
    },
    rocket() {
      this.$router.push('/rocket');
    }
  }
};
</script>

<template>
  <div class="main-container" :class="{ 'no-background': !isBackgroundActive }">
    <header class="site-header">
      <div class="container">
        <div class="brand" @click="toggleBackground" style="cursor: pointer;" title="Activar/Desactivar fondo">
          <span class=""><img src="/img/Logo_PascualBet.jpg" alt="Logo" class="avatar"/></span>
        </div>

        <nav class="user-actions">
          <div class="balance">
            Saldo: <strong id="balance">${{ credits.toFixed(2) }}</strong>
          </div>
          <button class="btn btn-primary" id="btn-deposit" data-action="open-deposit" aria-haspopup="menu"
              aria-expanded="false"
              @click="openDepositModal">
            Depositar
          </button>
          <button class="btn btn-primary" @click="openWithdrawModal">
            Retirar
          </button>
          <p><strong id="id">{{ uid }}</strong></p>
          <div class="avatar-menu">
            <button
              class="avatar"
              id="avatar-button"
              aria-haspopup="menu"
              aria-expanded="false"
              @click="openLogoutModal"
            >
              <span class="avatar-fallback" id="avatar-initials">
                <img src="https://cdn2.iconfinder.com/data/icons/pixel-characters-v2/100/avatar-09-512.png" alt="">
              </span>

              
            </button>
          </div>
        </nav>
      </div>
    </header>

    <main class="container">
      <!-- Tabs -->
      <div v-if="rol === 'ADMIN'" class="tab-panel" id="panel-admin" role="tabpanel">
          <h2 class="h2">Panel de Administración</h2>
          <div class="cards-grid">
            <article class="card">
              <h3 class="card-title">Usuarios</h3>
              <p class="card-text">Gestión básica de usuarios y saldos.</p>
              <button class="btn" data-action="open-admin-users" @click="Usuarios">Abrir</button>
            </article>
            <article class="card">
              <h3 class="card-title">Transacciones</h3>
              <p class="card-text">Revisión de depósitos y retiros.</p>
              <button class="btn" data-action="open-admin-tx">Abrir</button>
            </article>
            <article class="card">
              <h3 class="card-title">juegos</h3>
              <p class="card-text">Revisión de depósitos y retiros.</p>
              <button class="btn" data-action="open-admin-tx">Abrir</button>
            </article>
          </div>
        </div>

      <!-- Paneles -->
      <section class="tab-panels">
        <!-- Casino -->
        <div class="tab-panel is-active" id="panel-casino" role="tabpanel"> 
          <h2 class="h2">Casino</h2>
          <div class="cards-grid">
            <article class="card game" data-game="ruleta">
              <h3 class="card-title">Ruleta</h3>
              <img src="/img/ruleta.png" alt="" >
              <p class="card-text">
                Gira y gana. Configura tu apuesta y cruza los dedos.
              </p>
              <button class="btn play" @click="ruleta">
                Jugar
              </button>
            </article>

            <article class="card game" data-game="tragamonedas">
              <h3 class="card-title">tragamonedas</h3>
              <img src="/img/tragamonedas.png" alt="" srcset="">
              <p class="card-text">
               junta 3 simbolos y veras como la mama de tus hijos de vuelvea a querrer
              </p>
              <button class="btn play" @click="tragaperras">
                Jugar
              </button>
            </article>

            <article class="card game" data-game="Blacjack">
              <h3 class="card-title">Blacjack</h3>
              <img src="/img/poker.png" alt="" srcset="">
              <p class="card-text">Arma la mejor mano y vence a la mesa.</p>
              <button class="btn play" @click="Blackjack">
                Jugar
              </button>
            </article>

            <article class="card game" data-game="plinko">
              <h3 class="card-title">plinko</h3>
              <img src="/img/plinko.jpg" alt="" >
              <p class="card-text">
                Tocalo y se baja solo 
              </p>
              <button class="btn play" @click="Plinko">
                Jugar
              </button>
            </article>

            <article class="card game" data-game="mines">
              <h3 class="card-title">mines</h3>
              <img src="/img/mines.jpg" alt="" srcset="">
              <p class="card-text">
                quiero ser minero romper el pico en el hierro
              </p>
              <button class="btn play" @click="mines">
                Jugar
              </button>
            </article>

            <article class="card game" data-game="rocket">
              <h3 class="card-title">rocket space</h3>
              <img src="/img/rocket.jpg" alt="" srcset="">
              <p class="card-text">Tocalo y se sube solo</p>
              <button class="btn play" @click="rocket">
                Jugar
              </button>
            </article>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal Depósito -->
    <div v-if="showDepositModal">
      <div class="modal-overlay" @click="closeDepositModal"></div>
      <div class="modal modal-content" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>Depositar</h3>
          <button class="icon-btn" @click="closeDepositModal" aria-label="Cerrar">✕</button>
        </header>
        <div class="modal-body">
          <label class="field">
            <span>Monto</span>
            <span>Mín. $10 - Máx. $10,000,000</span>
            <input
              type="number"
              v-model="depositAmount"
              @input="handleDepositInput"
              min="10"
              step="1000"
            />
          </label>
          <label class="field">
            <span>Banco</span>
            <select v-model="depositBank">
              <option value="" disabled>Selecciona un banco</option>
              <option value="Bancolombia">Bancolombia</option>
              <option value="Nequi">Nequi</option>
              <option value="Davivienda">Davivienda</option>
            </select>
          </label>
          <label class="field" v-if="isDepositAccountTypeVisible">
            <span>Tipo de cuenta</span>
            <select v-model="depositAccountType">
              <option value="" disabled>Selecciona el tipo</option>
              <option value="Ahorros">Ahorros</option>
              <option value="Corriente">Corriente</option>
            </select>
          </label>
          <label class="field">
            <span>Número de cuenta</span>
            <input
              type="text"
              v-model="depositAccountNumber"
              @input="handleDepositAccountNumberInput"
              maxlength="16"
              placeholder="Exactamente 16 dígitos"
            />
          </label>
          <small v-if="depositError" class="error">{{ depositError }}</small>
          <button class="btn" id="confirm-deposit" @click="confirmDeposit">
            Confirmar Depósito
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Retiro -->
    <div v-if="showWithdrawModal">
      <div class="modal-overlay" @click="closeWithdrawModal"></div>
      <div class="modal modal-content" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3>Retirar</h3>
          <button class="icon-btn" @click="closeWithdrawModal" aria-label="Cerrar">✕</button>
        </header>
        <div class="modal-body">
          <label class="field">
            <span>Monto</span>
            <input
              type="number"
              v-model="withdrawAmount"
              @input="handleWithdrawInput"
              min="20000"
              step="1000"
              placeholder="Monto mínimo $20,000"
            />
          </label>
          <label class="field">
            <span>Banco</span>
            <select v-model="withdrawBank">
              <option value="" disabled>Selecciona un banco</option>
              <option value="Bancolombia">Bancolombia</option>
              <option value="Nequi">Nequi</option>
              <option value="Davivienda">Davivienda</option>
            </select>
          </label>
          <label class="field" v-if="isWithdrawAccountTypeVisible">
            <span>Tipo de cuenta</span>
            <select v-model="withdrawAccountType">
              <option value="" disabled>Selecciona el tipo</option>
              <option value="Ahorros">Ahorros</option>
              <option value="Corriente">Corriente</option>
            </select>
          </label>
          <label class="field">
            <span>Número de cuenta</span>
            <input
              type="text"
              v-model="withdrawAccountNumber"
              @input="handleWithdrawAccountNumberInput"
              maxlength="16"
              placeholder="Exactamente 16 dígitos"
            />
          </label>
          <small v-if="withdrawError" class="error">{{ withdrawError }}</small>
          <button class="btn" id="confirm-withdraw" @click="confirmWithdraw">
            Confirmar Retiro
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para cerrar sesión -->
    <div class="modal" id="logout-modal" v-if="showLogoutModal" role="dialog" aria-modal="true">
      <div class="modal-content">
        <header class="modal-header">
          <h3>¿Deseas cerrar sesión?</h3>
          <button class="icon-btn" @click="closeLogoutModal" aria-label="Cerrar">✕</button>
        </header>
        <div class="modal-body">
          <p>Al cerrar sesión, todavia no alcanzaras el objetivo de ser millonario</p>
          <img src="https://i.redd.it/iu0ms6q9sit71.jpg" alt="">
          <button class="btn destructive" @click="logout">Cerrar sesión</button>
        </div>
      </div>
    </div>

    <footer class="site-footer">
      <div class="container">
        <small
          >© <span id="year"></span> Pascualbet. Todos los derechos
          reservados.</small>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.main-container {
  background-image: url('/img/fondo.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  min-height: 100vh;
}

.main-container.no-background {
  background-image: none;
  background-color: #0e1217; /* Color de fondo alternativo */
}

.site-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 20px;
  background-color: #1a1a2e;
  color: #fff;
  margin-bottom: 30px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo img {
  width: 120px;
  height: 100%;
  object-fit: contain;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.balance {
  font-size: 14px;
}

.avatar-menu {
  position: relative;
}

.avatar {
  width: 100%;
  height: 90px;
  border-radius: 50%;
  background-color: #223042;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}

.avatar-menu .menu {
  position: absolute;
  top: 100px;
  right: 0;
  background-color: #1a1a2e;
  border: 1px solid #223042;
  border-radius: 5px;
  padding: 10px;
  display: none;
}

.avatar-menu .menu-item {
  color: #fff;
  padding: 0px 10px;
  cursor: pointer;
}

.avatar-menu .menu-item.destructive {
  color: #ff4d4d;
}

.avatar-menu:hover .menu {
  display: block;
}

.avatar-fallback {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #223042;
}

.avatar-fallback img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback img {
  width: 80%; 
  height: 80%;
  object-fit: cover; 
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #1a1a2e;
  color: #fff;
  border: 1px solid #223042;
  border-radius: 10px;
  padding: 20px;
  z-index: 1000;
  height: max-content;
  width: 600px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  margin-top: 10px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 30, 46, 0.6);
  z-index: 999;
}
.btn.destructive {
  background-color: #ff4d4d;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn.destructive:hover {
  background-color: #e63939;
}

.error {
  color: #ff4d4d;
  font-size: 13px;
  margin-top: 8px;
  display: block;
}

/* Estilos para los campos de los modales */
.modal-body .field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1rem;
}

.modal-body .field input,
.modal-body .field select {
  width: 100%;
  padding: 12px 14px;
  background-color: #0f1620;
  border: 1px solid #223042;
  border-radius: 6px;
  color: #e6ecf3;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.modal-body .field input:focus,
.modal-body .field select:focus {
  outline: none;
  border-color: #3ba0ff;
  box-shadow: 0 0 0 3px rgba(59, 160, 255, 0.2);
}
</style>
