# 5. Glosario

Términos usados en el código y la documentación de PascualBet, en orden alfabético.

[← Índice](README.md)

| Término | Definición | Dónde aparece |
|---------|------------|---------------|
| **`AdminGuard`** | Guard de NestJS que permite el acceso solo si `request.user.rol === 'Administrador'`; responde `403` en caso contrario. Se usa junto a `SessionGuard`. | `server/src/auth/admin.guard.ts` |
| **Administrador** | Valor del campo `rol` que da acceso a las rutas `/admin/*` del frontend y a los endpoints protegidos con `AdminGuard`. | `front/src/router/index.js`, `server/src/auth/admin.guard.ts` |
| **Apuesta** | Registro de una jugada en un juego: usuario, juego, monto, resultado y multiplicador. Se crea con `usp_apuesta_crear`. | `server/src/apuestas/` |
| **`ApuestasModule`** | Nombre funcional de la carpeta `server/src/apuestas/` (`ApuestasController` + `ApuestasService`). No es una clase `@Module()`; se registra en `AppModule`. | `server/src/apuestas/`, `server/src/app.module.ts` |
| **`authenticatedFetch`** | Envoltorio de `fetch` que añade los headers `x-user-id` y `x-session-token` y cierra la sesión ante un `401`. | `front/src/utils/api.js` |
| **Auto-bet** | Modo de Plinko que repite jugadas automáticamente cada segundo hasta alcanzar `numberOfBets` o detenerlo. | `front/src/components/games/plinko.vue` |
| **Auto-retiro (auto cashout)** | En Rocket, multiplicador objetivo con el que se retira automáticamente. | `front/src/components/games/rocket.vue` |
| **`balance`** | Referencias reactivas (`credits`, `uid`, `rol`) exportadas por el store. | `front/src/store/balance.js` |
| **Blackjack** | Juego de cartas contra el crupier; gana quien se acerque más a 21 sin pasarse. `GAME_IDS.BLACKJACK = 3`. | `front/src/components/games/Blackjack.vue` |
| **Blackjack natural** | As + carta de valor 10 en las dos primeras cartas. Paga 3:2 (multiplicador 2.5). | `Blackjack.vue` → `startGame()` |
| **Bucket / casilla** | Cada una de las 13 ranuras inferiores del tablero de Plinko, con su multiplicador. | `plinko.vue` → `buckets` |
| **Cashout / retirar** | Cobrar la ganancia acumulada antes de perder (Mines y Rocket). | `mines.vue` → `cashout()`, `rocket.vue` → `cashOut()` |
| **Crash / `crashPoint`** | Multiplicador en el que explota el cohete en Rocket; entre 1× y 21×. | `rocket.vue` → `startGame()` |
| **`crashSeed`** | Variable de desarrollo para forzar el `crashPoint` en pruebas. | `rocket.vue` |
| **`credits`** | Saldo del usuario en el estado reactivo del frontend. | `front/src/store/balance.js` |
| **Crupier / dealer** | La banca en Blackjack; pide cartas hasta sumar 17 o más. | `Blackjack.vue` → `stand()` |
| **Depósito** | Transacción de tipo `'DEPOSITO'` que aumenta el saldo (mínimo 10, máximo 10.000.000). | `front/src/components/index.vue` → `confirmDeposit()` |
| **DTO** | *Data Transfer Object*: clase que describe el cuerpo de una petición (`CreateUserDto`, `NewBetDto`, `NewTransferenceDto`). | `server/src/users/users.controller.ts`, `server/src/apuestas/apuestas.controller.ts` |
| **`expiresAt`** | Marca de tiempo (ms) en la que expira la sesión: 24 h después del login. | `server/src/users/users.service.ts`, `front/src/utils/api.js` |
| **`GAME_IDS`** | Constante con los identificadores de juego: `RULETA 1`, `SLOTS 2`, `BLACKJACK 3`, `PLINKO 4`, `MINES 5`, `ROCKET 6`. | `front/src/utils/betApi.js` |
| **`GANADA` / `PERDIDA`** | Valores de `p_resultado` para una apuesta ganada o perdida. Algunos juegos usan las variantes `GANADO` / `PERDIDO`. | Juegos en `front/src/components/games/` |
| **Ganancia neta (`netWin`, `p_ganancia_neta`)** | `premio − apuesta`; negativa si se pierde. El frontend la envía, pero el backend actualmente no la persiste. | `front/src/utils/betApi.js`, `server/src/apuestas/apuestas.controller.ts` |
| **Guard (frontend)** | Función `beforeEnter` del router que permite o redirige la navegación (`requireAuth`, `requireAdmin`). | `front/src/router/index.js` |
| **Guard (backend)** | Clase que implementa `CanActivate` en NestJS para autorizar peticiones (`SessionGuard`, `AdminGuard`). | `server/src/auth/` |
| **Helmet** | Middleware que añade headers HTTP de seguridad. | `server/src/main.ts` |
| **`LoggerMiddleware`** | Middleware que registra método, URL, estado y duración de cada petición. | `server/src/common/middleware/logger.middleware.ts` |
| **Mines** | Juego de cuadrícula en el que se revelan casillas evitando minas; el multiplicador crece con cada diamante. `GAME_IDS.MINES = 5`. | `front/src/components/games/mines.vue` |
| **`MULTIPLIER_TABLE`** | Tabla de multiplicadores de Mines indexada por número de minas y diamantes encontrados. | `mines.vue` |
| **Multiplicador (`p_multiplicador`)** | Factor por el que se multiplica la apuesta para obtener el premio (0 = pérdida total). | `registerBet()` |
| **`pb:session`** | Clave de `localStorage` donde el frontend guarda la sesión (`uid`, `nombre`, `rol`, `saldo`, `sessionToken`, `expiresAt`, …). | `front/src/store/balance.js`, `front/src/utils/api.js` |
| **Plinko** | Juego en el que una bola cae por un tablero de clavijas hasta una casilla con multiplicador. `GAME_IDS.PLINKO = 4`. | `front/src/components/games/plinko.vue` |
| **Pleno** | En la Ruleta, apuesta a un número concreto; paga ×36. | `rulet.vue` → `calculateWinnings()` |
| **Procedimiento almacenado (SP / RPC)** | Función de PostgreSQL en Supabase que el backend invoca con `supabase.rpc()`. Prefijos `usp_` y `sp_`. | `server/src/users/users.service.ts`, `server/src/apuestas/apuestas.service.ts` |
| **`registerBet`** | Función del frontend que registra el resultado de una jugada en `POST /api/apuestas/new/bet`. | `front/src/utils/betApi.js` |
| **`registerTransfer`** | Función del frontend que registra un depósito o retiro en `POST /api/apuestas/new`. | `front/src/utils/betApi.js` |
| **Retiro** | Transacción de tipo `'RETIRO'` que reduce el saldo (mínimo 20, máximo el saldo disponible). | `front/src/components/index.vue` → `confirmWithdraw()` |
| **Retorno esperado (ER)** | Valor medio que devuelve una apuesta; Plinko ajusta sus multiplicadores a un ER de 0,95. | `plinko.vue` → `adjustMultipliersForER()` |
| **Riesgo (`riskLevel`)** | Nivel `low` / `medium` / `high` de Plinko que cambia la probabilidad de desvío y los multiplicadores. | `plinko.vue` |
| **Rocket** | Juego tipo *crash*: el multiplicador crece hasta que el cohete explota. `GAME_IDS.ROCKET = 6`. | `front/src/components/games/rocket.vue` |
| **Rol** | Tipo de cuenta: `'Usuario'` (por defecto al registrarse) o `'Administrador'`. | `server/src/users/users.controller.ts`, `front/src/store/balance.js` |
| **Ruleta** | Ruleta europea de 37 casillas (0–36). `GAME_IDS.RULETA = 1`. | `front/src/components/games/rulet.vue` |
| **Saldo (`saldo`, `saldo_actual`)** | Créditos disponibles del usuario, almacenados en Supabase. | `front/src/store/balance.js`, `front/src/components/login.vue` |
| **`SessionGuard`** | Guard de NestJS que exige los headers de sesión y comprueba que el usuario exista; adjunta `request.user`. | `server/src/auth/session.guard.ts` |
| **`sessionToken`** | Token SHA-256 generado en el login y enviado en el header `x-session-token`. | `server/src/users/users.service.ts` |
| **Supabase** | Plataforma PostgreSQL gestionada que actúa como base de datos del proyecto. | `server/src/db/supa.client.ts` |
| **`syncBalance`** | Función que obtiene el saldo real desde `GET /api/users/find/:uid` y actualiza el store y `pb:session`. | `front/src/store/balance.js` |
| **Tabla de pagos (`paytable`)** | Multiplicadores de las combinaciones de tres símbolos en la Tragamonedas. | `slotM.vue` |
| **Throttler / rate limiting** | Limitación de peticiones por cliente. La dependencia `@nestjs/throttler` está instalada pero no configurada. | `server/package.json` |
| **Tragamonedas (Slots)** | Máquina de tres carretes con símbolos y tabla de pagos. `GAME_IDS.SLOTS = 2`. | `front/src/components/games/slotM.vue` |
| **Transacción** | Movimiento de dinero (depósito o retiro) registrado con `usp_transaccion_crear`. | `server/src/apuestas/apuestas.service.ts` |
| **`uid` / `id_usuario`** | Identificador del usuario, elegido por él al registrarse. | `front/src/components/login.vue`, `server/src/users/` |
| **`UsersModule`** | Nombre funcional de la carpeta `server/src/users/` (`UsersController` + `UsersService`). No es una clase `@Module()`; se registra en `AppModule`. | `server/src/users/`, `server/src/app.module.ts` |
| **`x-user-id` / `x-session-token`** | Headers HTTP con los que el frontend identifica la sesión en peticiones protegidas. | `front/src/utils/api.js`, `server/src/auth/session.guard.ts` |
