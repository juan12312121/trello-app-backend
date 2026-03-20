import pool from '../../config/database.js';
import bcrypt from 'bcryptjs';

// ── Buscar usuario por email ──────────────────────────
// Se usa en login y para verificar duplicados en register
export const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',  // ? = prepared statement, nunca concatenes strings
    [email]
  );
  return rows[0] ?? null;  // null si no existe
};

// ── Buscar usuario por ID ─────────────────────────────
export const findUserById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, nombre, email, foto_perfil, fecha_creacion FROM users WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
};

// ── Crear usuario ─────────────────────────────────────
export const createUser = async ({ nombre, email, password }) => {
  // bcrypt convierte "123456" en "$2a$10$xyz..." — nunca guardas la contraseña real
  const contrasena_hash = await bcrypt.hash(password, 10);

  const [result] = await pool.execute(
    'INSERT INTO users (nombre, email, contrasena_hash) VALUES (?, ?, ?)',
    [nombre, email, contrasena_hash]
  );

  // result.insertId es el ID que MySQL le asignó al nuevo registro
  return findUserById(result.insertId);
};

// ── Verificar contraseña ──────────────────────────────
// Compara lo que el usuario escribe contra el hash guardado
export const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};