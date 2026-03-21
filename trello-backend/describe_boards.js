import 'dotenv/config';
import pool from './src/config/database.js';

async function describe() {
  try {
    const [rows] = await pool.query('DESCRIBE boards');
    rows.forEach(r => console.log(`${r.Field} | ${r.Type}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
describe();
