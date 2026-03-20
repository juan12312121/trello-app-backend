import { Router } from 'express';
import { protect }       from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';
import { getBoardActivity, getCardActivity } from './activity.controller.js';

const router = Router({ mergeParams: true });

router.use(protect);
router.use(isBoardMember);

router.get('/', getBoardActivity);

export default router;