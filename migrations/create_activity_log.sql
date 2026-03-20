-- ============================================================
-- Tabla: activity_log
-- Registra la actividad de eventos dentro de un tablero.
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  board_id        INT            NOT NULL,
  usuario_id      INT            NULL,
  tipo_evento     VARCHAR(100)   NOT NULL,
  entidad_tipo    VARCHAR(50)    NULL      COMMENT 'Tipo de entidad afectada: card, list, board, etc.',
  entidad_id      INT            NULL      COMMENT 'ID de la entidad afectada',
  descripcion     TEXT           NULL      COMMENT 'Descripción legible del evento',
  datos_anteriores JSON          NULL      COMMENT 'Snapshot de datos antes del cambio',
  datos_nuevos     JSON          NULL      COMMENT 'Snapshot de datos después del cambio',
  fecha_creacion  TIMESTAMP      NOT NULL  DEFAULT CURRENT_TIMESTAMP,

  -- Relaciones
  CONSTRAINT fk_activity_board
    FOREIGN KEY (board_id)   REFERENCES boards(id)    ON DELETE CASCADE,
  CONSTRAINT fk_activity_user
    FOREIGN KEY (usuario_id) REFERENCES users(id)     ON DELETE SET NULL,

  -- Índices para consultas frecuentes
  INDEX idx_activity_board     (board_id),
  INDEX idx_activity_user      (usuario_id),
  INDEX idx_activity_entidad   (entidad_tipo, entidad_id),
  INDEX idx_activity_fecha     (fecha_creacion DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
