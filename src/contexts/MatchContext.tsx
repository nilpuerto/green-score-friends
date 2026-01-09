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
            
            return {
              id: mp.user_id,
              name: user?.username || 'Unknown',
              avatar: user?.profile_image,
              color: generateColorFromId(mp.user_id),
            };
          })
          .filter((p): p is Player => p !== null);

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
    try {
      // Primero verificar si ya existe un score para este match/user/hole
      // Usar maybeSingle() en lugar de single() para evitar error si no existe
      const { data: existingScore } = await supabase
        .from('match_scores')
        .select('id')
        .eq('match_id', matchId)
        .eq('user_id', playerId)
        .eq('hole_number', holeNumber)
        .maybeSingle();

      // Si existe, usar su ID; si no, crear nuevo con ID
      const scoreId = existingScore?.id || crypto.randomUUID();
      
      const { error } = await supabase
        .from('match_scores')
        .upsert({
          id: scoreId,
          match_id: matchId,
          user_id: playerId,
          hole_number: holeNumber,
          strokes: strokes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'match_id,user_id,hole_number',
        });

      if (error) throw error;

      // Actualizar estado local (ambas listas)
      const updateMatchScores = (match: Match) => {
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
      
      // No recargar todo - ya actualizamos el estado local
      // Solo recargar en background para sincronización (sin bloquear UI)
      setTimeout(() => {
        loadMatchesFromSupabase().catch(() => {
          // Si falla, no importa, ya actualizamos el estado
        });
      }, 2000); // Delay más largo para no saturar
    } catch (error) {
      console.error('Error updating score:', error);
    }
  }, [activeMatch, loadMatchesFromSupabase]);

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

      // Actualizar en Supabase
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          status: 'finished',
          winner_id: winner.playerId,
          finished_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (matchError) throw matchError;

      // Actualizar posiciones y estadísticas de los participantes
      for (let i = 0; i < playerTotals.length; i++) {
        const playerTotal = playerTotals[i];
        const position = i + 1;

        const { error: playerError } = await supabase
          .from('match_players')
          .update({
            position: position,
            total_strokes: playerTotal.total,
            avg_per_hole: parseFloat(playerTotal.avg.toFixed(2)),
          })
          .eq('match_id', matchId)
          .eq('user_id', playerTotal.playerId);

        if (playerError) throw playerError;

        // Actualizar estadísticas del usuario
        const { data: userData, error: userFetchError } = await supabase
          .from('users')
          .select('matches_played, wins, total_points, total_holes, avg_per_hole, birdies, hole_in_one')
          .eq('id', playerTotal.playerId)
          .single();

        if (userFetchError) {
          console.error('Error fetching user stats:', userFetchError);
          continue;
        }

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

        // Calcular nueva media
        const newTotalHoles = userStats.total_holes + playerTotal.holesPlayed;
        const newTotalPoints = userStats.total_points + playerTotal.total;
        const newAvgPerHole = newTotalHoles > 0 ? newTotalPoints / newTotalHoles : 0;
        const currentWins = userStats.wins || 0;
        const newWins = position === 1 ? currentWins + 1 : currentWins;
        const currentMatchesPlayed = userStats.matches_played || 0;
        const newMatchesPlayed = currentMatchesPlayed + 1;
        const currentBirdies = userStats.birdies || 0;
        const newBirdies = currentBirdies + birdies;
        const currentHoleInOne = userStats.hole_in_one || 0;
        const newHoleInOne = currentHoleInOne + holeInOne;

        // Desbloquear achievements según las estadísticas
        // Primero verificar qué achievements ya tiene desbloqueados
        const { data: existingAchievements, error: existingAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id, achievements(code)')
          .eq('user_id', playerTotal.playerId);

        if (existingAchievementsError) {
          // Si hay error, continuar sin achievements desbloqueados (se intentará desbloquear)
        }

        const unlockedCodes = new Set<string>();
        existingAchievements?.forEach((ea: any) => {
          if (ea.achievements?.code) {
            unlockedCodes.add(ea.achievements.code);
          }
        });

        const achievementsToUnlock: string[] = [];
        
        // Primera victoria: verificar SIEMPRE si tiene exactamente 1 victoria y no tiene el achievement
        // IMPORTANTE: Verificar newWins (después de este partido) porque es el valor final
        // Si tiene 1 victoria en total y no tiene el achievement, desbloquearlo
        if (!unlockedCodes.has('first-win') && newWins === 1) {
          achievementsToUnlock.push('first-win');
        }
        
        // 5 victorias: si tiene 5 o más victorias y no tiene el achievement
        if (newWins >= 5 && !unlockedCodes.has('five-wins')) {
          achievementsToUnlock.push('five-wins');
        }
        
        // 10 partidos: si tiene 10 o más partidos y no tiene el achievement
        if (newMatchesPlayed >= 10 && !unlockedCodes.has('ten-matches')) {
          achievementsToUnlock.push('ten-matches');
        }
        
        // 5 birdies: si tiene 5 o más birdies y no tiene el achievement
        if (newBirdies >= 5 && !unlockedCodes.has('five-birdies')) {
          achievementsToUnlock.push('five-birdies');
        }
        
        // Hole in one: si tiene al menos 1 hole in one y no tiene el achievement
        if (newHoleInOne >= 1 && !unlockedCodes.has('hole-in-one')) {
          achievementsToUnlock.push('hole-in-one');
        }

        // Desbloquear achievements
        for (const achievementCode of achievementsToUnlock) {
          // Obtener el achievement por código
          const { data: achievement, error: achievementError } = await supabase
            .from('achievements')
            .select('id')
            .eq('code', achievementCode)
            .maybeSingle();

          if (achievementError) {
            console.error(`Error fetching achievement ${achievementCode}:`, achievementError);
            continue;
          }

          if (achievement) {
            // Verificar si ya está desbloqueado
            const { data: existing, error: existingError } = await supabase
              .from('user_achievements')
              .select('id')
              .eq('user_id', playerTotal.playerId)
              .eq('achievement_id', achievement.id)
              .maybeSingle();

            if (existingError && existingError.code !== 'PGRST116') {
              console.error(`Error checking existing achievement ${achievementCode}:`, existingError);
              continue;
            }

            // Si no está desbloqueado, desbloquearlo
            // Usar upsert para asegurar que se guarde incluso si hay race conditions
            if (!existing) {
              const { error: upsertError } = await supabase
                .from('user_achievements')
                .upsert({
                  id: crypto.randomUUID(),
                  user_id: playerTotal.playerId,
                  achievement_id: achievement.id,
                }, {
                  onConflict: 'user_id,achievement_id'
                });

              if (upsertError) {
                // Si upsert falla, intentar insert normal como fallback
                await supabase
                  .from('user_achievements')
                  .insert({
                    id: crypto.randomUUID(),
                    user_id: playerTotal.playerId,
                    achievement_id: achievement.id,
                  });
              }
            }
          }
        }

        // Calcular nivel según achievements desbloqueados
        const { data: userAchievements, error: userAchievementsError } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', playerTotal.playerId);

        if (userAchievementsError) {
          // Silently handle error
        }

        const achievementsCount = userAchievements?.length || 0;

        // Obtener el nivel apropiado según el número de achievements
        // Buscar el nivel más alto que el usuario puede alcanzar con sus achievements
        const { data: allLevels } = await supabase
          .from('levels')
          .select('id, required_achievements_count, order_index')
          .order('order_index', { ascending: true });

        let appropriateLevelId = null;
        if (allLevels && allLevels.length > 0) {
          // Encontrar el nivel más alto que el usuario puede alcanzar
          for (let i = allLevels.length - 1; i >= 0; i--) {
            if (achievementsCount >= allLevels[i].required_achievements_count) {
              appropriateLevelId = allLevels[i].id;
              break;
            }
          }
          // Si no encuentra ninguno, usar Rookie (el primero)
          if (!appropriateLevelId) {
            appropriateLevelId = allLevels[0].id;
          }
        }

        // Actualizar usuario con estadísticas y nivel
        const { error: updateUserError } = await supabase
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
          .eq('id', playerTotal.playerId);

        if (updateUserError) {
          console.error('Error updating user stats:', updateUserError);
        }
      }

      // Actualizar estado local (ambas listas)
      const updateMatch = (m: Match) => {
        if (m.id !== matchId) return m;
        return { ...m, status: 'finished', winnerId: winner.playerId };
      };

      setAllMatches(prev => prev.map(updateMatch));
      setMatches(prev => prev.map(updateMatch));

      if (activeMatch?.id === matchId) {
        setActiveMatch(prev => prev ? { ...prev, status: 'finished', winnerId: winner.playerId } : null);
      }
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
