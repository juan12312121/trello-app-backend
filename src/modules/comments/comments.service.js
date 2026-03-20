import pool from '../../config/database.js';
import { logActivity } from '../activity/activity.service.js';

export const getCommentsByCard = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT c.id, c.texto, c.fecha_creacion, c.fecha_actualizacion,
      u.id AS usuario_id, u.nombre AS nombre, u.foto_perfil
    FROM comments c
    JOIN users u ON c.usuario_id = u.id
    WHERE c.card_id = ?
    ORDER BY c.fecha_creacion ASC
  `, [cardId]);
  return rows;
};

export const createComment = async ({ cardId, userId, texto }) => {
  console.log('--- Creando Comentario en Backend ---');
  console.log({ cardId, userId, texto });

  try {
    const [result] = await pool.execute(`
      INSERT INTO comments (card_id, usuario_id, texto) VALUES (?, ?, ?)
    `, [cardId, userId, texto]);

    const [rows] = await pool.execute(`
      SELECT c.id, c.texto, c.fecha_creacion, c.fecha_actualizacion, 
             u.id AS usuario_id, u.nombre AS nombre, u.foto_perfil
      FROM comments c JOIN users u ON c.usuario_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    const [lists] = await pool.execute(`
      SELECT l.board_id FROM cards ca JOIN lists l ON ca.list_id = l.id WHERE ca.id = ?
    `, [cardId]);

    await logActivity({
      boardId:     lists[0]?.board_id ?? null,
      userId,
      tipoEvento:  'comentario_agregado',
      entidadTipo: 'card',
      entidadId:    cardId,
      descripcion:  'Comentario agregado',
    });

    return rows[0];
  } catch (error) {
    console.error('ERROR CATASTROFICO EN CREATE_COMMENT:', error);
    throw error;
  }
};

export const updateComment = async ({ commentId, userId, texto }) => {
  const [result] = await pool.execute(`
    UPDATE comments SET texto = ? WHERE id = ? AND usuario_id = ?
  `, [texto, commentId, userId]);
  return result.affectedRows > 0;
};

export const deleteComment = async ({ commentId, userId }) => {
  const [result] = await pool.execute(`
    DELETE FROM comments WHERE id = ? AND usuario_id = ?
  `, [commentId, userId]);
  return result.affectedRows > 0;
};
