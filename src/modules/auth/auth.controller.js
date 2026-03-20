import jwt from 'jsonwebtoken';
import { ApiResponse } from '../../utils/ApiResponse.js';
import {
  findUserByEmail,
  findUserById,
  createUser,
  verifyPassword,
  updateUser,
} from './auth.service.js';

// ── Generar JWT ───────────────────────────────────────
// Función privada, solo la usa este archivo
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                          // payload — qué guardamos dentro del token
    process.env.JWT_SECRET,                  // firma secreta
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
  );
};

// ── POST /api/v1/auth/register ────────────────────────
export const register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si el email ya está registrado
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return ApiResponse.error(res, 'El email ya está registrado', 409);
    }

    const user  = await createUser({ nombre, email, password });
    const token = generateToken(user.id);

    return ApiResponse.created(res, { user, token }, 'Usuario registrado exitosamente');
  } catch (error) {
    next(error);  // pasa el error al errorHandler global
  }
};

// ── POST /api/v1/auth/login ───────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. ¿Existe el usuario?
    const user = await findUserByEmail(email);
    if (!user) {
      // Mismo mensaje para email y contraseña — no le digas al atacante cuál falló
      return ApiResponse.error(res, 'Credenciales inválidas', 401);
    }

    // 2. ¿La contraseña es correcta?
    const passwordOk = await verifyPassword(password, user.contrasena_hash);
    if (!passwordOk) {
      return ApiResponse.error(res, 'Credenciales inválidas', 401);
    }

    // 3. No devuelvas el hash en la respuesta
    const { contrasena_hash, ...userSafe } = user;
    const token = generateToken(user.id);

    return ApiResponse.success(res, { user: userSafe, token }, 'Login exitoso');
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1/auth/me ───────────────────────────────
// Requiere el middleware de auth (lo haremos en el siguiente paso)
export const getMe = async (req, res, next) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return ApiResponse.notFound(res, 'Usuario no encontrado');
    return ApiResponse.success(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    const user = await updateUser(req.user.id, { nombre, email, password });
    return ApiResponse.success(res, { user }, 'Perfil actualizado');
  } catch (error) {
    next(error);
  }
};