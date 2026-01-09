-- ============================================
-- GreenHunters - MATCHES TABLES (PostgreSQL)
-- Esquema de base de datos para partidas
-- ============================================

-- Tabla de Partidas
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  course VARCHAR(200) NOT NULL,
  creator_id VARCHAR(36) NOT NULL,
  num_holes INT NOT NULL DEFAULT 9,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing', -- 'ongoing' o 'finished'
  winner_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_matches_creator ON matches (creator_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches (created_at DESC);

-- Tabla de Hoyos de Partida (configuración de cada hoyo)
CREATE TABLE IF NOT EXISTS match_holes (
  id VARCHAR(36) PRIMARY KEY,
  match_id VARCHAR(36) NOT NULL,
  hole_number INT NOT NULL,
  par INT NOT NULL DEFAULT 4,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  UNIQUE (match_id, hole_number)
);

CREATE INDEX IF NOT EXISTS idx_match_holes_match ON match_holes (match_id);
CREATE INDEX IF NOT EXISTS idx_match_holes_number ON match_holes (match_id, hole_number);

-- Tabla de Participantes de Partida
CREATE TABLE IF NOT EXISTS match_players (
  id VARCHAR(36) PRIMARY KEY,
  match_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  position INT NULL, -- Posición final (1, 2, 3...)
  total_strokes INT DEFAULT 0,
  avg_per_hole DECIMAL(4,2) DEFAULT 0.00,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players (match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_user ON match_players (user_id);

-- Tabla de Puntuaciones (scores)
CREATE TABLE IF NOT EXISTS match_scores (
  id VARCHAR(36) PRIMARY KEY,
  match_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  hole_number INT NOT NULL,
  strokes INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (match_id, user_id, hole_number)
);

CREATE INDEX IF NOT EXISTS idx_match_scores_match ON match_scores (match_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_user ON match_scores (user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_hole ON match_scores (match_id, hole_number);

