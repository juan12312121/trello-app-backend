import pool from '../../config/database.js';

export const saveMessage = async (boardId, userId, texto) => {
  const [result] = await pool.query(
    'INSERT INTO board_messages (board_id, user_id, texto) VALUES (?, ?, ?)',
    [boardId, userId, texto]
  );
  return result.insertId;
};

export const getMessages = async (boardId, limit = 100) => {
  const [rows] = await pool.query(
    `SELECT 
       m.id,
       m.board_id,
       m.user_id   AS userId,
       u.nombre    AS userName,
       m.texto     AS text,
       m.created_at AS timestamp,
       (SELECT JSON_ARRAYAGG(JSON_OBJECT('emoji', r.emoji, 'userId', r.user_id)) 
        FROM board_message_reactions r WHERE r.message_id = m.id) AS reactions
     FROM board_messages m
     LEFT JOIN users u ON u.id = m.user_id
     WHERE m.board_id = ?
     ORDER BY m.created_at ASC
     LIMIT ?`,
    [boardId, limit]
  );
  return rows.map(r => ({ ...r, reactions: r.reactions || [] }));
};

export const toggleReaction = async (messageId, userId, emoji) => {
  // Check if already exists
  const [existing] = await pool.query(
    'SELECT id FROM board_message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?',
    [messageId, userId, emoji]
  );

  if (existing.length > 0) {
    await pool.query('DELETE FROM board_message_reactions WHERE id = ?', [existing[0].id]);
    return { action: 'removed' };
  } else {
    await pool.query(
      'INSERT INTO board_message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
      [messageId, userId, emoji]
    );
    return { action: 'added' };
  }
};
