-- ============================================
-- GreenHunters - DATABASE SCHEMA (PostgreSQL)
-- Esquema de base de datos para usuarios
-- ============================================

-- Tabla de Niveles/Rangos del Jugador
CREATE TABLE IF NOT EXISTS levels (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  order_index INT NOT NULL UNIQUE,
  required_achievements_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_level_order ON levels (order_index);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_image TEXT NULL,
  level_id VARCHAR(36) DEFAULT NULL,
  matches_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  total_points INT DEFAULT 0,
  avg_per_hole DECIMAL(4,2) DEFAULT 0.00,
  total_holes INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  max_streak INT DEFAULT 0,
  birdies INT DEFAULT 0,
  hole_in_one INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_level_id ON users (level_id);

-- Tabla de Achievements (Medalles/Objectius disponibles)
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  icon_type VARCHAR(50) DEFAULT 'trophy',
  color VARCHAR(20) DEFAULT 'eagle',
  required_value INT DEFAULT 1,
  unlocks_level_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (unlocks_level_id) REFERENCES levels(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_code ON achievements (code);
CREATE INDEX IF NOT EXISTS idx_unlocks_level ON achievements (unlocks_level_id);

-- Tabla de relación Usuario-Achievements (qué achievements tiene desbloqueados cada usuario)
CREATE TABLE IF NOT EXISTS user_achievements (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  achievement_id VARCHAR(36) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_id ON user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_id ON user_achievements (achievement_id);

-- Insertar niveles iniciales (orden de progresión)
INSERT INTO levels (id, code, name, display_name, order_index, required_achievements_count) VALUES
(gen_random_uuid()::text, 'rookie', 'Rookie', 'Rookie', 1, 0),
(gen_random_uuid()::text, 'amateur', 'Amateur', 'Amateur', 2, 1),
(gen_random_uuid()::text, 'pro', 'Pro', 'Pro', 3, 3),
(gen_random_uuid()::text, 'pda-player', 'PDA Player', 'PDA Player', 4, 5),
(gen_random_uuid()::text, 'expert', 'Expert', 'Expert', 5, 7),
(gen_random_uuid()::text, 'master', 'Master', 'Master', 6, 10),
(gen_random_uuid()::text, 'champion', 'Champion', 'Champion', 7, 15),
(gen_random_uuid()::text, 'legend', 'Legend', 'Legend', 8, 20),
(gen_random_uuid()::text, 'tiger-woods', 'Tiger Woods', 'Tiger Woods', 9, 30)
ON CONFLICT (code) DO NOTHING;

-- Insertar achievements iniciales
-- Nota: Los achievements que desbloquean niveles deben tener el unlocks_level_id correspondiente
INSERT INTO achievements (id, code, name, description, icon_type, color, required_value, unlocks_level_id) VALUES
(gen_random_uuid()::text, 'first-win', 'Primera Victòria', 'Guanya el teu primer partit', 'trophy', 'eagle', 1, 
  (SELECT id FROM levels WHERE code = 'amateur' LIMIT 1)),
(gen_random_uuid()::text, 'five-wins', '5 Victòries', 'Guanya 5 partits', 'award', 'success', 5,
  (SELECT id FROM levels WHERE code = 'pro' LIMIT 1)),
(gen_random_uuid()::text, 'streak-3', 'Ratxa de 3', 'Guanya 3 partits seguits', 'flame', 'warning', 3, NULL),
(gen_random_uuid()::text, 'ten-matches', '10 Partits', 'Juga 10 partits', 'target', 'primary', 10,
  (SELECT id FROM levels WHERE code = 'pda-player' LIMIT 1)),
(gen_random_uuid()::text, 'five-birdies', '5 Birdies', 'Fes 5 birdies en total', 'zap', 'success', 5, NULL),
(gen_random_uuid()::text, 'hole-in-one', 'Hole in One', 'Fes un hole in one', 'star', 'eagle', 1,
  (SELECT id FROM levels WHERE code = 'expert' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- Asignar nivel inicial (Rookie) a todos los usuarios existentes que no tengan nivel
UPDATE users SET level_id = (SELECT id FROM levels WHERE code = 'rookie' LIMIT 1) WHERE level_id IS NULL;

-- Índices compuestos para búsquedas de ranking
CREATE INDEX IF NOT EXISTS idx_ranking_wins ON users (wins DESC, matches_played DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_avg ON users (avg_per_hole ASC);
