import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  getBoardMembers,
  addMember,
  updateMemberRole,
  removeMember,
} from './members.service.js';

// GET /api/v1/boards/:boardId/members
export const getMembers = async (req, res, next) => {
  try {
    const members = await getBoardMembers(req.params.boardId);
    return ApiResponse.success(res, { members });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/boards/:boardId/members
export const postMember = async (req, res, next) => {
  try {
    const { email, rol } = req.body;

    const user = await addMember({
      boardId:   req.params.boardId,
      email,
      rolNombre: rol,
    });

    if (!user) {
      return ApiResponse.notFound(res, 'Usuario no encontrado con ese email');
    }

    return ApiResponse.created(res, { user }, 'Miembro agregado exitosamente');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/boards/:boardId/members/:userId
export const patchMemberRole = async (req, res, next) => {
  try {
    // No puedes cambiar tu propio rol
    if (req.params.userId == req.user.id) {
      return ApiResponse.error(res, 'No puedes cambiar tu propio rol', 400);
    }

    const updated = await updateMemberRole({
      boardId:   req.params.boardId,
      userId:    req.params.userId,
      rolNombre: req.body.rol,
    });

    if (!updated) return ApiResponse.notFound(res, 'Rol no encontrado');

    return ApiResponse.success(res, null, 'Rol actualizado');
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/boards/:boardId/members/:userId
export const deleteMember = async (req, res, next) => {
  try {
    // No puedes eliminarte a ti mismo
    if (req.params.userId == req.user.id) {
      return ApiResponse.error(res, 'No puedes eliminarte a ti mismo', 400);
    }

    await removeMember({
      boardId: req.params.boardId,
      userId:  req.params.userId,
    });

    return ApiResponse.success(res, null, 'Miembro eliminado');
  } catch (error) {
    next(error);
  }
};