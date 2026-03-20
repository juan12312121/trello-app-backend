import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getCommentsByCard,
  createComment,
  updateComment,
  deleteComment,
} from './comments.service.js';

// GET /api/v1/boards/:boardId/lists/:listId/cards/:cardId/comments
export const getComments = async (req, res, next) => {
  try {
    const comments = await getCommentsByCard(req.params.cardId);
    return ApiResponse.success(res, { comments });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/lists/:listId/cards/:cardId/comments
export const postComment = async (req, res, next) => {
  try {
    const comment = await createComment({
      cardId: req.params.cardId,
      userId: req.user.id,
      texto:  req.body.texto,
    });

    return ApiResponse.created(res, { comment }, 'Comentario agregado');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/.../comments/:commentId
export const patchComment = async (req, res, next) => {
  try {
    const updated = await updateComment({
      commentId: req.params.commentId,
      userId:    req.user.id,
      texto:     req.body.texto,
    });

    if (!updated) {
      return ApiResponse.forbidden(res, 'No puedes editar este comentario');
    }

    return ApiResponse.success(res, null, 'Comentario actualizado');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/.../comments/:commentId
export const deleteComment_ = async (req, res, next) => {
  try {
    const deleted = await deleteComment({
      commentId: req.params.commentId,
      userId:    req.user.id,
    });

    if (!deleted) {
      return ApiResponse.forbidden(res, 'No puedes eliminar este comentario');
    }

    return ApiResponse.success(res, null, 'Comentario eliminado');
  } catch (error) {
    next(error);
  }
};