-- Actualizar el campo profile_image para soportar imágenes base64
-- Cambiar de VARCHAR(500) a TEXT para permitir imágenes más grandes

ALTER TABLE users 
ALTER COLUMN profile_image TYPE TEXT;

-- O si prefieres un límite más grande pero controlado:
-- ALTER TABLE users 
-- ALTER COLUMN profile_image TYPE VARCHAR(5000);

