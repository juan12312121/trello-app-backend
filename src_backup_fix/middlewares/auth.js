import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/ApiResponse.js';
import pool from '../config/database.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, 'Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];

    // Verifica firma y expiración
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verifica que el usuario siga existiendo en la BD
    const [rows] = await pool.execute(
      'SELECT id, nombre, email, foto_perfil FROM users WHERE id = ? AND activo = TRUE',
      [decoded.id]
    );

    if (!rows[0]) {
      return ApiResponse.unauthorized(res, 'Usuario no encontrado');
    }

    req.user = rows[0];  // disponible en todos los controllers
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expirado');
    }
    return ApiResponse.unauthorized(res, 'Token inválido');
  }
};