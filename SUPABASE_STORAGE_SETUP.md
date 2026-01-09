# Configuración de Supabase Storage para Fotos de Perfil

Para que las fotos de perfil funcionen, necesitas configurar un bucket en Supabase Storage.

## Pasos para configurar:

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el menú lateral
3. Haz clic en **"New bucket"**
4. Crea un bucket con el nombre: **`avatars`**
5. Configura el bucket como:
   - **Public**: Sí (para que las imágenes sean accesibles públicamente)
   - **File size limit**: 5MB (o el que prefieras)
   - **Allowed MIME types**: `image/*`

## Políticas de Seguridad (RLS)

Si tienes RLS habilitado, necesitarás añadir políticas para permitir:

```sql
-- Permitir a todos leer las imágenes
CREATE POLICY "Allow public read access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir sus propias imágenes
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Permitir a usuarios autenticados actualizar sus propias imágenes
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Permitir a usuarios autenticados eliminar sus propias imágenes
CREATE POLICY "Allow users to delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

## Alternativa: Sin Storage

Si prefieres no usar Supabase Storage, puedes:
- Guardar URLs externas directamente en `profile_image` en la tabla `users`
- O usar un servicio de almacenamiento externo (Cloudinary, AWS S3, etc.)

El código actualmente tiene un fallback que usa base64 si el upload falla, pero esto no es ideal para producción.

