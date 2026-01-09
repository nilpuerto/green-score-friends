import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Player } from '@/types/golf';
import { supabase } from '@/lib/supabase';
import { generateGolfCardColorFromId } from '@/lib/utils';

interface PlayerContextType {
  players: Player[];
  addPlayer: (name: string) => Player;
  getPlayerById: (id: string) => Player | undefined;
  getPlayerByName: (name: string) => Player | undefined;
  isLoading: boolean;
  refreshPlayers: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función para cargar usuarios de Supabase
  const loadUsersFromSupabase = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, profile_image');

      if (error) {
        console.error('Error loading users:', error);
        setIsLoading(false);
        return;
      }

      if (users && users.length > 0) {
        // Convertir usuarios de BD a Players con colores únicos de golf para las cards
        const playersFromDB: Player[] = users.map((user) => {
          // Generar color único de golf (marrones, verdes, rojos, amarillos) para las cards
          const cardColor = generateGolfCardColorFromId(user.id);
          return {
            id: user.id,
            name: user.username,
            color: cardColor, // Color para las cards (colores de golf)
            avatar: user.profile_image || undefined,
          };
        });

        setPlayers(playersFromDB);
      } else {
        // Si no hay usuarios, inicializar con array vacío
        setPlayers([]);
      }
    } catch (error) {
      console.error('Error loading users from Supabase:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar todos los usuarios de Supabase al montar el componente
  useEffect(() => {
    loadUsersFromSupabase();
  }, [loadUsersFromSupabase]);

  const addPlayer = useCallback((name: string): Player => {
    // Verificar si el jugador ya existe
    const existing = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return existing;
    }

    const newId = crypto.randomUUID();
    const newPlayer: Player = {
      id: newId,
      name,
      color: generateGolfCardColorFromId(newId), // Color de golf para la card
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
      isLoading,
      refreshPlayers: loadUsersFromSupabase,
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
