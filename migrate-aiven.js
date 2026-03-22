import mysql from 'mysql2/promise';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const config = {
  host: process.env.DB_HOST || 'mysql-9f8b9b1-trinoflowrs-969e.b.aivencloud.com',
  port: process.env.DB_PORT || 20313,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'defaultdb',
  ssl: { rejectUnauthorized: false }
};

async function migrate() {
  let conn;
  try {
    console.log('--- Iniciando Migración en Aiven ---');
    conn = await mysql.createConnection(config);
    console.log('✅ Conectado a Aiven MySQL');

    // 1. Agregar columna TOKEN a boards
    const [cols] = await conn.execute("SHOW COLUMNS FROM boards LIKE 'token'");
    if (cols.length === 0) {
      console.log('Agregando columna token a boards...');
      await conn.execute("ALTER TABLE boards ADD COLUMN token VARCHAR(50) UNIQUE AFTER id");
    }

    // 2. Poblar tokens vacíos
    const [boards] = await conn.execute("SELECT id FROM boards WHERE token IS NULL");
    if (boards.length > 0) {
      console.log(`Poblando tokens para ${boards.length} tableros...`);
      for (const b of boards) {
        const token = crypto.randomBytes(6).toString('hex');
        await conn.execute("UPDATE boards SET token = ? WHERE id = ?", [token, b.id]);
      }
    }

    // 3. Crear tablas si no existen
    const migrationsDir = './migrations';
    const files = [
        'create_activity_log.sql',
        'create_board_invitations.sql',
        'create_board_messages.sql',
        'create_message_reactions.sql'
    ];

    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        console.log(`Ejecutando migración: ${file}...`);
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        for (const s of statements) {
            try {
                await conn.execute(s);
            } catch (e) {
                if (e.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`- La tabla de ${file} ya existe.`);
                } else {
                    console.warn(`- Aviso en ${file}: ${e.message}`);
                }
            }
        }
    }

    console.log('✅ Migración completada con éxito en Aiven');
  } catch (error) {
    console.error('❌ Error migrando Aiven:', error.message);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
}

migrate();
