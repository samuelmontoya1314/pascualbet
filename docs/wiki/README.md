# Wiki de PascualBet

Documentación técnica de **PascualBet**, una plataforma de casino en línea full-stack con frontend en Vue 3 + Vite (`front/`) y backend en NestJS (`server/`) sobre una base de datos Supabase (PostgreSQL).

Todas las rutas citadas son relativas a la raíz del repositorio.

## Índice

| # | Página | Contenido |
|---|--------|-----------|
| 1 | [Visión general](01-overview.md) | Qué es PascualBet, stack, diagrama de arquitectura y layout del repositorio. |
| 1.1 | [Primeros pasos](01.1-getting-started.md) | Requisitos, instalación, variables de entorno y scripts de `package.json`. |
| 2 | [Frontend](02-frontend.md) | Router y guards, store de balance, utilidades de API, autenticación, menú principal, depósitos/retiros, panel de administración y assets. |
| 3 | [Juegos](03-juegos.md) | Flujo común de apuestas, `registerBet` y `GAME_IDS`. |
| 3.1 | [Blackjack](03.1-blackjack.md) | `front/src/components/games/Blackjack.vue` |
| 3.2 | [Ruleta](03.2-ruleta.md) | `front/src/components/games/rulet.vue` |
| 3.3 | [Tragamonedas](03.3-tragamonedas.md) | `front/src/components/games/slotM.vue` |
| 3.4 | [Plinko](03.4-plinko.md) | `front/src/components/games/plinko.vue` |
| 3.5 | [Mines](03.5-mines.md) | `front/src/components/games/mines.vue` |
| 3.6 | [Rocket](03.6-rocket.md) | `front/src/components/games/rocket.vue` |
| 4 | [Backend](04-backend.md) | Servidor NestJS: usuarios, apuestas y transacciones, guards, middleware de seguridad, capa de datos Supabase, procedimientos almacenados y pruebas. |
| 5 | [Glosario](05-glosario.md) | Términos del proyecto. |

## Fuentes

Esta wiki se construyó a partir del código fuente y de los documentos existentes en la raíz del repositorio:

- `README.md`
- `IMPLEMENTACION_COMPLETA.md`
- `RESUMEN_IMPLEMENTACION.md`
- `SEGURIDAD_IMPLEMENTADA.md`
- `PETICIONES_ORGANIZADAS.md`
- `GUIA_REGISTRO_APUESTAS.md`
- `EJEMPLO_ROCKET.md`

Cuando el código y esos documentos difieren, la wiki describe lo que hace el **código** y señala la diferencia en una nota.
