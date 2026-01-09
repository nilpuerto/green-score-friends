-- ============================================
-- GreenHunters - SCRIPT DE LIMPIEZA DE DATOS
-- Elimina todos los partidos, puntuaciones y achievements de usuarios
-- PERO MANTIENE: usuarios, niveles, achievements base y estructura de tablas
-- ============================================

-- IMPORTANTE: Este script NO elimina:
-- - Tabla 'users' (usuarios)
-- - Tabla 'levels' (niveles)
-- - Tabla 'achievements' (achievements base)
-- - Estructura de las tablas

-- Eliminar en orden (respetando foreign keys):
-- 1. Puntuaciones de partidas
DELETE FROM match_scores;

-- 2. Participantes de partidas
DELETE FROM match_players;

-- 3. Hoyos de partidas
DELETE FROM match_holes;

-- 4. Partidas
DELETE FROM matches;

-- 5. Achievements desbloqueados por usuarios
DELETE FROM user_achievements;

-- 6. Resetear estadísticas de usuarios a valores por defecto
UPDATE users SET
  matches_played = 0,
  wins = 0,
  total_points = 0,
  total_holes = 0,
  avg_per_hole = 0.00,
  birdies = 0,
  hole_in_one = 0,
  current_streak = 0,
  max_streak = 0,
  level_id = (SELECT id FROM levels WHERE code = 'rookie' LIMIT 1),
  updated_at = CURRENT_TIMESTAMP;

-- Verificar que se han eliminado todos los datos
-- (Opcional: descomenta para verificar)
-- SELECT COUNT(*) as matches_count FROM matches;
-- SELECT COUNT(*) as scores_count FROM match_scores;
-- SELECT COUNT(*) as achievements_count FROM user_achievements;

