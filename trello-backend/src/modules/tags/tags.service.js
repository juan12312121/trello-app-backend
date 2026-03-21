import pool from '../../config/database.js';

// ── Obtener todas las etiquetas de un board ───────────
export const getTagsByBoard = async (boardId) => {
  const [rows] = await pool.execute(`
    SELECT * FROM tags
    WHERE board_id = ?
    ORDER BY nombre ASC
  `, [boardId]);

  return rows;
};

// ── Obtener etiquetas de una card ─────────────────────
export const getTagsByCard = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT t.id, t.nombre, t.color
    FROM card_tags ct
    JOIN tags t ON ct.tag_id = t.id
    WHERE ct.card_id = ?
  `, [cardId]);

  return rows;
};

// ── Crear etiqueta ────────────────────────────────────
export const createTag = async ({ nombre, color, boardId }) => {
  const [result] = await pool.execute(`
    INSERT INTO tags (nombre, color, board_id)
    VALUES (?, ?, ?)
  `, [nombre, color ?? '#808080', boardId]);

  const [rows] = await pool.execute(
    'SELECT * FROM tags WHERE id = ?',
    [result.insertId]
  );

  return rows[0];
};

// ── Actualizar etiqueta ───────────────────────────────
export const updateTag = async (tagId, { nombre, color }) => {
  await pool.execute(`
    UPDATE tags SET
      nombre = COALESCE(?, nombre),
      color  = COALESCE(?, color)
    WHERE id = ?
  `, [nombre ?? null, color ?? null, tagId]);

  const [rows] = await pool.execute(
    'SELECT * FROM tags WHERE id = ?',
    [tagId]
  );

  return rows[0];
};

// ── Eliminar etiqueta ─────────────────────────────────
// Al eliminarse se borra automáticamente de card_tags (CASCADE en BD)
export const deleteTag = async (tagId) => {
  await pool.execute('DELETE FROM tags WHERE id = ?', [tagId]);
};

// ── Asignar etiqueta a una card ───────────────────────
export const assignTagToCard = async ({ cardId, tagId }) => {
  // INSERT IGNORE evita error si ya está asignada
  await pool.execute(`
    INSERT IGNORE INTO card_tags (card_id, tag_id)
    VALUES (?, ?)
  `, [cardId, tagId]);
};

// ── Quitar etiqueta de una card ───────────────────────
export const removeTagFromCard = async ({ cardId, tagId }) => {
  await pool.execute(`
    DELETE FROM card_tags
    WHERE card_id = ? AND tag_id = ?
  `, [cardId, tagId]);
};

// ── Verificar que el tag pertenece al board ───────────
// Seguridad: evita asignar tags de otro board
export const tagBelongsToBoard = async (tagId, boardId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM tags WHERE id = ? AND board_id = ?',
    [tagId, boardId]
  );

  return rows.length > 0;
};