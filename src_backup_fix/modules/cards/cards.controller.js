import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getCardsByList,
  getCardById,
  createCard,
  updateCard,
  moveCard,
  reorderCards,
  deleteCard,
} from './cards.service.js';

// GET /api/v1/boards/:boardId/lists/:listId/cards
export const getCards = async (req, res, next) => {
  try {
    const cards = await getCardsByList(req.params.listId);
    return ApiResponse.success(res, { cards });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/boards/:boardId/lists/:listId/cards/:cardId
export const getCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    return ApiResponse.success(res, { card });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/lists/:listId/cards
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

    return ApiResponse.created(res, { card }, 'Tarjeta creada exitosamente');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/lists/:listId/cards/:cardId
export const patchCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    const updated = await updateCard(req.params.cardId, req.body);
    return ApiResponse.success(res, { card: updated }, 'Tarjeta actualizada');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/lists/:listId/cards/:cardId/move
// Body: { listId, posicion }
export const patchMoveCard = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    const moved = await moveCard(req.params.cardId, req.body);
    return ApiResponse.success(res, { card: moved }, 'Tarjeta movida');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/lists/:listId/cards/reorder
// Body: { cards: [{ id, posicion }] }
export const patchReorderCards = async (req, res, next) => {
  try {
    await reorderCards(req.body.cards);
    return ApiResponse.success(res, null, 'Tarjetas reordenadas');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/boards/:boardId/lists/:listId/cards/:cardId
export const deleteCard_ = async (req, res, next) => {
  try {
    const card = await getCardById(req.params.cardId);
    if (!card) return ApiResponse.notFound(res, 'Tarjeta no encontrada');

    await deleteCard(req.params.cardId);
    return ApiResponse.success(res, null, 'Tarjeta eliminada');
  } catch (error) {
    next(error);
  }
};