import { authenticatedFetch } from './api.js';

/**
 * Registra una nueva apuesta en el servidor
 * @param {Object} betData - Datos de la apuesta
 * @param {string} betData.uid - ID del usuario
 * @param {number} betData.gameId - ID del juego (1=Ruleta, 2=Slots, 3=Blackjack, 4=Plinko, 5=Mines, 6=Rocket)
 * @param {number} betData.amount - Monto apostado
 * @param {string} betData.result - Resultado ('GANADA' o 'PERDIDA')
 * @param {number} [betData.multiplier=1.0] - Multiplicador de ganancia (opcional)
 * @param {number} [betData.netWin=0] - Ganancia neta: monto ganado - monto apostado (puede ser negativo si perdió)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function registerBet({ uid, gameId, amount, result, multiplier = 1.0, netWin = 0 }) {
  try {
    const response = await authenticatedFetch('https://pascualbet-cvr6.vercel.app/api/apuestas/new/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_id_usuario: uid,
        p_id_juego: gameId,
        p_monto: amount,
        p_resultado: result,
        p_multiplicador: multiplier,
        p_ganancia_neta: netWin
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al registrar apuesta:', errorText);
      return { success: false, error: errorText };
    }

    const data = await response.json();
    
    // Pequeño delay para asegurar que la DB se actualice antes de sincronizar
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error en registerBet:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Registra una nueva transferencia (depósito/retiro) en el servidor
 * @param {Object} transferData - Datos de la transferencia
 * @param {string} transferData.uid - ID del usuario
 * @param {string} transferData.tipo - Tipo de transacción ('DEPOSITO' o 'RETIRO')
 * @param {number} transferData.monto - Monto de la transacción
 * @param {string} [transferData.banco] - Banco (opcional)
 * @param {string} [transferData.cuenta] - Número de cuenta (opcional)
 * @param {string} [transferData.estado='APROBADO'] - Estado de la transacción (opcional)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function registerTransfer({ uid, tipo, monto, banco = '', cuenta = '', estado = 'APROBADO' }) {
  try {
    const response = await authenticatedFetch('https://pascualbet-cvr6.vercel.app/api/apuestas/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_id_usuario: uid,
        p_tipo_transaccion: tipo,
        p_monto: monto,
        p_banco: banco,
        p_cuenta_cliente: cuenta,
        p_estado: estado
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al registrar transferencia:', errorText);
      throw new Error(errorText || `Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    
    // Delay para asegurar que la DB se actualice
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error en registerTransfer:', error);
    throw error;
  }
}

/**
 * IDs de juegos disponibles
 */
export const GAME_IDS = {
  RULETA: 1,
  SLOTS: 2,
  BLACKJACK: 3,
  PLINKO: 4,
  MINES: 5,
  ROCKET: 6
};
