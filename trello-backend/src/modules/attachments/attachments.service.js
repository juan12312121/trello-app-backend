import pool from '../../config/database.js';
import fs   from 'fs/promises';
import path from 'path';
import { logActivity } from '../activity/activity.service.js';

// ── Obtener archivos de una card ──────────────────────
export const getAttachmentsByCard = async (cardId) => {
  const [rows] = await pool.execute(`
    SELECT
      a.id,
      a.nombre_archivo,
      a.ruta_archivo,
      a.tamano,
      a.tipo_archivo,
      a.fecha_creacion,
      u.id     AS usuario_id,
      u.nombre AS usuario_nombre
    FROM attachments a
    JOIN users u ON a.usuario_id = u.id
    WHERE a.card_id = ?
    ORDER BY a.fecha_creacion DESC
  `, [cardId]);

  return rows;
};

// ── Guardar attachment en BD ──────────────────────────
export const createAttachment = async ({ cardId, userId, file }) => {
  const [result] = await pool.execute(`
    INSERT INTO attachments (card_id, usuario_id, nombre_archivo, ruta_archivo, tamano, tipo_archivo)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    cardId,
    userId,
    file.originalname,       // nombre original del archivo
    file.filename,           // nombre uuid guardado en disco
    file.size,
    file.mimetype,
  ]);

  const [rows] = await pool.execute(`
    SELECT a.*, u.nombre AS usuario_nombre
    FROM attachments a
    JOIN users u ON a.usuario_id = u.id
    WHERE a.id = ?
  `, [result.insertId]);

  // Registrar actividad
  const [lists] = await pool.execute(`
    SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = ?
  `, [cardId]);

  await logActivity({
    boardId:     lists[0]?.board_id ?? null,
    userId,
    tipoEvento:  'archivo_adjunto',
    entidadTipo: 'card',
    entidadId:    cardId,
    descripcion:  'Archivo "' + file.originalname + '" adjuntado',
  });

  return rows[0];
};

// ── Obtener un attachment por ID ──────────────────────
export const getAttachmentById = async (attachmentId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM attachments WHERE id = ?',
    [attachmentId]
  );
  return rows[0] ?? null;
};

// ── Eliminar attachment ───────────────────────────────
export const deleteAttachment = async ({ attachmentId, userId }) => {
  const attachment = await getAttachmentById(attachmentId);
  if (!attachment) return false;

  // Solo el dueño puede eliminar
  if (attachment.usuario_id !== userId) return false;

  // Eliminar archivo físico del disco
  try {
    await fs.unlink(path.join('uploads', attachment.ruta_archivo));
  } catch {
    // Si el archivo no existe en disco, continuamos igual
    console.warn('[Attachments] Archivo no encontrado en disco:', attachment.ruta_archivo);
  }

  await pool.execute('DELETE FROM attachments WHERE id = ?', [attachmentId]);

  return true;
};