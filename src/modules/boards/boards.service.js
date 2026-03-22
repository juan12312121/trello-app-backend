import pool from '../../config/database.js';
import crypto from 'crypto';
import { logActivity } from '../activity/activity.service.js';

export const getUserBoards = async (userId) => {
  const [rows] = await pool.execute(`
    SELECT DISTINCT
      b.id, b.token, b.nombre, b.descripcion, b.portada, b.archivado, b.fecha_creacion,
      u.nombre AS propietario,
      r.nombre AS mi_rol,
      (SELECT COUNT(*) FROM lists WHERE board_id = b.id) AS total_columnas,
      (SELECT COUNT(*) FROM cards c JOIN lists l ON c.list_id = l.id WHERE l.board_id = b.id) AS total_tarjetas
    FROM boards b
    JOIN users u ON b.usuario_propietario_id = u.id
    LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = ?
    LEFT JOIN roles r ON bm.rol_id = r.id
    WHERE b.usuario_propietario_id = ? OR bm.user_id = ?
  `, [userId, userId, userId]);
  return rows;
};

export const getBoardById = async (boardIdOrToken) => {
  const isToken = isNaN(Number(boardIdOrToken));
  const whereClause = isToken ? 'b.token = ?' : 'b.id = ?';

  const [rows] = await pool.execute(`
    SELECT b.*, u.nombre AS propietario
    FROM boards b
    JOIN users u ON b.usuario_propietario_id = u.id
    WHERE ${whereClause}
  `, [boardIdOrToken]);

  if (!rows[0]) return null;
  const board = rows[0];

  // Obtener los miembros
  const [members] = await pool.execute(`
    SELECT u.id, u.nombre, u.email, u.foto_perfil, r.nombre AS rol, bm.fecha_agregado
    FROM board_members bm
    JOIN users u ON bm.user_id = u.id
    LEFT JOIN roles r ON bm.rol_id  = r.id
    WHERE bm.board_id = ?
  `, [board.id]);

  // Asignar los iniciales o el color de cada miembro (frontend utilitario, o generarlos aquí)
  const colores = ['#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#0ea5e9'];
  const mapMembers = members.map((m, i) => {
    const initials = (m.nombre || 'U').split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase();
    return { ...m, initials, color: colores[i % colores.length] };
  });

  board.miembros = mapMembers;
  return board;
};

export const createBoard = async ({ nombre, descripcion, portada, userId }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const token = crypto.randomBytes(6).toString('hex');

    const [result] = await conn.execute(`
      INSERT INTO boards (nombre, descripcion, portada, usuario_propietario_id, token)
      VALUES (?, ?, ?, ?, ?)
    `, [nombre, descripcion ?? null, portada ?? null, userId, token]);

    const boardId = result.insertId;

    const [roles] = await conn.execute(
      'SELECT id FROM roles WHERE nombre = ?', ['admin']
    );

    await conn.execute(`
      INSERT INTO board_members (board_id, user_id, rol_id)
      VALUES (?, ?, ?)
    `, [boardId, userId, roles[0].id]);

    await conn.commit();

    await logActivity({
      boardId,
      userId,
      tipoEvento:  'board_creado',
      entidadTipo: 'board',
      entidadId:    boardId,
      descripcion:  'Tablero "' + nombre + '" creado',
    });

    return getBoardById(boardId);
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const updateBoard = async (boardId, { nombre, descripcion, portada, archivado }) => {
  await pool.execute(`
    UPDATE boards SET
      nombre      = COALESCE(?, nombre),
      descripcion = COALESCE(?, descripcion),
      portada     = COALESCE(?, portada),
      archivado   = COALESCE(?, archivado)
    WHERE id = ?
  `, [nombre ?? null, descripcion ?? null, portada ?? null, archivado ?? null, boardId]);

  const updated = await getBoardById(boardId);

  await logActivity({
    boardId,
    userId:      null,
    tipoEvento:  'board_actualizado',
    entidadTipo: 'board',
    entidadId:    boardId,
    descripcion:  'Tablero actualizado',
    datosNuevos:  updated,
  });

  return updated;
};

export const archiveBoard = async (boardId) => {
  await pool.execute('UPDATE boards SET archivado = TRUE WHERE id = ?', [boardId]);

  await logActivity({
    boardId,
    userId:      null,
    tipoEvento:  'board_archivado',
    entidadTipo: 'board',
    entidadId:    boardId,
    descripcion:  'Tablero archivado',
  });
};

export const deleteBoard = async (boardId) => {
  await pool.execute('DELETE FROM boards WHERE id = ?', [boardId]);
};

export const getMemberRole = async (boardIdOrToken, userId) => {
  const isToken = isNaN(Number(boardIdOrToken));
  const whereClause = isToken ? 'token = ?' : 'id = ?';

  const [owner] = await pool.execute(`
    SELECT id FROM boards WHERE ${whereClause} AND usuario_propietario_id = ?
  `, [boardIdOrToken, userId]);

  if (owner.length > 0) return 'admin';

  const [rows] = await pool.execute(`
    SELECT r.nombre AS rol
    FROM board_members bm
    JOIN roles r ON bm.rol_id = r.id
    JOIN boards b ON bm.board_id = b.id
    WHERE (b.${isToken ? 'token' : 'id'} = ?) AND bm.user_id = ?
  `, [boardIdOrToken, userId]);

  return rows[0]?.rol ?? null;
};
