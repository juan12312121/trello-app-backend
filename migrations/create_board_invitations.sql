-- ============================================================
-- Tabla: board_invitations
-- Sistema de invitaciones pendientes a tableros
-- ============================================================

CREATE TABLE IF NOT EXISTS board_invitations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  board_id        INT            NOT NULL,
  invitado_por    INT            NOT NULL    COMMENT 'Usuario que envía la invitación',
  invitado_email  VARCHAR(150)   NOT NULL    COMMENT 'Email del usuario invitado',
  invitado_id     INT            NULL        COMMENT 'ID del usuario invitado (si ya existe en el sistema)',
  rol             VARCHAR(50)    NOT NULL    DEFAULT 'editor',
  estado          ENUM('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
  fecha_creacion  TIMESTAMP      NOT NULL    DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta TIMESTAMP      NULL,

  CONSTRAINT fk_inv_board
    FOREIGN KEY (board_id)     REFERENCES boards(id)  ON DELETE CASCADE,
  CONSTRAINT fk_inv_invitador
    FOREIGN KEY (invitado_por) REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_inv_invitado
    FOREIGN KEY (invitado_id)  REFERENCES users(id)   ON DELETE CASCADE,

  -- Un usuario solo puede tener una invitación pendiente por tablero
  UNIQUE KEY uq_inv_pending (board_id, invitado_email, estado),

  INDEX idx_inv_email   (invitado_email),
  INDEX idx_inv_user    (invitado_id),
  INDEX idx_inv_estado  (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
