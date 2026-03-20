import express from 'express';
import { getBoardMessages } from './chat.controller.js';
import { protect } from '../../middlewares/auth.js';
import { isBoardMember } from '../../middlewares/boardAccess.js';

const router = express.Router({ mergeParams: true });

// GET /api/v1/boards/:boardId/messages
router.get('/', protect, isBoardMember, getBoardMessages);

export default router;
