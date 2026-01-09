#!/bin/bash
# Script para configurar variables de entorno en Vercel
# Ejecutar: bash setup-vercel-env.sh

echo "Configurando variables de entorno en Vercel..."

# Verificar si está autenticado
if ! vercel whoami &> /dev/null; then
    echo "Por favor, autentícate primero: vercel login"
    exit 1
fi

# Configurar variables de entorno
echo "Añadiendo VITE_SUPABASE_URL..."
echo "https://iayyhkyxgugsusawxpox.supabase.co" | vercel env add VITE_SUPABASE_URL production

echo "Añadiendo VITE_SUPABASE_ANON_KEY..."
echo "sb_publishable_zbSb2XZNVl9P5nTBCAHXZw_4G9MvzQ9" | vercel env add VITE_SUPABASE_ANON_KEY production

echo "✅ Variables de entorno configuradas correctamente"

