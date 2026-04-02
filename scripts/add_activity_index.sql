-- Migración: índices compuestos en activity_log para corregir "Out of sort memory"
-- Compatible con MySQL 8.0 (la sintaxis IF NOT EXISTS es solo de MariaDB)
-- La base de datos en producción se llama "defaultdb" (base administrada en la nube)

-- Índice 1: para GET /api/v1/boards/:boardId/activity (la consulta más frecuente)
ALTER TABLE activity_log
  ADD INDEX idx_activity_board_fecha (board_id, fecha_creacion);

-- Índice 2: para consultas filtradas por card/entidad
ALTER TABLE activity_log
  ADD INDEX idx_activity_entidad (entidad_tipo, entidad_id, fecha_creacion);

-- Verificar que se crearon correctamente
SHOW INDEX FROM activity_log;
