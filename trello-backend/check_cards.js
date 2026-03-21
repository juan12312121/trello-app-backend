import 'dotenv/config';
import pool from './src/config/database.js';

async function checkCards() {
  try {
    const [rows] = await pool.query('SELECT * FROM cards');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkCards();
