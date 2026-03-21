import { ApiResponse } from '../../utils/ApiResponse.js';
import { getActivityByBoard, getActivityByCard, getActivityByUser } from './activity.service.js';

// GET /api/v1/boards/:boardId/activity
export const getBoardActivity = async (req, res, next) => {
  try {
    const limit  = parseInt(req.query.limit)  || 50;
    const offset = parseInt(req.query.offset) || 0;

    const activity = await getActivityByBoard(req.params.boardId, { limit, offset });
    return ApiResponse.success(res, { activity });
  } catch (error) {
    next(error);
  }
};

export const getCardActivity = async (req, res, next) => {
  try {
    const activity = await getActivityByCard(req.params.cardId);
    return ApiResponse.success(res, { activity });
  } catch (error) {
    next(error);
  }
};

export const getMeActivity = async (req, res, next) => {
  try {
    const activity = await getActivityByUser(req.user.id);
    return ApiResponse.success(res, { activity });
  } catch (error) {
    next(error);
  }
};