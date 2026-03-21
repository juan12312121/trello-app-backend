import { logActivity } from '../activity/activity.service.js';
import pool from '../../config/database.js';

// ── Obtener todas las cards de una lista ──────────────
export const getCardsByList = async (listId) => {
  const [rows] = await pool.execute(`
    SELECT
      c.id,
      c.titulo,
      c.descripcion,
      c.prioridad,
      c.fecha_vencimiento,
      c.completada,
      c.posicion,
      c.fecha_creacion,
      u.nombre  AS usuario_asignado,
      u.id      AS usuario_asignado_id,
      COUNT(DISTINCT ch.id)  AS total_checklists,
      COUNT(DISTINCT cm.id)  AS total_comentarios,
      COUNT(DISTINCT a.id)   AS total_archivos
    FROM cards c
    LEFT JOIN users u        ON c.usuario_asignado_id = u.id
    LEFT JOIN checklists ch  ON c.id = ch.card_id
    LEFT JOIN comments cm    ON c.id = cm.card_id
    LEFT JOIN attachments a  ON c.id = a.card_id
    WHERE c.list_id = ?
    GROUP BY c.id
    ORDER BY c.posicion ASC
  `, [listId]);

  return rows;
};

// ── Obtener una card por ID (con detalle completo) ────
export const getCardById = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT
      c.*,
      u.nombre  AS usuario_asignado,
      l.nombre  AS lista_nombre,
      l.board_id
    FROM cards c
    LEFT JOIN users u ON c.usuario_asignado_id = u.id
    LEFT JOIN lists l ON c.list_id = l.id
    WHERE c.id = ?
  `, [cardId]);

  return rows[0] ?? null;
};

// ── Crear card ────────────────────────────────────────
export const createCard = async ({ titulo, descripcion, prioridad, fecha_vencimiento, listId, userId }) => {
  // Calcular posición al final de la lista
  const [pos] = await pool.execute(`
    SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente
    FROM cards WHERE list_id = ?
  `, [listId]);

  const [result] = await pool.execute(`
    INSERT INTO cards
      (titulo, descripcion, prioridad, fecha_vencimiento, list_id, usuario_asignado_id, posicion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    titulo,
    descripcion       ?? null,
    prioridad         ?? 'media',
    fecha_vencimiento ?? null,
    listId,
    userId            ?? null,
    pos[0].siguiente,
  ]);

  return getCardById(result.insertId);
};

// ── Actualizar card ───────────────────────────────────
export const updateCard = async (cardId, fields) => {
  const {
    titulo,
    descripcion,
    prioridad,
    fecha_vencimiento,
    completada,
    usuario_asignado_id,
  } = fields;

  await pool.execute(`
    UPDATE cards SET
      titulo               = COALESCE(?, titulo),
      descripcion          = COALESCE(?, descripcion),
      prioridad            = COALESCE(?, prioridad),
      fecha_vencimiento    = COALESCE(?, fecha_vencimiento),
      completada           = COALESCE(?, completada),
      usuario_asignado_id  = COALESCE(?, usuario_asignado_id)
    WHERE id = ?
  `, [
    titulo              ?? null,
    descripcion         ?? null,
    prioridad           ?? null,
    fecha_vencimiento   ?? null,
    completada          ?? null,
    usuario_asignado_id ?? null,
    cardId,
  ]);

  return getCardById(cardId);
};

// ── Mover card a otra lista ───────────────────────────
export const moveCard = async (cardId, { listId, posicion }) => {
  await pool.execute(`
    UPDATE cards SET list_id = ?, posicion = ? WHERE id = ?
  `, [listId, posicion, cardId]);

  return getCardById(cardId);
};

// ── Reordenar cards dentro de una lista ──────────────
export const reorderCards = async (cards) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    for (const { id, posicion } of cards) {
      await conn.execute(
        'UPDATE cards SET posicion = ? WHERE id = ?',
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

// ── Eliminar card ─────────────────────────────────────
export const deleteCard = async (cardId) => {
  await pool.execute('DELETE FROM cards WHERE id = ?', [cardId]);
};
