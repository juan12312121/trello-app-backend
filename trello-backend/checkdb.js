import 'dotenv/config';
import pool from './src/config/database.js';

import fs from 'fs';

async function check() {
  try {
    const [c] = await pool.execute('DESCRIBE comments');
    fs.writeFileSync('out.json', JSON.stringify(c, null, 2));
  } catch (e) {
    console.log('Error comments:', e.message);
  }
  process.exit(0);
}

check();
