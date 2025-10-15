/**
 * Obtiene los headers de autenticación desde la sesión
 */
const getAuthHeaders = () => {
  const session = localStorage.getItem('pb:session');
  if (!session) {
    return {};
  }

  try {
    const { uid, sessionToken, expiresAt } = JSON.parse(session);
    
    // Verificar si la sesión ha expirado
    if (expiresAt && Date.now() > expiresAt) {
      localStorage.removeItem('pb:session');
      window.location.href = '/';
      return {};
    }

    return {
      'x-user-id': uid,
      'x-session-token': sessionToken,
    };
  } catch (e) {
    console.error('Error al parsear sesión:', e);
    return {};
  }
};

/**
 * Realiza una petición autenticada al API
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const authHeaders = getAuthHeaders();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Si recibimos 401, la sesión no es válida
    if (response.status === 401) {
      localStorage.removeItem('pb:session');
      window.location.href = '/';
      throw new Error('Sesión expirada');
    }

    return response;
  } catch (error) {
    console.error('Error en petición autenticada:', error);
    throw error;
  }
};

/**
 * Verifica si hay una sesión válida
 */
export const isSessionValid = () => {
  const session = localStorage.getItem('pb:session');
  if (!session) return false;

  try {
    const { expiresAt } = JSON.parse(session);
    return expiresAt && Date.now() < expiresAt;
  } catch (e) {
    return false;
  }
};

/**
 * Obtiene la información de la sesión actual
 */
export const getSessionInfo = () => {
  const session = localStorage.getItem('pb:session');
  if (!session) return null;

  try {
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
};
