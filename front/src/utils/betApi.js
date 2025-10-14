/**
 * Registra una nueva apuesta en el servidor
 * @param {Object} betData - Datos de la apuesta
 * @param {string} betData.uid - ID del usuario
 * @param {number} betData.gameId - ID del juego (1=Ruleta, 2=Slots, 3=Blackjack, 4=Plinko, 5=Mines, 6=Rocket)
 * @param {number} betData.amount - Monto apostado
 * @param {string} betData.result - Resultado ('GANADA' o 'PERDIDA')
 * @param {number} [betData.multiplier=1.0] - Multiplicador de ganancia (opcional)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function registerBet({ uid, gameId, amount, result, multiplier = 1.0 }) {
  try {
    const response = await fetch('https://pascualbet-cvr6.vercel.app/api/apuestas/new/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_id_usuario: uid,
        p_id_juego: gameId,
        p_monto: amount,
        p_resultado: result,
        p_multiplicador: multiplier
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error al registrar apuesta:', errorText);
      // No lanzamos error para que el juego continúe
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error en registerBet:', error);
    // No lanzamos error para que el juego continúe
    return null;
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
