import { Router } from 'express';
import { body }   from 'express-validator';
import { protect }      from '../../middlewares/auth.js';
import { isBoardMember, isBoardAdmin } from '../../middlewares/boardAccess.js';
import { validate }     from '../../middlewares/validate.js';
import {
  getMembers,
  postMember,
  patchMemberRole,
  deleteMember,
} from './members.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);

const addMemberRules = [
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('rol')
    .optional()
    .isIn(['admin', 'editor', 'comentador', 'viewer'])
    .withMessage('Rol inválido'),
];

const rolRules = [
  body('rol')
    .notEmpty()
    .isIn(['admin', 'editor', 'comentador', 'viewer'])
    .withMessage('Rol inválido'),
];

router.get('/',            isBoardMember, getMembers);
router.post('/',           isBoardAdmin,  addMemberRules, validate, postMember);
router.patch('/:userId',   isBoardAdmin,  rolRules,       validate, patchMemberRole);
router.delete('/:userId',  isBoardAdmin,  deleteMember);

export default router;