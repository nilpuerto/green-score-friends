export interface Player {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface Hole {
  number: number;
  par: number;
}

export interface Score {
  playerId: string;
  holeNumber: number;
  strokes: number;
}

export interface Match {
  id: string;
  name: string;
  course: string;
  holes: Hole[];
  players: Player[];
  scores: Score[];
  status: 'ongoing' | 'finished';
  createdAt: Date;
  winnerId?: string;
}

export type ScoreType = 'eagle' | 'birdie' | 'par' | 'bogey' | 'double-bogey' | 'other';

export interface MatchStats {
  totalStrokes: number;
  birdies: number;
  eagles: number;
  pars: number;
  bogeys: number;
  holesCompleted: number;
}

export interface UserStats {
  matchesPlayed: number;
  matchesWon: number;
  totalBirdies: number;
  totalEagles: number;
  bestScore: number;
  averageScore: number;
}
