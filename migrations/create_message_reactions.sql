-- Migration to add message reactions
CREATE TABLE IF NOT EXISTS board_message_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY UNQ_USER_MSG_EMOJI (message_id, user_id, emoji),
    FOREIGN KEY (message_id) REFERENCES board_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
