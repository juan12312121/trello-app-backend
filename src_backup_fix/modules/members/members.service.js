import { logActivity } from '../activity/activity.service.js';
import pool from '../../config/database.js';

// ── Obtener miembros de un board ──────────────────────
export const getBoardMembers = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT
      u.id,
      u.nombre,
      u.email,
      u.foto_perfil,
      r.nombre  AS rol,
      bm.fecha_agregado
    FROM board_members bm
    JOIN users u ON bm.user_id = u.id
    JOIN roles r ON bm.rol_id  = r.id
    WHERE bm.board_id = ?
    ORDER BY bm.fecha_agregado ASC
  `, [boardId]);

  return rows;
};

// ── Agregar miembro ───────────────────────────────────
export const addMember = async ({ boardId, email, rolNombre }) => {
  // 1. Buscar el usuario por email
  const [users] = await pool.execute(
    'SELECT id, nombre, email FROM users WHERE email = ?',
    [email]
  );

  if (!users[0]) return null; // usuario no existe

  // 2. Buscar el rol
  const [roles] = await pool.execute(
    'SELECT id FROM roles WHERE nombre = ?',
    [rolNombre ?? 'viewer']
  );

  // 3. Insertar — si ya es miembro, actualiza el rol
  await pool.execute(`
    INSERT INTO board_members (board_id, user_id, rol_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id)
  `, [boardId, users[0].id, roles[0].id]);

  return users[0];
};

// ── Cambiar rol de un miembro ─────────────────────────
export const updateMemberRole = async ({ boardId, userId, rolNombre }) => {
  const [roles] = await pool.execute(
    'SELECT id FROM roles WHERE nombre = ?',
    [rolNombre]
  );

  if (!roles[0]) return false;

  await pool.execute(`
    UPDATE board_members SET rol_id = ?
    WHERE board_id = ? AND user_id = ?
  `, [roles[0].id, boardId, userId]);

  return true;
};

// ── Eliminar miembro ──────────────────────────────────
export const removeMember = async ({ boardId, userId }) => {
  await pool.execute(`
    DELETE FROM board_members
    WHERE board_id = ? AND user_id = ?
  `, [boardId, userId]);
};
