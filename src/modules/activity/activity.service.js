import pool from '../../config/database.js';

// ── Registrar un evento ───────────────────────────────
// Se llama desde otros servicios, no desde el cliente
export const logActivity = async ({
  boardId,
  userId,
  tipoEvento,
  entidadTipo = null,
  entidadId   = null,
  descripcion = null,
  datosAnteriores = null,
  datosNuevos     = null,
}) => {
  try {
    await pool.execute(`
      INSERT INTO activity_log
        (board_id, usuario_id, tipo_evento, entidad_tipo, entidad_id, descripcion, datos_anteriores, datos_nuevos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      boardId,
      userId,
      tipoEvento,
      entidadTipo,
      entidadId,
      descripcion,
      datosAnteriores ? JSON.stringify(datosAnteriores) : null,
      datosNuevos     ? JSON.stringify(datosNuevos)     : null,
    ]);
  } catch (error) {
    // El log nunca debe romper el flujo principal
    console.error('[Activity Log Error]', error.message);
  }
};

// ── Obtener actividad de un board ─────────────────────
export const getActivityByBoard = async (boardId, { limit = 50, offset = 0 } = {}) => {
  // Obtenemos una conexión dedicada para poder setear sort_buffer_size a nivel sesión
  // y evitar el error "Out of sort memory" en boards con mucha actividad
  const conn = await pool.getConnection();
  try {
    await conn.query('SET SESSION sort_buffer_size = 4194304'); // 4 MB
    const [rows] = await conn.query(`
      SELECT
        a.id,
        a.tipo_evento,
        a.entidad_tipo,
        a.entidad_id,
        a.descripcion,
        a.datos_anteriores,
        a.datos_nuevos,
        a.fecha_creacion,
        u.id     AS usuario_id,
        u.nombre AS usuario_nombre,
        u.foto_perfil
      FROM activity_log a
      LEFT JOIN users u ON a.usuario_id = u.id
      WHERE a.board_id = ?
      ORDER BY a.fecha_creacion DESC
      LIMIT ? OFFSET ?
    `, [Number(boardId), Number(limit), Number(offset)]);
    return rows;
  } finally {
    conn.release();
  }
};

// ── Obtener actividad de una card ─────────────────────
export const getActivityByCard = async (cardId) => {
  const [rows] = await pool.query(`
    SELECT
      a.id,
      a.tipo_evento,
      a.descripcion,
      a.datos_anteriores,
      a.datos_nuevos,
      a.fecha_creacion,
      u.id     AS usuario_id,
      u.nombre AS usuario_nombre
    FROM activity_log a
    LEFT JOIN users u ON a.usuario_id = u.id
    WHERE a.entidad_tipo = 'card' AND a.entidad_id = ?
    ORDER BY a.fecha_creacion DESC
  `, [cardId]);

  return rows;
};

export const getActivityByUser = async (userId, { limit = 20 } = {}) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('SET SESSION sort_buffer_size = 4194304'); // 4 MB
    const [rows] = await conn.query(`
      SELECT DISTINCT
        a.id, a.tipo_evento, a.descripcion, a.fecha_creacion,
        u.nombre AS usuario_nombre,
        b.nombre AS board_nombre
      FROM activity_log a
      INNER JOIN board_members bm ON a.board_id = bm.board_id
      INNER JOIN users u ON a.usuario_id = u.id
      INNER JOIN boards b ON a.board_id = b.id
      WHERE bm.user_id = ?
      ORDER BY a.fecha_creacion DESC
      LIMIT ?
    `, [Number(userId), Number(limit)]);
    return rows;
  } finally {
    conn.release();
  }
};