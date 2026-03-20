import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,   // máx. conexiones simultáneas
  queueLimit: 0,
});

// Verifica la conexión al iniciar
export const testConnection = async () => {
  const conn = await pool.getConnection();
  console.log('✅ MySQL conectado correctamente');
  conn.release();
};

export default pool;