import pool from '../../config/database.js';
import { logActivity } from '../activity/activity.service.js';

export const getListsByBoard = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT l.id, l.nombre, l.posicion, l.archivada, l.fecha_creacion,
      COUNT(c.id) AS total_tarjetas
    FROM lists l
    LEFT JOIN cards c ON l.id = c.list_id
    WHERE l.board_id = ?
    GROUP BY l.id
    ORDER BY l.posicion ASC
  `, [boardId]);
  return rows;
};

export const getListById = async (listId) => {
  const [rows] = await pool.execute('SELECT * FROM lists WHERE id = ?', [listId]);
  return rows[0] ?? null;
};

export const createList = async ({ nombre, boardId }) => {
  const [pos] = await pool.execute(`
    SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente
    FROM lists WHERE board_id = ?
  `, [boardId]);

  const [result] = await pool.execute(`
    INSERT INTO lists (nombre, board_id, posicion) VALUES (?, ?, ?)
  `, [nombre, boardId, pos[0].siguiente]);

  const list = await getListById(result.insertId);

  await logActivity({
    boardId,
    userId:      null,
    tipoEvento:  'lista_creada',
    entidadTipo: 'list',
    entidadId:    list.id,
    descripcion:  'Lista "' + nombre + '" creada',
  });

  return list;
};

export const updateList = async (listId, { nombre, archivada }) => {
  if (nombre !== undefined && archivada !== undefined) {
    await pool.execute('UPDATE lists SET nombre = ?, archivada = ? WHERE id = ?', [nombre, archivada, listId]);
  } else if (nombre !== undefined) {
    await pool.execute('UPDATE lists SET nombre = ? WHERE id = ?', [nombre, listId]);
  } else if (archivada !== undefined) {
    await pool.execute('UPDATE lists SET archivada = ? WHERE id = ?', [archivada, listId]);
  }

  return getListById(listId);
};

export const reorderLists = async (lists) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const { id, posicion } of lists) {
      await conn.execute('UPDATE lists SET posicion = ? WHERE id = ?', [posicion, id]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const archiveList = async (listId) => {
  await pool.execute('UPDATE lists SET archivada = TRUE WHERE id = ?', [listId]);
};

export const deleteList = async (listId) => {
  await pool.execute('DELETE FROM lists WHERE id = ?', [listId]);

  await logActivity({
    boardId:     null,
    userId:      null,
    tipoEvento:  'lista_eliminada',
    entidadTipo: 'list',
    entidadId:    listId,
    descripcion:  'Lista eliminada',
  });
};
