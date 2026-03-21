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

export const updateUser = async (userId, { nombre, email, password, foto_perfil }) => {
  const fields = [];
  const params = [];

  if (nombre) { fields.push('nombre = ?'); params.push(nombre); }
  if (email) { fields.push('email = ?'); params.push(email); }
  if (foto_perfil !== undefined) { fields.push('foto_perfil = ?'); params.push(foto_perfil); }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    fields.push('contrasena_hash = ?');
    params.push(hash);
  }

  if (fields.length === 0) return findUserById(userId);

  params.push(userId);
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

  return findUserById(userId);
};