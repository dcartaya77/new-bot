/**
 * ============================================================================
 * GESTOR DE ESTADOS DE CONVERSACIÓN (State Manager)
 * ============================================================================
 * Mantiene la fase del chat en la que se encuentra cada usuario (en memoria)
 * con limpieza automática de sesiones inactivas y helpers para manipular el estado.
 */

class StateManager {
  constructor(sessionTimeoutMinutes = 60) {
    // Almacén en memoria: Map<userId, SessionData>
    this.sessions = new Map();
    this.timeoutMs = sessionTimeoutMinutes * 60 * 1000;
  }

  /**
   * Obtiene la sesión actual de un usuario o crea una nueva si no existe o expiró.
   * @param {string} userId - Número de WhatsApp o identificador del usuario
   * @returns {Object} Datos de la sesión
   */
  getOrCreate(userId) {
    const existing = this.sessions.get(userId);
    const now = Date.now();

    if (existing) {
      // Si la sesión expiró por inactividad, reiniciamos el flujo
      if (now - existing.lastActivity > this.timeoutMs) {
        this.reset(userId);
      } else {
        existing.lastActivity = now;
        return existing;
      }
    }

    const newSession = {
      userId,
      step: "AWAITING_NAME", // Fases: 'AWAITING_NAME', 'QUESTION_X', 'COMPLETED'
      questionIndex: 0,
      name: null,
      answers: {},
      qualified: null,
      createdAt: now,
      lastActivity: now
    };

    this.sessions.set(userId, newSession);
    return newSession;
  }

  /**
   * Actualiza propiedades de la sesión activa
   */
  update(userId, updates) {
    const session = this.getOrCreate(userId);
    Object.assign(session, updates, { lastActivity: Date.now() });
    this.sessions.set(userId, session);
    return session;
  }

  /**
   * Reinicia la sesión de un usuario (para pruebas o si escribe "reiniciar")
   */
  reset(userId) {
    this.sessions.delete(userId);
    return this.getOrCreate(userId);
  }

  /**
   * Elimina sesiones huérfanas o muy antiguas periódicamente
   */
  cleanup() {
    const now = Date.now();
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.timeoutMs) {
        this.sessions.delete(userId);
      }
    }
  }
}

export const stateManager = new StateManager();
