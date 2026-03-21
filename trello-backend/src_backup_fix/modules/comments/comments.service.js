import { logActivity } from '../activity/activity.service.js';
import pool from '../../config/database.js';

export const getCommentsByCard = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT
      c.id,
      c.texto,
      c.fecha_creacion,
      c.fecha_actualizacion,
      u.id     AS usuario_id,
      u.nombre AS usuario_nombre,
      u.foto_perfil
    FROM comments c
    JOIN users u ON c.usuario_id = u.id
    WHERE c.card_id = ?
    ORDER BY c.fecha_creacion ASC
  `, [cardId]);

  return rows;
};

export const createComment = async ({ cardId, userId, texto }) => {
  const [result] = await pool.execute(`
    INSERT INTO comments (card_id, usuario_id, texto)
    VALUES (?, ?, ?)
  `, [cardId, userId, texto]);

  const [rows] = await pool.execute(`
    SELECT c.*, u.nombre AS usuario_nombre, u.foto_perfil
    FROM comments c
    JOIN users u ON c.usuario_id = u.id
    WHERE c.id = ?
  `, [result.insertId]);

  return rows[0];
};

export const updateComment = async ({ commentId, userId, texto }) => {
  // Solo el autor puede editar su comentario
  const [result] = await pool.execute(`
    UPDATE comments SET texto = ?
    WHERE id = ? AND usuario_id = ?
  `, [texto, commentId, userId]);

  return result.affectedRows > 0;
};

export const deleteComment = async ({ commentId, userId }) => {
  // Solo el autor puede eliminar su comentario
  const [result] = await pool.execute(`
    DELETE FROM comments WHERE id = ? AND usuario_id = ?
  `, [commentId, userId]);

  return result.affectedRows > 0;
};
