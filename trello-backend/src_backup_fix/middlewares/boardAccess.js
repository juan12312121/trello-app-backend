import { ApiResponse } from '../utils/ApiResponse.js';
import { getMemberRole } from '../modules/boards/boards.service.js';

// Verifica que el usuario sea miembro del board
export const isBoardMember = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const userId      = req.user.id;

    const rol = await getMemberRole(boardId, userId);

    if (!rol) return ApiResponse.forbidden(res, 'No tienes acceso a este tablero');

    req.boardRole = rol;  // disponible en el controller
    next();
  } catch (error) {
    next(error);
  }
};

// Verifica que el usuario sea admin del board
export const isBoardAdmin = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const userId      = req.user.id;

    const rol = await getMemberRole(boardId, userId);

    if (rol !== 'admin') {
      return ApiResponse.forbidden(res, 'Se requiere rol de administrador');
    }

    req.boardRole = rol;
    next();
  } catch (error) {
    next(error);
  }
};