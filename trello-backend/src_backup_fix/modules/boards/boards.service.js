import { logActivity } from '../activity/activity.service.js';
import pool from '../../config/database.js';

// ── Obtener todos los boards del usuario ──────────────
// Los que creó + los que es miembro
export const getUserBoards = async (userId) => {
  const [rows] = await pool.execute(`
    SELECT DISTINCT
      b.id,
      b.nombre,
      b.descripcion,
      b.portada,
      b.archivado,
      b.fecha_creacion,
      u.nombre  AS propietario,
      r.nombre  AS mi_rol
    FROM boards b
    JOIN users u ON b.usuario_propietario_id = u.id
    LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = ?
    LEFT JOIN roles r ON bm.rol_id = r.id
    WHERE b.usuario_propietario_id = ?
       OR bm.user_id = ?
  `, [userId, userId, userId]);

  return rows;
};

// ── Obtener un board por ID ───────────────────────────
export const getBoardById = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT
      b.*,
      u.nombre AS propietario
    FROM boards b
    JOIN users u ON b.usuario_propietario_id = u.id
    WHERE b.id = ?
  `, [boardId]);

  return rows[0] ?? null;
};

// ── Crear board ───────────────────────────────────────
export const createBoard = async ({ nombre, descripcion, portada, userId }) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Crear el board
    const [result] = await conn.execute(`
      INSERT INTO boards (nombre, descripcion, portada, usuario_propietario_id)
      VALUES (?, ?, ?, ?)
    `, [nombre, descripcion ?? null, portada ?? null, userId]);

    const boardId = result.insertId;

    // 2. Agregar al creador como admin automáticamente
    const [roles] = await conn.execute(
      'SELECT id FROM roles WHERE nombre = ?',
      ['admin']
    );

    await conn.execute(`
      INSERT INTO board_members (board_id, user_id, rol_id)
      VALUES (?, ?, ?)
    `, [boardId, userId, roles[0].id]);

    await conn.commit();

    return getBoardById(boardId);
  } catch (error) {
    await conn.rollback();  // si algo falla, deshace todo
    throw error;
  } finally {
    conn.release();
  }
};

// ── Actualizar board ──────────────────────────────────
export const updateBoard = async (boardId, { nombre, descripcion, portada }) => {
  await pool.execute(`
    UPDATE boards
    SET nombre      = COALESCE(?, nombre),
        descripcion = COALESCE(?, descripcion),
        portada     = COALESCE(?, portada)
    WHERE id = ?
  `, [nombre ?? null, descripcion ?? null, portada ?? null, boardId]);

  return getBoardById(boardId);
};

// ── Archivar board (soft delete) ──────────────────────
export const archiveBoard = async (boardId) => {
  await pool.execute(
    'UPDATE boards SET archivado = TRUE WHERE id = ?',
    [boardId]
  );
};

// ── Eliminar board ────────────────────────────────────
export const deleteBoard = async (boardId) => {
  await pool.execute(
    'DELETE FROM boards WHERE id = ?',
    [boardId]
  );
};

// ── Verificar si el usuario es miembro y su rol ───────
export const getMemberRole = async (boardId, userId) => {
  // Primero verifica si es el propietario
  const [owner] = await pool.execute(
    'SELECT id FROM boards WHERE id = ? AND usuario_propietario_id = ?',
    [boardId, userId]
  );

  if (owner.length > 0) return 'admin';

  // Si no, busca en board_members
  const [rows] = await pool.execute(`
    SELECT r.nombre AS rol
    FROM board_members bm
    JOIN roles r ON bm.rol_id = r.id
    WHERE bm.board_id = ? AND bm.user_id = ?
  `, [boardId, userId]);

  return rows[0]?.rol ?? null;  // null = no es miembro
};
