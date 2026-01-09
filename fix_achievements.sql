-- ============================================
-- Script para corregir achievements desbloqueados incorrectamente
-- ============================================

-- Ver usuarios con sus victorias y achievements
SELECT 
  u.id,
  u.username,
  u.wins,
  u.matches_played,
  COUNT(ua.id) as achievements_count,
  STRING_AGG(a.code, ', ') as achievement_codes
FROM users u
LEFT JOIN user_achievements ua ON ua.user_id = u.id
LEFT JOIN achievements a ON a.id = ua.achievement_id
GROUP BY u.id, u.username, u.wins, u.matches_played
ORDER BY u.username;

-- Eliminar achievements incorrectos:
-- 1. Eliminar "first-win" si el usuario tiene más de 1 victoria
DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE code = 'first-win')
AND user_id IN (
  SELECT id FROM users WHERE wins > 1
);

-- 2. Eliminar "five-wins" si el usuario tiene menos de 5 victorias
DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE code = 'five-wins')
AND user_id IN (
  SELECT id FROM users WHERE wins < 5
);

-- 3. Eliminar "ten-matches" si el usuario tiene menos de 10 partidos
DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE code = 'ten-matches')
AND user_id IN (
  SELECT id FROM users WHERE matches_played < 10
);

-- 4. Eliminar "five-birdies" si el usuario tiene menos de 5 birdies
DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE code = 'five-birdies')
AND user_id IN (
  SELECT id FROM users WHERE birdies < 5
);

-- 5. Eliminar "hole-in-one" si el usuario tiene menos de 1 hole-in-one
DELETE FROM user_achievements
WHERE achievement_id IN (SELECT id FROM achievements WHERE code = 'hole-in-one')
AND user_id IN (
  SELECT id FROM users WHERE hole_in_one < 1
);

-- Después de ejecutar esto, los achievements se desbloquearán correctamente
-- cuando el usuario finalice un partido con la nueva lógica

