import pool from '../../config/database.js';
import { logActivity } from '../activity/activity.service.js';

export const getBoardMembers = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT u.id, u.nombre, u.email, u.foto_perfil, r.nombre AS rol, bm.fecha_agregado
    FROM board_members bm
    JOIN users u ON bm.user_id = u.id
    JOIN roles r ON bm.rol_id  = r.id
    WHERE bm.board_id = ?
    ORDER BY bm.fecha_agregado ASC
  `, [boardId]);
  return rows;
};

export const addMember = async ({ boardId, email, rolNombre }) => {
  const [users] = await pool.execute(
    'SELECT id, nombre, email FROM users WHERE email = ?', [email]
  );
  if (!users[0]) return null;

  const [roles] = await pool.execute(
    'SELECT id FROM roles WHERE nombre = ?', [rolNombre ?? 'viewer']
  );

  await pool.execute(`
    INSERT INTO board_members (board_id, user_id, rol_id)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE rol_id = VALUES(rol_id)
  `, [boardId, users[0].id, roles[0].id]);

  await logActivity({
    boardId,
    userId:      users[0].id,
    tipoEvento:  'miembro_agregado',
    entidadTipo: 'board',
    entidadId:    boardId,
    descripcion:  'Miembro "' + users[0].nombre + '" agregado',
  });

  return users[0];
};

export const updateMemberRole = async ({ boardId, userId, rolNombre }) => {
  const [roles] = await pool.execute(
    'SELECT id FROM roles WHERE nombre = ?', [rolNombre]
  );
  if (!roles[0]) return false;

  await pool.execute(`
    UPDATE board_members SET rol_id = ? WHERE board_id = ? AND user_id = ?
  `, [roles[0].id, boardId, userId]);

  await logActivity({
    boardId,
    userId,
    tipoEvento:  'rol_cambiado',
    entidadTipo: 'board',
    entidadId:    boardId,
    descripcion:  'Rol cambiado a "' + rolNombre + '"',
  });

  return true;
};

export const removeMember = async ({ boardId, userId }) => {
  await pool.execute(`
    DELETE FROM board_members WHERE board_id = ? AND user_id = ?
  `, [boardId, userId]);

  await logActivity({
    boardId,
    userId,
    tipoEvento:  'miembro_eliminado',
    entidadTipo: 'board',
    entidadId:    boardId,
    descripcion:  'Miembro eliminado del tablero',
  });
};
