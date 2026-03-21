import { getMessages } from './chat.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

export const getBoardMessages = async (req, res, next) => {
  try {
    const boardId = parseInt(req.params.boardId, 10);
    const messages = await getMessages(boardId);
    ApiResponse.success(res, messages);
  } catch (err) {
    console.error('ERROR en getBoardMessages:', err);
    next(err);
  }
};
