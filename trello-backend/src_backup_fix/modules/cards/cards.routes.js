import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }      from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';
import { validate }     from '../../middlewares/validate.js';
import {
  getCards,
  getCard,
  postCard,
  patchCard,
  patchMoveCard,
  patchReorderCards,
  deleteCard_,
} from './cards.controller.js';

const router = Router({ mergeParams: true }); // lee :boardId y :listId del padre

router.use(protect);
router.use(isBoardMember); // todas las rutas de cards requieren ser miembro

const cardRules = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 300 }).withMessage('Máximo 300 caracteres'),
  body('prioridad')
    .optional()
    .isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida'),
  body('fecha_vencimiento')
    .optional()
    .isDate().withMessage('Fecha inválida — formato YYYY-MM-DD'),
  body('usuario_asignado_id')
    .optional()
    .isInt().withMessage('ID de usuario inválido'),
];

const moveRules = [
  body('listId')
    .notEmpty().isInt().withMessage('listId es obligatorio'),
  body('posicion')
    .notEmpty().isInt({ min: 0 }).withMessage('Posición inválida'),
];

const reorderRules = [
  body('cards')
    .isArray({ min: 1 }).withMessage('Debe ser un array'),
  body('cards.*.id')
    .isInt().withMessage('ID inválido'),
  body('cards.*.posicion')
    .isInt({ min: 0 }).withMessage('Posición inválida'),
];

// ── Rutas ─────────────────────────────────────────────
router.get('/',                    getCards);
router.post('/',                   cardRules,    validate, postCard);
router.patch('/reorder',           reorderRules, validate, patchReorderCards);
router.get('/:cardId',             getCard);
router.patch('/:cardId',           cardRules,    validate, patchCard);
router.patch('/:cardId/move',      moveRules,    validate, patchMoveCard);
router.delete('/:cardId',          deleteCard_);

export default router;