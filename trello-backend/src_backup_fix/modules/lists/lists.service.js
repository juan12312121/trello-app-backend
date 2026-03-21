import { logActivity } from '../activity/activity.service.js';
import pool from '../../config/database.js';

// ── Obtener todas las listas de un board ──────────────
export const getListsByBoard = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT
      l.id,
      l.nombre,
      l.posicion,
      l.archivada,
      l.fecha_creacion,
      COUNT(c.id) AS total_tarjetas
    FROM lists l
    LEFT JOIN cards c ON l.id = c.list_id
    WHERE l.board_id = ?
    GROUP BY l.id
    ORDER BY l.posicion ASC
  `, [boardId]);

  return rows;
};

// ── Obtener una lista por ID ──────────────────────────
export const getListById = async (listId) => {
  const [rows] = await pool.execute(`
    SELECT * FROM lists WHERE id = ?
  `, [listId]);

  return rows[0] ?? null;
};

// ── Crear lista ───────────────────────────────────────
export const createList = async ({ nombre, boardId }) => {
  // La nueva lista va al final — calculamos la última posición
  const [pos] = await pool.execute(`
    SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente
    FROM lists
    WHERE board_id = ?
  `, [boardId]);

  const posicion = pos[0].siguiente;

  const [result] = await pool.execute(`
    INSERT INTO lists (nombre, board_id, posicion)
    VALUES (?, ?, ?)
  `, [nombre, boardId, posicion]);

  return getListById(result.insertId);
};

// ── Actualizar nombre de lista ────────────────────────
export const updateList = async (listId, { nombre }) => {
  await pool.execute(`
    UPDATE lists SET nombre = ? WHERE id = ?
  `, [nombre, listId]);

  return getListById(listId);
};

// ── Reordenar listas ──────────────────────────────────
// Recibe un array de { id, posicion } y actualiza todo de una vez
export const reorderLists = async (lists) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const { id, posicion } of lists) {
      await conn.execute(
        'UPDATE lists SET posicion = ? WHERE id = ?',
        [posicion, id]
      );
    }

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

// ── Archivar lista ────────────────────────────────────
export const archiveList = async (listId) => {
  await pool.execute(
    'UPDATE lists SET archivada = TRUE WHERE id = ?',
    [listId]
  );
};

// ── Eliminar lista ────────────────────────────────────
export const deleteList = async (listId) => {
  await pool.execute(
    'DELETE FROM lists WHERE id = ?',
    [listId]
  );
};
