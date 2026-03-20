-- Migration: create board_messages table
CREATE TABLE IF NOT EXISTS board_messages (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  board_id      INT NOT NULL,
  user_id       INT NOT NULL,
  texto         TEXT NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bm_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  CONSTRAINT fk_bm_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
