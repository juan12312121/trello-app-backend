import { ApiResponse } from '../../utils/ApiResponse.js';
import { io } from '../../app.js';
import {
  getUserBoards,
  getBoardById,
  createBoard,
  updateBoard,
  archiveBoard,
  deleteBoard,
} from './boards.service.js';

// GET /api/v1/boards
export const getBoards = async (req, res, next) => {
  try {
    const boards = await getUserBoards(req.user.id);
    return ApiResponse.success(res, boards);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/boards/:boardId
export const getBoard = async (req, res, next) => {
  try {
    const board = await getBoardById(req.params.boardId);
    if (!board) return ApiResponse.notFound(res, 'Tablero no encontrado');

    return ApiResponse.success(res, board);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards
export const postBoard = async (req, res, next) => {
  try {
    const { nombre, descripcion, portada } = req.body;
    const board = await createBoard({ nombre, descripcion, portada, userId: req.user.id });

    return ApiResponse.created(res, board, 'Tablero creado exitosamente');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId
export const patchBoard = async (req, res, next) => {
  try {
    let { nombre, descripcion, portada, archivado } = req.body;

    // Si se subió un archivo, lo convertimos a base64 para guardar en la BD
    // (evita problemas con filesystem efímero de Render)
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      portada = `url(data:${mimeType};base64,${base64})`;
    }

    const board = await updateBoard(req.params.boardId, { nombre, descripcion, portada, archivado });
    io.to(`board_${req.params.boardId}`).emit('board:bg_changed', { portada: board.portada });
    return ApiResponse.success(res, board, 'Tablero actualizado');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/archive
export const patchArchiveBoard = async (req, res, next) => {
  try {
    await archiveBoard(req.params.boardId);
    return ApiResponse.success(res, null, 'Tablero archivado');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/boards/:boardId
export const deleteBoard_ = async (req, res, next) => {
  try {
    await deleteBoard(req.params.boardId);
    return ApiResponse.success(res, null, 'Tablero eliminado');
  } catch (error) {
    next(error);
  }
};