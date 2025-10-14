import { reactive, toRefs } from 'vue';

/**
 * Obtiene el saldo inicial desde la sesión guardada en localStorage.
 */
const getInitialBalance = () => {
  const session = localStorage.getItem('pb:session');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      // Nos aseguramos de que el saldo sea un número. Si no, devolvemos 0.
      return Number(parsedSession.saldo) || 0;
    } catch (e) {
      console.error("Error al parsear la sesión de localStorage:", e);
      return 0;
    }
  }
  return 0;
};

// Función para obtener la sesión parseada de forma segura
const getSession = () => {
  const session = localStorage.getItem('pb:session');
  try {
    return session ? JSON.parse(session) : {};
  } catch (e) {
    return {};
  }
};

// Creamos un estado reactivo para los datos de la sesión del usuario.
const state = reactive({
  credits: getInitialBalance(),
  uid: getSession().uid || '',
  rol: getSession().rol || 'Usuario' // Añadimos el rol al estado
});

// Nueva función para sincronizar saldo desde la base de datos 
export const syncBalance = async () => {
  const session = localStorage.getItem('pb:session');
  if (!session) return;
  const { uid } = JSON.parse(session);
  try {
    const r = await fetch(`https://pascualbet-cvr6.vercel.app/api/users/find/${uid}`);
    const userInfo = await r.json();
    if (r.ok && userInfo) {
      // Función auxiliar para extraer "saldo" desde distintas formas de respuesta
      const extractSaldo = (data) => {
        if (data == null) return null;
        // Si es número o string (respuesta directa)
        if (typeof data === 'number' || typeof data === 'string') {
          const n = Number(data);
          return Number.isFinite(n) ? n : null;
        }

        // Si viene { data: ... }
        if (typeof data === 'object' && 'data' in data) {
          return extractSaldo(data.data);
        }

        // Si es un array, tomar el primer elemento
        if (Array.isArray(data)) {
          return data.length > 0 ? extractSaldo(data[0]) : null;
        }

        // Si es un objeto, buscar propiedad 'saldo' (case-insensitive)
        if (typeof data === 'object') {
          // búsqueda directa
          if ('saldo' in data) return Number(data.saldo) || 0;
          // intentar propiedades en distinto case
          for (const k of Object.keys(data)) {
            if (k.toLowerCase() === 'saldo') return Number(data[k]) || 0;
          }
          // si no tiene saldo directamente, inspeccionar valores anidados (nivel 1)
          for (const v of Object.values(data)) {
            const found = extractSaldo(v);
            if (found != null) return found;
          }
        }

        return null;
      };

      const saldo = extractSaldo(userInfo);
      if (saldo != null) {
        state.credits = Number(saldo) || 0;
        // Actualiza también el saldo en localStorage
        const newSession = { ...JSON.parse(session), saldo: state.credits };
        localStorage.setItem('pb:session', JSON.stringify(newSession));
      } else {
        console.warn('syncBalance: no se encontró campo `saldo` en la respuesta de la API', userInfo);
      }
    } else {
      console.error('syncBalance: llamada a API fallida', r.status, await r.text());
    }
  } catch (e) {
    console.error("Error al sincronizar saldo:", e);
  }
};

export const setSession = (session) => {
  // Actualiza el estado reactivo con los datos del nuevo usuario
  state.uid = session.uid;
  state.rol = session.rol; // Guardamos el rol en el estado
  state.credits = Number(session.saldo) || 0;
  console.log(state.credits);
  localStorage.setItem('pb:session', JSON.stringify(session));
};

// Función para actualizar el saldo. Acepta montos positivos (ganancias) y negativos (pérdidas).
export const updateBalance = (amount) => {
  state.credits += amount;
  // Persistimos el cambio en localStorage para que no se pierda.
  const session = JSON.parse(localStorage.getItem('pb:session') || '{}');
  session.saldo = state.credits;
  localStorage.setItem('pb:session', JSON.stringify(session));
};

// Exportamos las referencias reactivas para que los componentes puedan usarlas.
export const balance = toRefs(state);