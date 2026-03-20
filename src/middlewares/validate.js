import { validationResult } from 'express-validator';
import { ApiResponse } from '../utils/ApiResponse.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map(({ path, msg }) => ({
      field: path,
      message: msg,
    }));

    return ApiResponse.error(res, 'Datos inválidos', 422, formatted);
  }

  next();
};