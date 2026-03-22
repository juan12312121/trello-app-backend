-- La columna portada ahora almacena datos base64 que pueden ser muy grandes.
-- Cambiar de VARCHAR a MEDIUMTEXT para soportar imágenes codificadas en base64.
ALTER TABLE boards MODIFY COLUMN portada MEDIUMTEXT NULL;
