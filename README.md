# 🎮 PascualBet: Full-Stack Betting Platform

Una plataforma moderna de apuestas y juegos de azar desarrollada con una arquitectura robusta y escalable, diseñada para ofrecer una experiencia de usuario fluida y segura.

---

## 🚀 Vista General

**PascualBet** es un proyecto full-stack que combina un frontend dinámico con un backend de alto rendimiento. La plataforma integra múltiples juegos de casino populares, un sistema de gestión de balance en tiempo real y una arquitectura orientada a la seguridad.

### 🎰 Juegos Disponibles
El proyecto incluye 6 juegos completamente funcionales:
1.  **Ruleta**: Sistema de apuestas clásico con múltiples mercados.
2.  **Slots**: Máquina tragamonedas con lógica de premios y animaciones dinámicas.
3.  **Blackjack**: Implementación de las reglas estándar contra la casa.
4.  **Plinko**: Juego de caída física basado en probabilidades.
5.  **Mines**: Juego de estrategia y riesgo.
6.  **Rocket**: Crash game con multiplicadores en tiempo real.

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: [Vue 3](https://vuejs.org/) (Composition API).
- **Herramienta de Construcción**: [Vite](https://vitejs.dev/).
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/).
- **Gestión de Audio**: [Tone.js](https://tonejs.github.io/) para una experiencia sonora inmersiva.
- **Routing**: Vue Router.

### Backend
- **Framework**: [NestJS](https://nestjs.com/) (Node.js).
- **Base de Datos & Auth**: [Supabase](https://supabase.com/).
- **Seguridad**:
    - **Helmet**: Cabeceras de seguridad HTTP.
    - **Throttler**: Limitación de peticiones (Rate Limiting).
    - **Bcryptjs**: Encriptación de datos sensibles.
    - **CORS**: Configuración de orígenes permitidos.

---

## 🏗️ Arquitectura y Características Técnicas

### 1. Sistema Unificado de Apuestas (`betApi.js`)
Se implementó un helper centralizado en el frontend que estandariza el registro de todas las jugadas. Esto garantiza:
- Consistencia en los datos enviados al servidor.
- Manejo de errores resiliente (el juego no se detiene si la petición falla).
- Sincronización automática del balance del usuario tras cada resultado.

### 2. Gestión de Sesiones y Seguridad
El sistema utiliza un flujo de autenticación basado en `x-session-token` y `x-user-id` en las cabeceras de las peticiones, validando la expiración de la sesión en el cliente y el servidor.

### 3. Sincronización de Balance en Tiempo Real
El balance se gestiona mediante un store reactivo en el frontend, asegurando que las ganancias y pérdidas se reflejen instantáneamente sin necesidad de recargar la página.

---

## 🔧 Instalación y Configuración

### Requisitos Previos
- Node.js (v18+)
- Cuenta en Supabase

### Backend (Server)
1. Navega a la carpeta: `cd server`
2. Instala dependencias: `npm install`
3. Configura las variables de entorno en un archivo `.env`:
   ```env
   PORT=3000
   SUPABASE_URL=tu_url
   SUPABASE_KEY=tu_key
   ```
4. Inicia en modo desarrollo: `npm run start:dev`

### Frontend (Front)
1. Navega a la carpeta: `cd front`
2. Instala dependencias: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`
4. Accede a `http://localhost:5173`

---

## 📁 Estructura del Proyecto

```text
pascualbet/
├── front/              # Aplicación Vue 3 + Vite
│   ├── src/
│   │   ├── components/ # Componentes de juegos y UI
│   │   ├── store/      # Gestión de estado (Balance/Sesión)
│   │   └── utils/      # Helpers de API (betApi.js)
├── server/             # API NestJS
│   ├── src/
│   │   ├── apuestas/   # Módulo de registro de apuestas
│   │   ├── auth/       # Módulo de autenticación
│   │   └── db/         # Conexión con Supabase
└── README.md           # Documentación principal
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia UNLICENSED. Uso privado y educativo para portafolio personal.
