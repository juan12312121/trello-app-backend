import { Router } from 'express';
import { body }   from 'express-validator';
import { protect } from '../../middlewares/auth.js';
import { isBoardMember, isBoardAdmin } from '../../middlewares/boardAccess.js';
import { validate } from '../../middlewares/validate.js';
import { upload, uploadMemory } from '../../config/multer.js';
import {
  getBoards,
  getBoard,
  postBoard,
  patchBoard,
  patchArchiveBoard,
  deleteBoard_,
} from './boards.controller.js';

const router = Router();

// Todas las rutas de boards requieren estar autenticado
router.use(protect);

const postBoardRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Máximo 1000 caracteres'),
];

const patchBoardRules = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Máximo 1000 caracteres'),
];

// ── Rutas ─────────────────────────────────────────────
router.get('/',                              getBoards);
router.post('/',       postBoardRules, validate, postBoard);

router.get('/:boardId',         isBoardMember, getBoard);
router.patch('/:boardId',       isBoardAdmin,  uploadMemory.single('portada'), patchBoardRules, validate, patchBoard);
router.patch('/:boardId/archive', isBoardAdmin, patchArchiveBoard);
router.delete('/:boardId',      isBoardAdmin,  deleteBoard_);

export default router;