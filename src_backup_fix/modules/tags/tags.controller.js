import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getTagsByBoard,
  getTagsByCard,
  createTag,
  updateTag,
  deleteTag,
  assignTagToCard,
  removeTagFromCard,
  tagBelongsToBoard,
} from './tags.service.js';

// GET /api/v1/boards/:boardId/tags
export const getTags = async (req, res, next) => {
  try {
    const tags = await getTagsByBoard(req.params.boardId);
    return ApiResponse.success(res, { tags });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/boards/:boardId/lists/:listId/cards/:cardId/tags
export const getCardTags = async (req, res, next) => {
  try {
    const tags = await getTagsByCard(req.params.cardId);
    return ApiResponse.success(res, { tags });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/tags
export const postTag = async (req, res, next) => {
  try {
    const { nombre, color } = req.body;

    const tag = await createTag({
      nombre,
      color,
      boardId: req.params.boardId,
    });

    return ApiResponse.created(res, { tag }, 'Etiqueta creada');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/tags/:tagId
export const patchTag = async (req, res, next) => {
  try {
    const { nombre, color } = req.body;

    const tag = await updateTag(req.params.tagId, { nombre, color });
    return ApiResponse.success(res, { tag }, 'Etiqueta actualizada');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/boards/:boardId/tags/:tagId
export const deleteTag_ = async (req, res, next) => {
  try {
    await deleteTag(req.params.tagId);
    return ApiResponse.success(res, null, 'Etiqueta eliminada');
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/lists/:listId/cards/:cardId/tags/:tagId
export const postAssignTag = async (req, res, next) => {
  try {
    const { cardId, tagId, boardId } = req.params;

    // Verificar que el tag pertenece al mismo board
    const valid = await tagBelongsToBoard(tagId, boardId);
    if (!valid) {
      return ApiResponse.error(res, 'La etiqueta no pertenece a este tablero', 400);
    }

    await assignTagToCard({ cardId, tagId });
    return ApiResponse.success(res, null, 'Etiqueta asignada');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/boards/:boardId/lists/:listId/cards/:cardId/tags/:tagId
export const deleteRemoveTag = async (req, res, next) => {
  try {
    const { cardId, tagId } = req.params;

    await removeTagFromCard({ cardId, tagId });
    return ApiResponse.success(res, null, 'Etiqueta removida');
  } catch (error) {
    next(error);
  }
};