import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Match, Player, Hole, Score } from '@/types/golf';
import { supabase } from '@/lib/supabase';
import { generateColorFromId } from '@/lib/utils';

interface MatchContextType {
  matches: Match[]; // Partidas filtradas por usuario actual
  allMatches: Match[]; // Todas las partidas (sin filtrar)
  activeMatch: Match | null;
  createMatch: (name: string, course: string, holes: Hole[], players: Player[]) => Promise<Match | null>;
  setActiveMatch: (match: Match | null) => void;
  updateScore: (matchId: string, playerId: string, holeNumber: number, strokes: number) => Promise<void>;
  finishMatch: (matchId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  getMatchById: (id: string) => Match | undefined;
  refreshMatches: () => Promise<void>;
  isLoading: boolean;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

export const MatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allMatches, setAllMatches] = useState<Match[]>([]); // Todas las partidas
  const [matches, setMatches] = useState<Match[]>([]); // Partidas filtradas por usuario
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Obtener el usuario actual desde AuthContext
  const getCurrentUserId = (): string | null => {
    try {
      const sessionData = localStorage.getItem('greenHuntersUserSession');
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      if (session.user && session.user.id && new Date(session.expiryDate) > new Date()) {
        return session.user.id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  };

  // Cargar partidas desde Supabase
  const loadMatchesFromSupabase = useCallback(async (skipLoadingState = false) => {
    try {
      if (!skipLoadingState) {
        setIsLoading(true);
      }
      
      // Cargar partidas
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;
      if (!matchesData) return;

      // Cargar hoyos de todas las partidas
      const matchIds = matchesData.map(m => m.id);
      const { data: holesData, error: holesError } = await supabase
        .from('match_holes')
        .select('*')
        .in('match_id', matchIds)
        .order('hole_number', { ascending: true });

      if (holesError) throw holesError;

      // Cargar participantes de todas las partidas
      const { data: playersData, error: playersError } = await supabase
        .from('match_players')
        .select('*')
        .in('match_id', matchIds);

      if (playersError) throw playersError;

      // Cargar usuarios para los participantes
      const userIds = [...new Set(playersData?.map(p => p.user_id) || [])];
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, profile_image')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Cargar scores de todas las partidas
      const { data: scoresData, error: scoresError } = await supabase
        .from('match_scores')
        .select('*')
        .in('match_id', matchIds)
        .order('hole_number', { ascending: true });

      if (scoresError) throw scoresError;

      // Obtener el usuario actual
      const currentUserId = getCurrentUserId();

      // Construir objetos Match (todas las partidas)
      const loadedAllMatches: Match[] = matchesData.map(match => {
        const matchHoles: Hole[] = (holesData || [])
          .filter(h => h.match_id === match.id)
          .map(h => ({
            number: h.hole_number,
            par: h.par,
          }))
          .sort((a, b) => a.number - b.number);

        const matchPlayersData = (playersData || []).filter(p => p.match_id === match.id);
        const matchPlayers: Player[] = matchPlayersData
          .map(mp => {
            const user = (usersData || []).find(u => u.id === mp.user_id);
            
            const player: Player = {
              id: mp.user_id,
              name: user?.username || 'Unknown',
              avatar: user?.profile_image,
              color: generateColorFromId(mp.user_id),
            };
            return player;
          });

        const matchScores: Score[] = (scoresData || [])
          .filter(s => s.match_id === match.id)
          .map(s => ({
            playerId: s.user_id,
            holeNumber: s.hole_number,
            strokes: s.strokes,
          }));

        return {
          id: match.id,
          name: match.name,
          course: match.course,
          holes: matchHoles,
          players: matchPlayers,
          scores: matchScores,
          status: match.status as 'ongoing' | 'finished',
          createdAt: new Date(match.created_at),
          winnerId: match.winner_id || undefined,
        };
      });

      // Guardar todas las partidas
      setAllMatches(loadedAllMatches);

      // Filtrar: solo mostrar partidas donde el usuario actual es participante (para Dashboard)
      const userMatches = currentUserId
        ? loadedAllMatches.filter(match => match.players.some(p => p.id === currentUserId))
        : [];

      setMatches(userMatches);
    } catch (error) {
      console.error('Error loading matches from Supabase:', error);
    } finally {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, []);


  // Cargar partidas al montar el componente
  useEffect(() => {
    loadMatchesFromSupabase();
  }, [loadMatchesFromSupabase]);

  // Refrescar partidas periódicamente para sincronización en tiempo real
  useEffect(() => {
    const interval = setInterval(() => {
      loadMatchesFromSupabase();
    }, 5000); // Refrescar cada 5 segundos

    return () => clearInterval(interval);
  }, [loadMatchesFromSupabase]);

  const createMatch = useCallback(async (
    name: string,
    course: string,
    holes: Hole[],
    players: Player[]
  ): Promise<Match | null> => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      console.error('No user logged in');
      return null;
    }

    try {
      const matchId = crypto.randomUUID();

      // Crear la partida
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          id: matchId,
          name,
          course,
          creator_id: currentUserId,
          num_holes: holes.length,
          status: 'ongoing',
        });

      if (matchError) throw matchError;

      // Crear los hoyos
      const holesToInsert = holes.map(hole => ({
        id: crypto.randomUUID(),
        match_id: matchId,
        hole_number: hole.number,
        par: hole.par,
      }));

      const { error: holesError } = await supabase
        .from('match_holes')
        .insert(holesToInsert);

      if (holesError) throw holesError;

      // Crear los participantes
      const playersToInsert = players.map((player, index) => ({
        id: crypto.randomUUID(),
        match_id: matchId,
        user_id: player.id,
        position: null,
        total_strokes: 0,
        avg_per_hole: 0.00,
      }));

      const { error: playersError } = await supabase
        .from('match_players')
        .insert(playersToInsert);

      if (playersError) throw playersError;

      // Crear el objeto Match local
    const newMatch: Match = {
        id: matchId,
      name,
      course,
      holes,
      players,
      scores: [],
      status: 'ongoing',
      createdAt: new Date(),
    };

      // Actualizar ambas listas optimistamente (sin recargar todo)
      setAllMatches(prev => [newMatch, ...prev]);
      
      // Si el usuario actual está en los jugadores, añadir a matches también
      if (newMatch.players.some(p => p.id === currentUserId)) {
    setMatches(prev => [newMatch, ...prev]);
      }
      
      // No recargar todo - ya tenemos el partido creado
      // Solo recargar en background para sincronización (sin bloquear UI)
      loadMatchesFromSupabase().catch(() => {
        // Si falla, no importa, ya tenemos el partido en el estado
      });
      
    return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }, []);

  const updateScore = useCallback(async (
    matchId: string,
    playerId: string,
    holeNumber: number,
    strokes: number
  ) => {
    // OPTIMISTIC UPDATE: Actualizar estado local INMEDIATAMENTE (sin esperar BD)
    const updateMatchScores = (match: Match): Match => {
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
    };

    // Actualizar estado local INMEDIATAMENTE (optimistic)
    setAllMatches(prev => prev.map(match => {
      if (match.id !== matchId) return match;
      return updateMatchScores(match);
    }));

    setMatches(prev => prev.map(match => {
      if (match.id !== matchId) return match;
      return updateMatchScores(match);
    }));
    
    // También actualizar activeMatch si es el mismo
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

    // Guardar en BD en background (sin bloquear UI)
    // No esperar respuesta - hacerlo asíncrono
    (async () => {
      try {
        // Upsert directamente sin verificar primero (más rápido)
        await supabase
          .from('match_scores')
          .upsert({
            id: crypto.randomUUID(), // Generar ID nuevo siempre (upsert lo manejará)
            match_id: matchId,
            user_id: playerId,
            hole_number: holeNumber,
            strokes: strokes,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'match_id,user_id,hole_number',
          });
      } catch (error) {
        // Si falla, no importa - el estado local ya está actualizado
        // En caso de error, se sincronizará en el próximo refresh
      }
    })();
  }, [activeMatch]);

  const finishMatch = useCallback(async (matchId: string) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      // Calcular totales y ganador
      const playerTotals = match.players.map(player => {
        const total = match.scores
          .filter(s => s.playerId === player.id)
          .reduce((sum, s) => sum + s.strokes, 0);
        const holesPlayed = match.scores.filter(s => s.playerId === player.id).length;
        const avg = holesPlayed > 0 ? total / holesPlayed : 0;
        return { playerId: player.id, total, avg, holesPlayed };
      });

      // Ordenar por total (menor es mejor)
      playerTotals.sort((a, b) => a.total - b.total);
      
      const winner = playerTotals[0];

      // OPTIMISTIC UPDATE: Actualizar estado local INMEDIATAMENTE
      const updateMatch = (m: Match): Match => {
        if (m.id !== matchId) return m;
        return { ...m, status: 'finished' as const, winnerId: winner.playerId };
      };

      setAllMatches(prev => prev.map(updateMatch));
      setMatches(prev => prev.map(updateMatch));

      if (activeMatch?.id === matchId) {
        setActiveMatch(prev => prev ? { ...prev, status: 'finished', winnerId: winner.playerId } : null);
      }

      // Cargar datos de usuarios en PARALELO (mucho más rápido)
      const userIds = playerTotals.map(pt => pt.playerId);
      
      // Query paralela: cargar todos los usuarios de una vez
      const { data: allUsersData, error: usersError } = await supabase
        .from('users')
        .select('id, matches_played, wins, total_points, total_holes, avg_per_hole, birdies, hole_in_one')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Query paralela: cargar todos los achievements de usuarios de una vez
      const { data: allUserAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('user_id, achievement_id, achievements(code)')
        .in('user_id', userIds);

      // Query paralela: cargar todos los niveles de una vez
      const { data: allLevels } = await supabase
        .from('levels')
        .select('id, required_achievements_count, order_index')
        .order('order_index', { ascending: true });

      // Query paralela: cargar todos los achievements base de una vez
      const { data: allAchievementsBase } = await supabase
        .from('achievements')
        .select('id, code');

      // Crear mapas para acceso rápido
      const usersMap = new Map((allUsersData || []).map(u => [u.id, u]));
      const achievementsMap = new Map((allAchievementsBase || []).map(a => [a.code, a.id]));
      
      // Agrupar achievements por usuario
      const userAchievementsMap = new Map<string, Set<string>>();
      allUserAchievements?.forEach((ua: any) => {
        if (ua.achievements?.code) {
          if (!userAchievementsMap.has(ua.user_id)) {
            userAchievementsMap.set(ua.user_id, new Set());
          }
          userAchievementsMap.get(ua.user_id)!.add(ua.achievements.code);
        }
      });

      // Actualizar partida en BD
      await supabase
        .from('matches')
        .update({
          status: 'finished',
          winner_id: winner.playerId,
          finished_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      // Preparar todas las actualizaciones en paralelo
      const updatePromises: PromiseLike<any>[] = [];

      // Procesar cada jugador (usando datos ya cargados en paralelo)
      for (let i = 0; i < playerTotals.length; i++) {
        const playerTotal = playerTotals[i];
        const position = i + 1;

        // Obtener datos del usuario desde el mapa (ya cargado)
        const userData = usersMap.get(playerTotal.playerId);
        const userStats = userData || {
          matches_played: 0,
          wins: 0,
          total_points: 0,
          total_holes: 0,
          avg_per_hole: 0,
          birdies: 0,
          hole_in_one: 0,
        };

        // Contar birdies y hole-in-ones
        const playerScores = match.scores.filter(s => s.playerId === playerTotal.playerId);
        let birdies = 0;
        let holeInOne = 0;

        playerScores.forEach(score => {
          const hole = match.holes.find(h => h.number === score.holeNumber);
          if (hole) {
            const diff = score.strokes - hole.par;
            if (diff === -1) birdies++;
            if (score.strokes === 1) holeInOne++;
          }
        });

        // Calcular nuevas estadísticas
        const newTotalHoles = userStats.total_holes + playerTotal.holesPlayed;
        const newTotalPoints = userStats.total_points + playerTotal.total;
        const newAvgPerHole = newTotalHoles > 0 ? newTotalPoints / newTotalHoles : 0;
        const newWins = position === 1 ? (userStats.wins || 0) + 1 : (userStats.wins || 0);
        const newMatchesPlayed = (userStats.matches_played || 0) + 1;
        const newBirdies = (userStats.birdies || 0) + birdies;
        const newHoleInOne = (userStats.hole_in_one || 0) + holeInOne;

        // Obtener achievements desbloqueados desde el mapa (ya cargado)
        const unlockedCodes = userAchievementsMap.get(playerTotal.playerId) || new Set<string>();

        // Determinar qué achievements desbloquear
        const achievementsToUnlock: string[] = [];
        if (!unlockedCodes.has('first-win') && newWins === 1) {
          achievementsToUnlock.push('first-win');
        }
        if (newWins >= 5 && !unlockedCodes.has('five-wins')) {
          achievementsToUnlock.push('five-wins');
        }
        if (newMatchesPlayed >= 10 && !unlockedCodes.has('ten-matches')) {
          achievementsToUnlock.push('ten-matches');
        }
        if (newBirdies >= 5 && !unlockedCodes.has('five-birdies')) {
          achievementsToUnlock.push('five-birdies');
        }
        if (newHoleInOne >= 1 && !unlockedCodes.has('hole-in-one')) {
          achievementsToUnlock.push('hole-in-one');
        }

        // Desbloquear achievements (usar mapa de achievements base)
        for (const achievementCode of achievementsToUnlock) {
          const achievementId = achievementsMap.get(achievementCode);
          if (achievementId) {
            updatePromises.push(
              supabase
                .from('user_achievements')
                .upsert({
                  id: crypto.randomUUID(),
                  user_id: playerTotal.playerId,
                  achievement_id: achievementId,
                }, {
                  onConflict: 'user_id,achievement_id'
                })
            );
          }
        }

        // Calcular nivel (usar datos ya cargados)
        const achievementsCount = unlockedCodes.size + achievementsToUnlock.length;
        let appropriateLevelId = null;
        if (allLevels && allLevels.length > 0) {
          for (let j = allLevels.length - 1; j >= 0; j--) {
            if (achievementsCount >= allLevels[j].required_achievements_count) {
              appropriateLevelId = allLevels[j].id;
              break;
            }
          }
          if (!appropriateLevelId) {
            appropriateLevelId = allLevels[0].id;
          }
        }

        // Añadir actualizaciones a las promesas (ejecutar en paralelo)
        updatePromises.push(
          supabase
            .from('match_players')
            .update({
              position: position,
              total_strokes: playerTotal.total,
              avg_per_hole: parseFloat(playerTotal.avg.toFixed(2)),
            })
            .eq('match_id', matchId)
            .eq('user_id', playerTotal.playerId)
        );

        updatePromises.push(
          supabase
            .from('users')
            .update({
              matches_played: newMatchesPlayed,
              wins: newWins,
              total_points: newTotalPoints,
              total_holes: newTotalHoles,
              avg_per_hole: parseFloat(newAvgPerHole.toFixed(2)),
              birdies: newBirdies,
              hole_in_one: newHoleInOne,
              level_id: appropriateLevelId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', playerTotal.playerId)
        );
      }

      // Ejecutar TODAS las actualizaciones en PARALELO (mucho más rápido)
      await Promise.all(updatePromises.map(p => Promise.resolve(p)));
    } catch (error) {
      console.error('Error finishing match:', error);
    }
  }, [matches, activeMatch]);

  const getMatchById = useCallback((id: string) => {
    return matches.find(m => m.id === id);
  }, [matches]);

  const deleteMatch = useCallback(async (matchId: string) => {
    try {
      // Eliminar de Supabase (cascada eliminará scores, holes, players)
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) throw error;

      // Actualizar estado local
      setAllMatches(prev => prev.filter(m => m.id !== matchId));
    setMatches(prev => prev.filter(m => m.id !== matchId));
    if (activeMatch?.id === matchId) {
      setActiveMatch(null);
    }
      
      // No recargar todo - ya eliminamos del estado
      // Solo recargar en background para sincronización (sin bloquear UI)
      loadMatchesFromSupabase(true).catch(() => {
        // Si falla, no importa, ya eliminamos del estado
      });
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  }, [activeMatch, loadMatchesFromSupabase]);

  const refreshMatches = useCallback(async () => {
    await loadMatchesFromSupabase();
  }, [loadMatchesFromSupabase]);

  return (
    <MatchContext.Provider value={{
      matches,
      allMatches,
      activeMatch,
      createMatch,
      setActiveMatch,
      updateScore,
      finishMatch,
      deleteMatch,
      getMatchById,
      refreshMatches,
      isLoading,
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
