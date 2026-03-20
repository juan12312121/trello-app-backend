import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getAttachmentsByCard,
  createAttachment,
  getAttachmentById,
  deleteAttachment,
} from './attachments.service.js';
import path from 'path';
import fs   from 'fs/promises';

// GET /api/v1/.../cards/:cardId/attachments
export const getAttachments = async (req, res, next) => {
  try {
    const attachments = await getAttachmentsByCard(req.params.cardId);
    return ApiResponse.success(res, { attachments });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/.../cards/:cardId/attachments
export const postAttachment = async (req, res, next) => {
  try {
    // req.file lo inyecta multer
    if (!req.file) {
      return ApiResponse.error(res, 'No se recibió ningún archivo', 400);
    }

    const attachment = await createAttachment({
      cardId: req.params.cardId,
      userId: req.user.id,
      file:   req.file,
    });

    return ApiResponse.created(res, { attachment }, 'Archivo adjuntado');
  } catch (error) {
    // Si algo falla, eliminar el archivo subido para no dejar basura
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

// GET /api/v1/.../attachments/:attachmentId/download
export const downloadAttachment = async (req, res, next) => {
  try {
    const attachment = await getAttachmentById(req.params.attachmentId);
    if (!attachment) return ApiResponse.notFound(res, 'Archivo no encontrado');

    const filePath = path.resolve('uploads', attachment.ruta_archivo);

    // Verifica que el archivo existe antes de enviarlo
    await fs.access(filePath);

    // Fuerza la descarga con el nombre original
    res.download(filePath, attachment.nombre_archivo);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return ApiResponse.notFound(res, 'Archivo no encontrado en el servidor');
    }
    next(error);
  }
};

// DELETE /api/v1/.../attachments/:attachmentId
export const deleteAttachment_ = async (req, res, next) => {
  try {
    const deleted = await deleteAttachment({
      attachmentId: req.params.attachmentId,
      userId:       req.user.id,
    });

    if (!deleted) {
      return ApiResponse.forbidden(res, 'No puedes eliminar este archivo');
    }

    return ApiResponse.success(res, null, 'Archivo eliminado');
  } catch (error) {
    next(error);
  }
};