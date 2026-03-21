import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }       from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';
import { validate }      from '../../middlewares/validate.js';
import {
  getComments,
  postComment,
  patchComment,
  deleteComment_,
} from './comments.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(isBoardMember);

const commentRules = [
  body('texto')
    .trim()
    .notEmpty().withMessage('El comentario no puede estar vacío')
    .isLength({ max: 5000 }).withMessage('Máximo 5000 caracteres'),
];

router.get('/',                  getComments);
router.post('/',                 commentRules, validate, postComment);
router.patch('/:commentId',      commentRules, validate, patchComment);
router.delete('/:commentId',     deleteComment_);

export default router;