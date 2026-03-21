import { ApiResponse } from '../../utils/ApiResponse.js';
import { io } from '../../app.js';
import {
  getCardsByList,
  getCardById,
  createCard,
  updateCard,
  moveCard,
  reorderCards,
  deleteCard,
  getCardsAssignedToMe,
} from './cards.service.js';

// GET /api/v1/boards/:boardId/lists/:listId/cards
export const getCards = async (req, res, next) => {
  try {
    const cards = await getCardsByList(req.params.listId);
    return ApiResponse.success(res, cards);
  } catch (error) {
    next(error);
  }
};

export const getCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    return ApiResponse.success(res, card);
  } catch (error) {
    next(error);
  }
};

export const postCard = async (req, res, next) => {
  try {
    const { titulo, descripcion, prioridad, fecha_vencimiento, usuario_asignado_id } = req.body;

    const card = await createCard({
      titulo,
      descripcion,
      prioridad,
      fecha_vencimiento,
      listId: req.params.listId,
      userId: usuario_asignado_id,
    });

    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.created(res, card, 'Tarjeta creada exitosamente');
  } catch (error) {
    next(error);
  }
};

export const patchCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    const updated = await updateCard(req.params.cardId, req.body);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, updated, 'Tarjeta actualizada');
  } catch (error) {
    next(error);
  }
};

export const patchMoveCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    const moved = await moveCard(req.params.cardId, req.body);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, moved, 'Tarjeta movida');
  } catch (error) {
    next(error);
  }
};

export const patchReorderCards = async (req, res, next) => {
  try {
    await reorderCards(req.body.cards);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, null, 'Tarjetas reordenadas');
  } catch (error) {
    next(error);
  }
};

export const deleteCard_ = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    await deleteCard(req.params.cardId);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, null, 'Tarjeta eliminada');
  } catch (error) {
    next(error);
  }
};

export const getMeAssignedCards = async (req, res, next) => {
  try {
    const cards = await getCardsAssignedToMe(req.user.id);
    return ApiResponse.success(res, cards);
  } catch (error) {
    next(error);
  }
};