import pool from '../../config/database.js';
import { logActivity } from '../activity/activity.service.js';

export const getCardsByList = async (listId) => {
  const [rows] = await pool.execute(`
    SELECT
      c.id, c.titulo, c.descripcion, c.prioridad, c.fecha_vencimiento,
      c.completada, c.posicion, c.fecha_creacion,
      u.nombre AS usuario_asignado, u.id AS usuario_asignado_id,
      COUNT(DISTINCT ch.id) AS total_checklists,
      COUNT(DISTINCT cm.id) AS total_comentarios,
      COUNT(DISTINCT a.id)  AS total_archivos
    FROM cards c
    LEFT JOIN users u       ON c.usuario_asignado_id = u.id
    LEFT JOIN checklists ch ON c.id = ch.card_id
    LEFT JOIN comments cm   ON c.id = cm.card_id
    LEFT JOIN attachments a ON c.id = a.card_id
    WHERE c.list_id = ?
    GROUP BY c.id
    ORDER BY c.posicion ASC
  `, [listId]);

  // Cargar comentarios completos anidados a la tarjeta para el modal
  for (const card of rows) {
    const [commentsRows] = await pool.execute(`
      SELECT c.id, c.texto, c.fecha_creacion, c.fecha_actualizacion, 
             u.id AS usuario_id, u.nombre AS nombre, u.foto_perfil
      FROM comments c
      JOIN users u ON c.usuario_id = u.id
      WHERE c.card_id = ?
      ORDER BY c.fecha_creacion ASC
    `, [card.id]);
    
    card.comments = commentsRows;
  }

  return rows;
};

export const getCardById = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT c.*, u.nombre AS usuario_asignado, l.nombre AS lista_nombre, l.board_id
    FROM cards c
    LEFT JOIN users u ON c.usuario_asignado_id = u.id
    LEFT JOIN lists l ON c.list_id = l.id
    WHERE c.id = ?
  `, [cardId]);
  return rows[0] ?? null;
};

export const createCard = async ({ titulo, descripcion, prioridad, fecha_vencimiento, listId, userId }) => {
  const [pos] = await pool.execute(`
    SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente FROM cards WHERE list_id = ?
  `, [listId]);

  const [result] = await pool.execute(`
    INSERT INTO cards (titulo, descripcion, prioridad, fecha_vencimiento, list_id, usuario_asignado_id, posicion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [titulo, descripcion ?? null, prioridad ?? 'media', fecha_vencimiento ?? null, listId, userId ?? null, pos[0].siguiente]);

  const card = await getCardById(result.insertId);

  const [lists] = await pool.execute('SELECT board_id FROM lists WHERE id = ?', [listId]);

  await logActivity({
    boardId:     lists[0].board_id,
    userId,
    tipoEvento:  'card_creada',
    entidadTipo: 'card',
    entidadId:    card.id,
    descripcion:  'Tarjeta "' + titulo + '" creada',
    datosNuevos:  { titulo, prioridad, fecha_vencimiento },
  });

  return card;
};

export const updateCard = async (cardId, fields) => {
  const cardAnterior = await getCardById(cardId);
  const { titulo, descripcion, prioridad, fecha_vencimiento, completada, usuario_asignado_id } = fields;

  await pool.execute(`
    UPDATE cards SET
      titulo              = COALESCE(?, titulo),
      descripcion         = COALESCE(?, descripcion),
      prioridad           = COALESCE(?, prioridad),
      fecha_vencimiento   = COALESCE(?, fecha_vencimiento),
      completada          = COALESCE(?, completada),
      usuario_asignado_id = COALESCE(?, usuario_asignado_id)
    WHERE id = ?
  `, [titulo ?? null, descripcion ?? null, prioridad ?? null, fecha_vencimiento ?? null, completada ?? null, usuario_asignado_id ?? null, cardId]);

  const cardActualizada = await getCardById(cardId);

  await logActivity({
    boardId:         cardAnterior.board_id,
    userId:          null,
    tipoEvento:      'card_actualizada',
    entidadTipo:     'card',
    entidadId:        cardId,
    descripcion:      'Tarjeta actualizada',
    datosAnteriores:  cardAnterior,
    datosNuevos:      cardActualizada,
  });

  return cardActualizada;
};

export const moveCard = async (cardId, { listId, posicion }) => {
  await pool.execute('UPDATE cards SET list_id = ?, posicion = ? WHERE id = ?', [listId, posicion, cardId]);

  const card = await getCardById(cardId);

  await logActivity({
    boardId:     card.board_id,
    userId:      null,
    tipoEvento:  'card_movida',
    entidadTipo: 'card',
    entidadId:    cardId,
    descripcion:  'Tarjeta "' + card.titulo + '" movida',
  });

  return card;
};

export const reorderCards = async (cards) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const { id, posicion } of cards) {
      await conn.execute('UPDATE cards SET posicion = ? WHERE id = ?', [posicion, id]);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export const deleteCard = async (cardId) => {
  const card = await getCardById(cardId);
  await pool.execute('DELETE FROM cards WHERE id = ?', [cardId]);

  await logActivity({
    boardId:     card?.board_id ?? null,
    userId:      null,
    tipoEvento:  'card_eliminada',
    entidadTipo: 'card',
    entidadId:    cardId,
    descripcion:  'Tarjeta eliminada',
  });
};

export const getCardsAssignedToMe = async (userId) => {
  const [rows] = await pool.execute(`
    SELECT
      c.id, c.titulo, c.descripcion, c.prioridad, c.fecha_vencimiento,
      c.completada, c.posicion, c.fecha_creacion,
      l.nombre AS lista_nombre, b.nombre AS board_nombre, b.id AS board_id
    FROM cards c
    JOIN lists l ON c.list_id = l.id
    JOIN boards b ON l.board_id = b.id
    WHERE c.usuario_asignado_id = ?
    ORDER BY c.fecha_vencimiento ASC, c.fecha_creacion DESC
  `, [userId]);
  return rows;
};
