import 'dotenv/config';
import pool from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/create_board_invitations.sql'), 'utf-8');
        // split by ';' to execute multiple statements
        const queries = sql.split(';').filter(q => q.trim());
        for (let q of queries) {
            await pool.query(q);
        }
        console.log("✅ Migración de invitaciones completada.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error en la migración:", err.message);
        process.exit(1);
    }
};

runMigration();
