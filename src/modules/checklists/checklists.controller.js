import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getChecklistsByCard,
  createChecklist,
  deleteChecklist,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from './checklists.service.js';

// GET /api/v1/.../cards/:cardId/checklists
export const getChecklists = async (req, res, next) => {
  try {
    const checklists = await getChecklistsByCard(req.params.cardId);
    return ApiResponse.success(res, { checklists });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/.../cards/:cardId/checklists
export const postChecklist = async (req, res, next) => {
  try {
    const checklist = await createChecklist({
      cardId: req.params.cardId,
      titulo: req.body.titulo,
    });
    return ApiResponse.created(res, { checklist });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/.../checklists/:checklistId
export const deleteChecklist_ = async (req, res, next) => {
  try {
    await deleteChecklist(req.params.checklistId);
    return ApiResponse.success(res, null, 'Checklist eliminado');
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/.../checklists/:checklistId/items
export const postChecklistItem = async (req, res, next) => {
  try {
    const item = await createChecklistItem({
      checklistId: req.params.checklistId,
      texto:       req.body.texto,
    });
    return ApiResponse.created(res, { item });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/.../checklists/:checklistId/items/:itemId
export const patchChecklistItem = async (req, res, next) => {
  try {
    const item = await updateChecklistItem({
      itemId:     req.params.itemId,
      texto:      req.body.texto,
      completado: req.body.completado,
    });
    return ApiResponse.success(res, { item });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/.../checklists/:checklistId/items/:itemId
export const deleteChecklistItem_ = async (req, res, next) => {
  try {
    await deleteChecklistItem(req.params.itemId);
    return ApiResponse.success(res, null, 'Item eliminado');
  } catch (error) {
    next(error);
  }
};