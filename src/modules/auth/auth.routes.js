import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateMe } from './auth.controller.js';
import { validate } from '../../middlewares/validate.js';
import { protect } from '../../middlewares/auth.js';

const router = Router();

// ── Reglas de validación ──────────────────────────────
const registerRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('Entre 2 y 100 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),  // convierte a minúsculas, limpia espacios

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres')
    .matches(/\d/).withMessage('Debe contener al menos un número'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

// ── Rutas ─────────────────────────────────────────────
// validate(rules) corre las validaciones y corta si hay errores
router.post('/register', registerRules, validate, register);
router.post('/login',    loginRules,    validate, login);
router.get('/me',        protect,               getMe);  // protect = verificar JWT
router.patch('/me',     protect, [
  body('nombre').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).matches(/\d/),
], validate, updateMe);

export default router;