import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getRemindersByCard,
  getPendingRemindersByUser,
  createReminder,
  updateReminder,
  deleteReminder,
} from './reminders.service.js';

// GET /api/v1/boards/:boardId/lists/:listId/cards/:cardId/reminders
export const getReminders = async (req, res, next) => {
  try {
    const reminders = await getRemindersByCard(req.params.cardId);
    return ApiResponse.success(res, { reminders });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/reminders/pending
// Recordatorios pendientes del usuario autenticado
export const getPendingReminders = async (req, res, next) => {
  try {
    const reminders = await getPendingRemindersByUser(req.user.id);
    return ApiResponse.success(res, { reminders });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/lists/:listId/cards/:cardId/reminders
export const postReminder = async (req, res, next) => {
  try {
    const { fecha_recordatorio, tipo } = req.body;

    const reminder = await createReminder({
      cardId:            req.params.cardId,
      userId:            req.user.id,
      fechaRecordatorio: fecha_recordatorio,
      tipo,
    });

    return ApiResponse.created(res, { reminder }, 'Recordatorio creado');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/.../reminders/:reminderId
export const patchReminder = async (req, res, next) => {
  try {
    const { fecha_recordatorio, tipo } = req.body;

    const reminder = await updateReminder({
      reminderId:        req.params.reminderId,
      userId:            req.user.id,
      fechaRecordatorio: fecha_recordatorio,
      tipo,
    });

    if (!reminder) {
      return ApiResponse.forbidden(res, 'No puedes editar este recordatorio');
    }

    return ApiResponse.success(res, { reminder }, 'Recordatorio actualizado');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/.../reminders/:reminderId
export const deleteReminder_ = async (req, res, next) => {
  try {
    const deleted = await deleteReminder({
      reminderId: req.params.reminderId,
      userId:     req.user.id,
    });

    if (!deleted) {
      return ApiResponse.forbidden(res, 'No puedes eliminar este recordatorio');
    }

    return ApiResponse.success(res, null, 'Recordatorio eliminado');
  } catch (error) {
    next(error);
  }
};