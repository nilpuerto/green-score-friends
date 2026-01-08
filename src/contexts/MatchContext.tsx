import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Match, Player, Hole, Score } from '@/types/golf';

interface MatchContextType {
  matches: Match[];
  activeMatch: Match | null;
  createMatch: (name: string, course: string, holes: Hole[], players: Player[]) => Match;
  setActiveMatch: (match: Match | null) => void;
  updateScore: (matchId: string, playerId: string, holeNumber: number, strokes: number) => void;
  finishMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;
  getMatchById: (id: string) => Match | undefined;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

// defaultPlayers ya no se usa - los jugadores se crean dinámicamente en CreateMatchModal

const sampleMatches: Match[] = [];

export const MatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [matches, setMatches] = useState<Match[]>(sampleMatches);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const createMatch = useCallback((name: string, course: string, holes: Hole[], players: Player[]): Match => {
    const newMatch: Match = {
      id: crypto.randomUUID(),
      name,
      course,
      holes,
      players,
      scores: [],
      status: 'ongoing',
      createdAt: new Date(),
    };
    setMatches(prev => [newMatch, ...prev]);
    return newMatch;
  }, []);

  const updateScore = useCallback((matchId: string, playerId: string, holeNumber: number, strokes: number) => {
    setMatches(prev => prev.map(match => {
      if (match.id !== matchId) return match;
      
      const existingScoreIndex = match.scores.findIndex(
        s => s.playerId === playerId && s.holeNumber === holeNumber
      );
      
      let newScores: Score[];
      if (existingScoreIndex >= 0) {
        newScores = [...match.scores];
        newScores[existingScoreIndex] = { playerId, holeNumber, strokes };
      } else {
        newScores = [...match.scores, { playerId, holeNumber, strokes }];
      }
      
      return { ...match, scores: newScores };
    }));
    
    // Also update activeMatch if it's the same
    if (activeMatch?.id === matchId) {
      setActiveMatch(prev => {
        if (!prev) return null;
        const existingScoreIndex = prev.scores.findIndex(
          s => s.playerId === playerId && s.holeNumber === holeNumber
        );
        
        let newScores: Score[];
        if (existingScoreIndex >= 0) {
          newScores = [...prev.scores];
          newScores[existingScoreIndex] = { playerId, holeNumber, strokes };
        } else {
          newScores = [...prev.scores, { playerId, holeNumber, strokes }];
        }
        
        return { ...prev, scores: newScores };
      });
    }
  }, [activeMatch]);

  const finishMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.map(match => {
      if (match.id !== matchId) return match;
      
      // Calculate winner
      const playerTotals = match.players.map(player => {
        const total = match.scores
          .filter(s => s.playerId === player.id)
          .reduce((sum, s) => sum + s.strokes, 0);
        return { playerId: player.id, total };
      });
      
      const winner = playerTotals.reduce((min, p) => 
        p.total < min.total ? p : min
      , playerTotals[0]);
      
      return { ...match, status: 'finished', winnerId: winner?.playerId };
    }));
  }, []);

  const getMatchById = useCallback((id: string) => {
    return matches.find(m => m.id === id);
  }, [matches]);

  const deleteMatch = useCallback((matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));
    // Si el match activo es el que se elimina, limpiarlo
    if (activeMatch?.id === matchId) {
      setActiveMatch(null);
    }
  }, [activeMatch]);

  return (
    <MatchContext.Provider value={{
      matches,
      activeMatch,
      createMatch,
      setActiveMatch,
      updateScore,
      finishMatch,
      deleteMatch,
      getMatchById,
    }}>
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (context === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};
