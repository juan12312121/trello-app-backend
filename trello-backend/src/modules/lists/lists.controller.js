import { ApiResponse } from '../../utils/ApiResponse.js';
import { io } from '../../app.js';
import {
  getListsByBoard,
  getListById,
  createList,
  updateList,
  reorderLists,
  archiveList,
  deleteList,
} from './lists.service.js';

// GET /api/v1/boards/:boardId/lists
export const getLists = async (req, res, next) => {
  try {
    const lists = await getListsByBoard(req.params.boardId);
    return ApiResponse.success(res, lists);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/lists
export const postList = async (req, res, next) => {
  try {
    const list = await createList({
      nombre:  req.body.nombre,
      boardId: req.params.boardId,
    });

    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.created(res, list, 'Lista creada exitosamente');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/lists/:listId
export const patchList = async (req, res, next) => {
  try {
    const list = await getListById(req.params.listId);
    if (!list) return ApiResponse.notFound(res, 'Lista no encontrada');

    const updated = await updateList(req.params.listId, { 
      nombre: req.body.nombre,
      archivada: req.body.archivada
    });
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, updated, 'Lista actualizada');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/lists/reorder
// Body: { lists: [{ id: 1, posicion: 0 }, { id: 2, posicion: 1 }] }
export const patchReorderLists = async (req, res, next) => {
  try {
    await reorderLists(req.body.lists);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, null, 'Listas reordenadas');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/lists/:listId/archive
export const patchArchiveList = async (req, res, next) => {
  try {
    const list = await getListById(req.params.listId);
    if (!list) return ApiResponse.notFound(res, 'Lista no encontrada');

    await archiveList(req.params.listId);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, null, 'Lista archivada');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/boards/:boardId/lists/:listId
export const deleteList_ = async (req, res, next) => {
  try {
    const list = await getListById(req.params.listId);
    if (!list) return ApiResponse.notFound(res, 'Lista no encontrada');

    await deleteList(req.params.listId);
    io.to('board_' + req.params.boardId).emit('board_updated');
    return ApiResponse.success(res, null, 'Lista eliminada');
  } catch (error) {
    next(error);
  }
};