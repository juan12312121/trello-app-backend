import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }      from '../../middlewares/auth.js';
import { isBoardAdmin } from '../../middlewares/boardAccess.js';
import { validate }     from '../../middlewares/validate.js';
import {
  postInvitation,
  getInvitations,
  getMyInvitations,
  patchAccept,
  patchReject
} from './invitations.controller.js';

// Router general (para /api/v1/invitations)
export const globalInvitationRouter = Router();

globalInvitationRouter.use(protect);
globalInvitationRouter.get('/pending', getMyInvitations);
globalInvitationRouter.patch('/:id/accept', patchAccept);
globalInvitationRouter.patch('/:id/reject', patchReject);


// Router a nivel de tablero (para /api/v1/boards/:boardId/invitations)
export const boardInvitationRouter = Router({ mergeParams: true });

boardInvitationRouter.use(protect);

const inviteRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('rol')
    .optional({ nullable: true })
    .isIn(['admin', 'editor', 'comentador', 'viewer'])
    .withMessage('Rol inválido'),
];

boardInvitationRouter.get('/', isBoardAdmin, getInvitations);
boardInvitationRouter.post('/', isBoardAdmin, inviteRules, validate, postInvitation);
