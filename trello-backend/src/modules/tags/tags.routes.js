import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }      from '../../middlewares/auth.js';
import { isBoardMember, isBoardAdmin } from '../../middlewares/boardAccess.js';
import { validate }     from '../../middlewares/validate.js';
import {
  getTags,
  getCardTags,
  postTag,
  patchTag,
  deleteTag_,
  postAssignTag,
  deleteRemoveTag,
} from './tags.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);

const tagRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color inválido — formato #RRGGBB'),
];

const patchTagRules = [
  body('nombre')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color inválido — formato #RRGGBB'),
];

// ── Etiquetas del board ───────────────────────────────
router.get('/',          isBoardMember, getTags);
router.post('/',         isBoardAdmin,  tagRules,      validate, postTag);
router.patch('/:tagId',  isBoardAdmin,  patchTagRules, validate, patchTag);
router.delete('/:tagId', isBoardAdmin,  deleteTag_);

// ── Etiquetas de una card ─────────────────────────────
router.get('/card/:cardId',              isBoardMember, getCardTags);
router.post('/card/:cardId/:tagId',      isBoardMember, postAssignTag);
router.delete('/card/:cardId/:tagId',    isBoardMember, deleteRemoveTag);

export default router;