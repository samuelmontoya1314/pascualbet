# Guía: Integrar Registro de Apuestas en Todos los Juegos

## 📋 Resumen

Este documento explica cómo agregar el registro de apuestas en cada juego del proyecto PascualBet.

## 🎯 IDs de Juegos

```javascript
RULETA: 1
SLOTS: 2
BLACKJACK: 3
PLINKO: 4
MINES: 5
ROCKET: 6
```

## 📦 Función Helper

Ya creada en `/front/src/utils/betApi.js`:

```javascript
import { registerBet, GAME_IDS } from '../../utils/betApi.js';
```

## 🔧 Pasos de Integración

### 1. Importar la función en cada juego

Agregar al inicio del `<script>`:

```javascript
import { registerBet, GAME_IDS } from '../../utils/betApi.js';
import { balance, syncBalance } from '../../store/balance.js';
```

### 2. Obtener el UID del usuario

```javascript
const { uid } = balance;
```

### 3. Registrar apuesta cuando hay resultado

Llamar a `registerBet()` después de determinar el resultado:

```javascript
// Determinar resultado
const resultado = ganancia > apuesta ? 'GANADA' : 'PERDIDA';
const multiplicador = ganancia / apuesta;

// Registrar apuesta
await registerBet({
  uid: uid.value,
  gameId: GAME_IDS.NOMBRE_JUEGO,
  amount: apuesta,
  result: resultado,
  multiplier: multiplicador
});

// Sincronizar balance
await syncBalance();
```

---

## 🎮 Ejemplos por Juego

### ✅ PLINKO (Ya implementado)

**Archivo:** `front/src/components/games/plinko.vue`

**Ubicación:** Dentro del callback `onBallFinished`

```javascript
const winAmount = betAmount.value * winningBucket.multiplier;
const resultado = winAmount > betAmount.value ? 'GANADA' : 'PERDIDA';

await registerBet({
  uid: uid.value,
  gameId: GAME_IDS.PLINKO,
  amount: betAmount.value,
  result: resultado,
  multiplier: winningBucket.multiplier
});
await syncBalance();
```

---

### 🎰 SLOTS (Tragamonedas)

**Archivo:** `front/src/components/games/slotM.vue`

**Buscar:** La función `spin()` donde se calcula el premio

**Agregar después de calcular el premio:**

```javascript
// En la función spin(), después de determinar el premio
async spin() {
  // ... código existente ...
  
  // Después de calcular el premio
  const premio = // ... cálculo del premio
  const resultado = premio > currentBet ? 'GANADA' : 'PERDIDA';
  const multiplicador = premio / currentBet;
  
  // Registrar apuesta
  await registerBet({
    uid: uid.value,
    gameId: GAME_IDS.SLOTS,
    amount: currentBet,
    result: resultado,
    multiplier: multiplicador
  });
  
  await syncBalance();
}
```

---

### 🎲 RULETA

**Archivo:** `front/src/components/games/rulet.vue`

**Buscar:** Donde se determina si ganó o perdió

**Agregar:**

```javascript
// Después de determinar el resultado
const ganancia = // ... cálculo de ganancia
const resultado = ganancia > apuesta ? 'GANADA' : 'PERDIDA';
const multiplicador = ganancia / apuesta;

await registerBet({
  uid: uid.value,
  gameId: GAME_IDS.RULETA,
  amount: apuesta,
  result: resultado,
  multiplier: multiplicador
});

await syncBalance();
```

---

### 🃏 BLACKJACK

**Archivo:** `front/src/components/games/Blackjack.vue`

**Buscar:** Donde se resuelve la mano (win/lose/push)

**Agregar:**

```javascript
// Al finalizar la mano
const resultado = playerWon ? 'GANADA' : 'PERDIDA';
const multiplicador = playerWon ? (isBlackjack ? 2.5 : 2.0) : 0;

await registerBet({
  uid: uid.value,
  gameId: GAME_IDS.BLACKJACK,
  amount: betAmount,
  result: resultado,
  multiplier: multiplicador
});

await syncBalance();
```

---

### 💣 MINES

**Archivo:** `front/src/components/games/mines.vue`

**Buscar:** Funciones `cashOut()` y cuando pisa una mina

**Agregar:**

```javascript
// En cashOut (ganó)
async function cashOut() {
  const ganancia = betAmount.value * currentMultiplier.value;
  
  await registerBet({
    uid: uid.value,
    gameId: GAME_IDS.MINES,
    amount: betAmount.value,
    result: 'GANADA',
    multiplier: currentMultiplier.value
  });
  
  await syncBalance();
}

// Cuando pisa una mina (perdió)
async function hitMine() {
  await registerBet({
    uid: uid.value,
    gameId: GAME_IDS.MINES,
    amount: betAmount.value,
    result: 'PERDIDA',
    multiplier: 0
  });
  
  await syncBalance();
}
```

---

### 🚀 ROCKET

**Archivo:** `front/src/components/games/rocket.vue`

**Buscar:** Función `cashOut()` y cuando explota

**Agregar:**

```javascript
// En cashOut (ganó)
async function cashOut() {
  const multiplicador = currentMultiplier.value;
  
  await registerBet({
    uid: uid.value,
    gameId: GAME_IDS.ROCKET,
    amount: betAmount.value,
    result: 'GANADA',
    multiplier: multiplicador
  });
  
  await syncBalance();
}

// Cuando explota sin hacer cashout (perdió)
async function rocketExploded() {
  await registerBet({
    uid: uid.value,
    gameId: GAME_IDS.ROCKET,
    amount: betAmount.value,
    result: 'PERDIDA',
    multiplier: 0
  });
  
  await syncBalance();
}
```

---

## ⚠️ Consideraciones Importantes

### 1. **Resultado: 'GANADA' o 'PERDIDA'**
   - Usar exactamente estos valores (el backend los espera así)
   - 'GANADA' cuando el multiplicador > 1.0
   - 'PERDIDA' cuando pierde o multiplica por 0

### 2. **Multiplicador**
   - Siempre debe ser un número
   - Para pérdida total = 0
   - Para empate = 1.0
   - Para ganancia = ganancia / apuesta

### 3. **Sincronizar Balance**
   - Siempre llamar `await syncBalance()` después de registrar
   - Esto actualiza el saldo del usuario en la UI

### 4. **Manejo de Errores**
   - La función `registerBet()` no lanza errores
   - Registra en console.error si falla
   - El juego continúa normalmente

### 5. **UID del Usuario**
   - Obtener de `balance.uid` (importado del store)
   - Pasar como `.value` en Composition API: `uid.value`

---

## 🧪 Testing

Para verificar que funciona correctamente:

1. Jugar una partida en cada juego
2. Verificar en la consola del navegador que no hay errores
3. Verificar que el balance se actualiza correctamente
4. Revisar en la base de datos (Supabase) que se registren las apuestas

---

## 📝 Checklist de Implementación

- [x] Plinko ✅
- [x] Slots ✅
- [x] Ruleta ✅
- [x] Blackjack ✅
- [x] Mines ✅
- [x] Rocket ✅

**¡TODOS LOS JUEGOS IMPLEMENTADOS!** 🎉

---

## 🔍 Debugging

Si algo no funciona:

1. Abrir DevTools > Network
2. Buscar peticiones a `/api/apuestas/new/bet`
3. Verificar el payload enviado
4. Revisar la respuesta del servidor

---

## 📞 Soporte

Si necesitas ayuda con algún juego específico, pregunta y te ayudo a implementarlo.
