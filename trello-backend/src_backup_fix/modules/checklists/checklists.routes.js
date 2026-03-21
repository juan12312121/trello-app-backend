import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }       from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';
import { validate }      from '../../middlewares/validate.js';
import {
  getChecklists,
  postChecklist,
  deleteChecklist_,
  postChecklistItem,
  patchChecklistItem,
  deleteChecklistItem_,
} from './checklists.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(isBoardMember);

const checklistRules = [
  body('titulo')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
];

const itemRules = [
  body('texto')
    .trim()
    .notEmpty().withMessage('El texto es obligatorio')
    .isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
];

const patchItemRules = [
  body('texto')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Máximo 500 caracteres'),
  body('completado')
    .optional()
    .isBoolean().withMessage('Debe ser true o false'),
];

// ── Checklists ────────────────────────────────────────
router.get('/',              getChecklists);
router.post('/',             checklistRules, validate, postChecklist);
router.delete('/:checklistId', deleteChecklist_);

// ── Items ─────────────────────────────────────────────
router.post('/:checklistId/items',            itemRules,      validate, postChecklistItem);
router.patch('/:checklistId/items/:itemId',   patchItemRules, validate, patchChecklistItem);
router.delete('/:checklistId/items/:itemId',  deleteChecklistItem_);

export default router;