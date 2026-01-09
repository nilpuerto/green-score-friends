-- ============================================
-- GreenHunters - ACTUALIZACIÓN DE NIVELES
-- Actualizar niveles según requerimientos: 0=Rookie, 1=Amateur, 3=Pro, 5=PGA Player, 6=Tiger Woods
-- ============================================

-- Eliminar niveles antiguos que no se necesitan
DELETE FROM levels WHERE code NOT IN ('rookie', 'amateur', 'pro', 'pga-player', 'tiger-woods');

-- Actualizar niveles existentes
UPDATE levels SET 
  required_achievements_count = 0,
  display_name = 'Rookie'
WHERE code = 'rookie';

UPDATE levels SET 
  required_achievements_count = 1,
  display_name = 'Amateur'
WHERE code = 'amateur';

UPDATE levels SET 
  required_achievements_count = 3,
  display_name = 'Pro'
WHERE code = 'pro';

-- Actualizar o crear PGA Player
INSERT INTO levels (id, code, name, display_name, order_index, required_achievements_count)
VALUES (
  COALESCE((SELECT id FROM levels WHERE code = 'pga-player' LIMIT 1), gen_random_uuid()::text),
  'pga-player',
  'PGA Player',
  'PGA Player',
  4,
  5
)
ON CONFLICT (code) DO UPDATE SET
  required_achievements_count = 5,
  display_name = 'PGA Player',
  order_index = 4;

-- Actualizar Tiger Woods
UPDATE levels SET 
  required_achievements_count = 6,
  display_name = 'Tiger Woods',
  order_index = 5
WHERE code = 'tiger-woods';

-- Si no existe Tiger Woods, crearlo
INSERT INTO levels (id, code, name, display_name, order_index, required_achievements_count)
SELECT 
  gen_random_uuid()::text,
  'tiger-woods',
  'Tiger Woods',
  'Tiger Woods',
  5,
  6
WHERE NOT EXISTS (SELECT 1 FROM levels WHERE code = 'tiger-woods');

-- Actualizar level_id de usuarios según sus achievements
UPDATE users u
SET level_id = (
  SELECT l.id
  FROM levels l
  WHERE l.required_achievements_count <= (
    SELECT COUNT(*) 
    FROM user_achievements ua 
    WHERE ua.user_id = u.id
  )
  ORDER BY l.order_index DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 
  FROM user_achievements ua 
  WHERE ua.user_id = u.id
);

-- Si un usuario no tiene achievements, asegurar que tenga level_id de Rookie
UPDATE users u
SET level_id = (SELECT id FROM levels WHERE code = 'rookie' LIMIT 1)
WHERE level_id IS NULL;

