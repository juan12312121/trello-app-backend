import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  createInvitation,
  getMyPendingInvitations,
  acceptInvitation,
  rejectInvitation,
  getBoardInvitations,
} from './invitations.service.js';

// POST /api/v1/boards/:boardId/invitations
// Enviar una invitación a un usuario por email
export const postInvitation = async (req, res, next) => {
  try {
    const { email, rol } = req.body;
    const result = await createInvitation({
      boardId:     req.params.boardId,
      invitadoPor: req.user.id,
      email,
      rol: rol || 'editor',
    });

    if (result.error) {
      return ApiResponse.error(res, result.error, 400);
    }

    return ApiResponse.created(res, result.invitation, 'Invitación enviada');
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/boards/:boardId/invitations
// Ver invitaciones enviadas en un tablero
export const getInvitations = async (req, res, next) => {
  try {
    const invitations = await getBoardInvitations(req.params.boardId);
    return ApiResponse.success(res, invitations);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/invitations/pending
// Obtener mis invitaciones pendientes (para el dashboard)
export const getMyInvitations = async (req, res, next) => {
  try {
    const invitations = await getMyPendingInvitations(req.user.id);
    return ApiResponse.success(res, invitations);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/invitations/:id/accept
// Aceptar una invitación
export const patchAccept = async (req, res, next) => {
  try {
    const result = await acceptInvitation(req.params.id, req.user.id);

    if (result.error) {
      return ApiResponse.error(res, result.error, 400);
    }

    return ApiResponse.success(res, { boardId: result.boardId }, 'Invitación aceptada');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/invitations/:id/reject
// Rechazar una invitación
export const patchReject = async (req, res, next) => {
  try {
    const result = await rejectInvitation(req.params.id, req.user.id);

    if (result.error) {
      return ApiResponse.error(res, result.error, 400);
    }

    return ApiResponse.success(res, null, 'Invitación rechazada');
  } catch (error) {
    next(error);
  }
};
