import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Player } from '@/types/golf';

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string) => Player;
  getPlayerById: (id: string) => Player | undefined;
  getPlayerByName: (name: string) => Player | undefined;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Colores disponibles para jugadores
const playerColors = ['#1B5E3C', '#2D7A50', '#3D9A64', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7', '#C8E6C9'];

// Jugadores iniciales (se pueden añadir más desde la app)
const initialPlayers: Player[] = [];

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    // Cargar jugadores del localStorage
    const saved = localStorage.getItem('greenHuntersPlayers');
    return saved ? JSON.parse(saved) : initialPlayers;
  });

  // Guardar en localStorage cuando cambie
  React.useEffect(() => {
    localStorage.setItem('greenHuntersPlayers', JSON.stringify(players));
  }, [players]);

  const addPlayer = useCallback((name: string): Player => {
    // Verificar si el jugador ya existe
    const existing = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return existing;
    }

    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      color: playerColors[players.length % playerColors.length],
    };
    
    setPlayers(prev => [...prev, newPlayer]);
    return newPlayer;
  }, [players]);

  const getPlayerById = useCallback((id: string) => {
    return players.find(p => p.id === id);
  }, [players]);

  const getPlayerByName = useCallback((name: string) => {
    return players.find(p => p.name.toLowerCase() === name.toLowerCase());
  }, [players]);

  return (
    <PlayerContext.Provider value={{
      players,
      addPlayer,
      getPlayerById,
      getPlayerByName,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayers = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayers must be used within a PlayerProvider');
  }
  return context;
};

