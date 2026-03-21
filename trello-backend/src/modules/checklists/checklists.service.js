import pool from '../../config/database.js';

// ── Obtener checklists de una card con sus items ──────
export const getChecklistsByCard = async (cardId) => {
  const [checklists] = await pool.execute(`
    SELECT * FROM checklists WHERE card_id = ? ORDER BY posicion ASC
  `, [cardId]);

  // Para cada checklist, obtener sus items
  for (const checklist of checklists) {
    const [items] = await pool.execute(`
      SELECT * FROM checklist_items
      WHERE checklist_id = ?
      ORDER BY posicion ASC
    `, [checklist.id]);

    checklist.items = items;
  }

  return checklists;
};

// ── Crear checklist ───────────────────────────────────
export const createChecklist = async ({ cardId, titulo }) => {
  const [pos] = await pool.execute(`
    SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente
    FROM checklists WHERE card_id = ?
  `, [cardId]);

  const [result] = await pool.execute(`
    INSERT INTO checklists (card_id, titulo, posicion)
    VALUES (?, ?, ?)
  `, [cardId, titulo, pos[0].siguiente]);

  const [rows] = await pool.execute(
    'SELECT * FROM checklists WHERE id = ?',
    [result.insertId]
  );

  return { ...rows[0], items: [] };
};

// ── Eliminar checklist ────────────────────────────────
export const deleteChecklist = async (checklistId) => {
  await pool.execute('DELETE FROM checklists WHERE id = ?', [checklistId]);
};

// ── Agregar item al checklist ─────────────────────────
export const createChecklistItem = async ({ checklistId, texto }) => {
  const [pos] = await pool.execute(`
    SELECT COALESCE(MAX(posicion), 0) + 1 AS siguiente
    FROM checklist_items WHERE checklist_id = ?
  `, [checklistId]);

  const [result] = await pool.execute(`
    INSERT INTO checklist_items (checklist_id, texto, posicion)
    VALUES (?, ?, ?)
  `, [checklistId, texto, pos[0].siguiente]);

  const [rows] = await pool.execute(
    'SELECT * FROM checklist_items WHERE id = ?',
    [result.insertId]
  );

  return rows[0];
};

// ── Actualizar item (texto o completado) ──────────────
export const updateChecklistItem = async ({ itemId, texto, completado }) => {
  await pool.execute(`
    UPDATE checklist_items SET
      texto      = COALESCE(?, texto),
      completado = COALESCE(?, completado)
    WHERE id = ?
  `, [texto ?? null, completado ?? null, itemId]);

  const [rows] = await pool.execute(
    'SELECT * FROM checklist_items WHERE id = ?',
    [itemId]
  );

  return rows[0];
};

// ── Eliminar item ─────────────────────────────────────
export const deleteChecklistItem = async (itemId) => {
  await pool.execute('DELETE FROM checklist_items WHERE id = ?', [itemId]);
};