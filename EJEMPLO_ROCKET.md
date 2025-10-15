# 🎯 Ejemplo Completo: Implementación en Rocket

Este es un ejemplo paso a paso de cómo implementar el registro de apuestas en el juego Rocket.

## 📝 Código Actual (Antes)

```javascript
// rocket.vue - ANTES

async function cashOut() {
  if (!hasPlacedBet.value || hasCashedOut.value) return;
  
  hasCashedOut.value = true;
  const winnings = betAmount.value * currentMultiplier.value;
  
  // Solo actualiza el balance, NO registra la apuesta
  await syncBalance();
  
  console.log(`Ganaste: ${winnings}`);
}

function onRocketExplode() {
  if (hasPlacedBet.value && !hasCashedOut.value) {
    // Perdió todo, pero NO registra la apuesta
    console.log('¡Rocket explotó!');
  }
  gameState.value = 'ended';
}
```

---

## ✅ Código Actualizado (Después)

```javascript
// rocket.vue - DESPUÉS

// 1. Agregar imports al inicio
import { balance, syncBalance } from '../../store/balance.js';
import { registerBet, GAME_IDS } from '../../utils/betApi.js';

// 2. En setup(), obtener uid
const { uid } = balance;

// 3. Actualizar función cashOut
async function cashOut() {
  if (!hasPlacedBet.value || hasCashedOut.value) return;
  
  hasCashedOut.value = true;
  const winnings = betAmount.value * currentMultiplier.value;
  
  // ✅ NUEVO: Registrar apuesta GANADA
  await registerBet({
    uid: uid.value,
    gameId: GAME_IDS.ROCKET,
    amount: betAmount.value,
    result: 'GANADO',
    multiplier: currentMultiplier.value
  });
  
  await syncBalance();
  
  console.log(`Ganaste: ${winnings}`);
}

// 4. Actualizar función onRocketExplode
async function onRocketExplode() {
  if (hasPlacedBet.value && !hasCashedOut.value) {
    // ✅ NUEVO: Registrar apuesta PERDIDA
    await registerBet({
      uid: uid.value,
      gameId: GAME_IDS.ROCKET,
      amount: betAmount.value,
      result: 'PERDIDA',
      multiplier: 0
    });
    
    await syncBalance();
    
    console.log('¡Rocket explotó!');
  }
  gameState.value = 'ended';
}
```

---

## 🔄 Comparación Lado a Lado

| Aspecto | Antes ❌ | Después ✅ |
|---------|---------|-----------|
| **Imports** | Solo `balance, syncBalance` | `+ registerBet, GAME_IDS` |
| **Setup** | No obtiene `uid` | `const { uid } = balance` |
| **Cash Out** | Solo sincroniza balance | Registra + sincroniza |
| **Explosión** | No registra nada | Registra pérdida |
| **Historial** | No se guarda | Se guarda en DB |

---

## 📊 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuario Juega Rocket                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Coloca Apuesta      │
          │  betAmount = 100     │
          └──────────┬───────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌────────────────┐
│  Hace CashOut  │      │ Rocket Explota │
│  multiplier=2.5│      │  Sin CashOut   │
└────────┬───────┘      └────────┬───────┘
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌───────────────────┐
│  registerBet({   │   │   registerBet({   │
│   uid: "paku"    │   │    uid: "paku"    │
│   gameId: 6      │   │    gameId: 6      │
│   amount: 100    │   │    amount: 100    │
│   result:        │   │    result:        │
│   "GANADA"       │   │    "PERDIDA"      │
│   multiplier:2.5 │   │    multiplier: 0  │
│  })              │   │   })              │
└────────┬─────────┘   └────────┬──────────┘
         │                      │
         └───────────┬──────────┘
                     │
                     ▼
         ┌──────────────────────┐
         │  POST /api/apuestas/ │
         │      new/bet         │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   Supabase DB        │
         │   (Tabla apuestas)   │
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   syncBalance()      │
         │   Actualiza UI       │
         └──────────────────────┘
```

---

## 🧪 Testing

### 1. Prueba de Ganancia
```javascript
// Scenario: Usuario hace cashout en 2.5x
Input:
  betAmount = 100
  currentMultiplier = 2.5
  
Expected API Call:
  POST /api/apuestas/new/bet
  {
    "p_id_usuario": "paku",
    "p_id_juego": 6,
    "p_monto": 100,
    "p_resultado": "GANADO",
    "p_multiplicador": 2.5
  }
  
Expected Result:
  ✅ Balance incrementa en 250
  ✅ Registro guardado en DB
```

### 2. Prueba de Pérdida
```javascript
// Scenario: Rocket explota sin cashout
Input:
  betAmount = 100
  hasPlacedBet = true
  hasCashedOut = false
  
Expected API Call:
  POST /api/apuestas/new/bet
  {
    "p_id_usuario": "paku",
    "p_id_juego": 6,
    "p_monto": 100,
    "p_resultado": "PERDIDA",
    "p_multiplicador": 0
  }
  
Expected Result:
  ✅ Balance disminuye en 100
  ✅ Registro guardado en DB
```

---

## 🎨 DevTools: Cómo Verificar

1. **Abrir Consola del Navegador** (F12)

2. **Ir a Network Tab**

3. **Filtrar por**: `apuestas`

4. **Jugar una ronda**

5. **Verificar la petición**:
   ```
   POST https://pascualbet-cvr6.vercel.app/api/apuestas/new/bet
   Status: 200 OK
   ```

6. **Ver Request Payload**:
   ```json
   {
     "p_id_usuario": "paku",
     "p_id_juego": 6,
     "p_monto": 100,
     "p_resultado": "GANADO",
     "p_multiplicador": 2.5
   }
   ```

7. **Ver Response**:
   ```json
   {
     "data": "Apuesta registrada exitosamente"
   }
   ```

---

## ❌ Errores Comunes

### Error 1: `uid is undefined`
```javascript
// ❌ INCORRECTO
await registerBet({
  uid: uid,  // En Composition API falta .value
  ...
});

// ✅ CORRECTO
await registerBet({
  uid: uid.value,  // Con .value
  ...
});
```

### Error 2: Resultado mal escrito
```javascript
// ❌ INCORRECTO
result: 'Ganada'   // Mayúsculas incorrectas
result: 'ganada'   // Todo minúscula
result: 'WIN'      // En inglés

// ✅ CORRECTO
result: 'GANADA'   // TODO EN MAYÚSCULA
result: 'PERDIDA'  // TODO EN MAYÚSCULA
```

### Error 3: Multiplicador incorrecto en pérdida
```javascript
// ❌ INCORRECTO
multiplier: null          // No usar null
multiplier: undefined     // No usar undefined
multiplier: -1           // No usar negativos

// ✅ CORRECTO
multiplier: 0            // Usar 0 para pérdidas
```

---

## 🎁 Beneficios de Esta Implementación

1. **Historial Completo**: Todas las jugadas quedan registradas
2. **Estadísticas**: Puedes analizar patrones de juego
3. **Auditoría**: Trazabilidad de todas las transacciones
4. **Admin Panel**: Podrás mostrar stats en el panel de admin
5. **RTP Tracking**: Calcular Return to Player real

---

## 📚 Referencias

- [Guía Completa](./GUIA_REGISTRO_APUESTAS.md)
- [Resumen](./RESUMEN_IMPLEMENTACION.md)
- [API Helper](./front/src/utils/betApi.js)

---

¿Listo para implementar en los otros juegos? 🚀
