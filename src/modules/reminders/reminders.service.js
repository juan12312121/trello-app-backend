import pool from '../../config/database.js';

// ── Obtener recordatorios de una card ─────────────────
export const getRemindersByCard = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT
      r.id,
      r.fecha_recordatorio,
      r.tipo,
      r.enviado,
      r.fecha_envio,
      r.fecha_creacion,
      u.id     AS usuario_id,
      u.nombre AS usuario_nombre
    FROM reminders r
    JOIN users u ON r.usuario_id = u.id
    WHERE r.card_id = ?
    ORDER BY r.fecha_recordatorio ASC
  `, [cardId]);

  return rows;
};

// ── Obtener recordatorios pendientes del usuario ──────
// Útil para un endpoint de notificaciones
export const getPendingRemindersByUser = async (userId) => {
  const [rows] = await pool.execute(`
    SELECT
      r.id,
      r.fecha_recordatorio,
      r.tipo,
      r.fecha_creacion,
      c.id     AS card_id,
      c.titulo AS card_titulo,
      l.id     AS list_id,
      l.nombre AS lista_nombre,
      b.id     AS board_id,
      b.nombre AS board_nombre
    FROM reminders r
    JOIN cards c  ON r.card_id  = c.id
    JOIN lists l  ON c.list_id  = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE r.usuario_id = ?
      AND r.enviado    = FALSE
      AND r.fecha_recordatorio >= NOW()
    ORDER BY r.fecha_recordatorio ASC
  `, [userId]);

  return rows;
};

// ── Crear recordatorio ────────────────────────────────
export const createReminder = async ({ cardId, userId, fechaRecordatorio, tipo }) => {
  const [result] = await pool.execute(`
    INSERT INTO reminders (card_id, usuario_id, fecha_recordatorio, tipo)
    VALUES (?, ?, ?, ?)
  `, [cardId, userId, fechaRecordatorio, tipo ?? 'en_app']);

  const [rows] = await pool.execute(`
    SELECT r.*, u.nombre AS usuario_nombre
    FROM reminders r
    JOIN users u ON r.usuario_id = u.id
    WHERE r.id = ?
  `, [result.insertId]);

  return rows[0];
};

// ── Actualizar recordatorio ───────────────────────────
export const updateReminder = async ({ reminderId, userId, fechaRecordatorio, tipo }) => {
  // Solo el dueño puede editar su recordatorio
  const [result] = await pool.execute(`
    UPDATE reminders SET
      fecha_recordatorio = COALESCE(?, fecha_recordatorio),
      tipo               = COALESCE(?, tipo)
    WHERE id = ? AND usuario_id = ?
  `, [fechaRecordatorio ?? null, tipo ?? null, reminderId, userId]);

  if (result.affectedRows === 0) return null;

  const [rows] = await pool.execute(
    'SELECT * FROM reminders WHERE id = ?', [reminderId]
  );

  return rows[0];
};

// ── Eliminar recordatorio ─────────────────────────────
export const deleteReminder = async ({ reminderId, userId }) => {
  const [result] = await pool.execute(`
    DELETE FROM reminders WHERE id = ? AND usuario_id = ?
  `, [reminderId, userId]);

  return result.affectedRows > 0;
};

// ── Marcar como enviado ───────────────────────────────
// Lo usará un cron job en el futuro
export const markReminderAsSent = async (reminderId) => {
  await pool.execute(`
    UPDATE reminders
    SET enviado = TRUE, fecha_envio = NOW()
    WHERE id = ?
  `, [reminderId]);
};