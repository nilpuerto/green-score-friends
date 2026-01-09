# Script PowerShell para configurar variables de entorno en Vercel
# Ejecutar: .\setup-vercel-env.ps1

Write-Host "Configurando variables de entorno en Vercel..." -ForegroundColor Green

# Verificar si está autenticado
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Por favor, autentícate primero: vercel login" -ForegroundColor Yellow
    exit 1
}

# Configurar variables de entorno
Write-Host "Añadiendo VITE_SUPABASE_URL..." -ForegroundColor Cyan
"https://iayyhkyxgugsusawxpox.supabase.co" | vercel env add VITE_SUPABASE_URL production

Write-Host "Añadiendo VITE_SUPABASE_ANON_KEY..." -ForegroundColor Cyan
"sb_publishable_zbSb2XZNVl9P5nTBCAHXZw_4G9MvzQ9" | vercel env add VITE_SUPABASE_ANON_KEY production

Write-Host "✅ Variables de entorno configuradas correctamente" -ForegroundColor Green

