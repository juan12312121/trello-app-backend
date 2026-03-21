import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }       from '../../middlewares/auth.js';
import { isBoardMember, isBoardAdmin } from '../../middlewares/boardAccess.js';
import { validate }      from '../../middlewares/validate.js';
import {
  getLists,
  postList,
  patchList,
  patchReorderLists,
  patchArchiveList,
  deleteList_,
} from './lists.controller.js';

const router = Router({ mergeParams: true }); // mergeParams para leer :boardId del padre

router.use(protect);

const listRules = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio si se envía')
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
  body('archivada')
    .optional()
    .isBoolean().withMessage('El campo archivada debe ser booleano'),
];

const reorderRules = [
  body('lists')
    .isArray({ min: 1 }).withMessage('Debe ser un array'),
  body('lists.*.id')
    .isInt().withMessage('ID inválido'),
  body('lists.*.posicion')
    .isInt({ min: 0 }).withMessage('Posición inválida'),
];

// ── Rutas ─────────────────────────────────────────────
router.get('/',                isBoardMember, getLists);
router.post('/',               isBoardMember, listRules,    validate, postList);
router.patch('/reorder',       isBoardMember, reorderRules, validate, patchReorderLists);
router.patch('/:listId',       isBoardMember, listRules,    validate, patchList);
router.patch('/:listId/archive', isBoardAdmin, patchArchiveList);
router.delete('/:listId',      isBoardAdmin,  deleteList_);

export default router;