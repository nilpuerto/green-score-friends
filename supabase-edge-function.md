# Supabase Edge Function para Verificar Contraseña

Para implementar la verificación de contraseñas de forma segura, crea esta función edge en Supabase:

## Crear Edge Function: verify-password

En Supabase Dashboard:
1. Ve a Edge Functions
2. Crea una nueva función llamada `verify-password`
3. Pega este código:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar usuario
    const { data: user, error } = await supabaseClient
      .from('users')
      .select('id, username, password_hash, level_id, profile_image')
      .eq('username', username)
      .single();

    if (error || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario no encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar contraseña
    const passwordMatch = await compare(password, user.password_hash);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Contraseña incorrecta' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener nivel
    let levelName = 'Rookie';
    if (user.level_id) {
      const { data: level } = await supabaseClient
        .from('levels')
        .select('display_name')
        .eq('id', user.level_id)
        .single();
      if (level) {
        levelName = level.display_name;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          name: user.username,
          username: user.username,
          level: levelName,
          profile_image: user.profile_image || undefined,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Alternativa: Usar directamente en el cliente (menos seguro pero más simple)

Por ahora, el código usa bcryptjs en el cliente. Si no funciona, implementa la función edge arriba.

