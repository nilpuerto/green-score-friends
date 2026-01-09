import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Users, ChevronDown } from 'lucide-react';
import { Match, Player } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';
import { usePlayers } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatisticsProps {
  matches: Match[];
}

type SortBy = 'points' | 'matches' | 'ranking';

export const Statistics: React.FC<StatisticsProps> = ({ matches }) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortBy>('ranking');
  const [showDropdown, setShowDropdown] = useState(false);
  const { players: allPlayers, addPlayer } = usePlayers();
  const { user } = useAuth();

  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Asegurar que el usuario logueado esté siempre en el contexto de jugadores
  useEffect(() => {
    if (user && user.name) {
      // Añadir automáticamente el usuario logueado como jugador si no existe
      const existingPlayer = allPlayers.find(p => p.name.toLowerCase() === user.name.toLowerCase());
      if (!existingPlayer) {
        addPlayer(user.name);
      }
    }
  }, [user, allPlayers, addPlayer]);

  // Asegurar que allPlayers siempre sea un array
  const players = allPlayers || [];

  // Obtener TODOS los jugadores: PRIMERO del contexto (estos siempre deben aparecer)
  // Luego de los partidos (para incluir jugadores que solo aparecen en partidos antiguos)
  const getAllPlayers = (): Player[] => {
    const allPlayersMap = new Map<string, Player>();
    
    // PRIMERO: Añadir TODOS los jugadores del contexto (estos siempre deben mostrarse)
    players.forEach(player => {
      allPlayersMap.set(player.id, player);
    });
    
    // SEGUNDO: Si hay usuario logueado, asegurarse de que esté incluido
    if (user && user.name) {
      const userPlayer = players.find(p => p.name.toLowerCase() === user.name.toLowerCase());
      if (!userPlayer) {
        // Si no está en el contexto, crear un jugador temporal para mostrarlo
        const tempPlayer: Player = {
          id: `user-${user.id}`,
          name: user.name,
          color: '#1B5E3C', // Color por defecto
        };
        allPlayersMap.set(tempPlayer.id, tempPlayer);
      }
    }
    
    // TERCERO: Añadir jugadores de los partidos que no estén ya en el contexto
    matches.forEach(match => {
      match.players.forEach(player => {
        if (!allPlayersMap.has(player.id)) {
          allPlayersMap.set(player.id, player);
        }
      });
    });

    return Array.from(allPlayersMap.values());
  };

  const allPlayersList = getAllPlayers();

  // Debug: Ver cuántos jugadores hay
  // console.log('Jugadores del contexto:', players.length);
  // console.log('Jugadores totales:', allPlayersList.length);

  // Aggregate stats per player
  const getPlayerStats = () => {
    const statsMap: Record<string, {
      player: Player;
      totalPoints: number;
      matchesPlayed: number;
      wins: number;
      avgPerHole: number;
      totalHoles: number;
      bestMatchAvg: number; // Mejor AVG de un solo partido (mejor partit històric)
      winRate: number; // Ratio de victorias/partidos
    }> = {};

    // SIEMPRE inicializar todos los jugadores con estadísticas en 0
    allPlayersList.forEach(player => {
        statsMap[player.id] = {
          player,
          totalPoints: 0,
          matchesPlayed: 0,
          wins: 0,
          avgPerHole: 0,
          totalHoles: 0,
          bestMatchAvg: 0, // Inicializar en 0, el mejor será el menor (mejor promedio)
          winRate: 0, // Ratio de victorias/partidos
        };
    });

    // Actualizar estadísticas de jugadores que han jugado
    finishedMatches.forEach(match => {
      match.players.forEach(player => {
        // Si el jugador no está en el mapa (por si acaso), añadirlo
        if (!statsMap[player.id]) {
          statsMap[player.id] = {
            player,
            totalPoints: 0,
            matchesPlayed: 0,
            wins: 0,
            avgPerHole: 0,
            totalHoles: 0,
            bestMatchAvg: 0,
            winRate: 0,
          };
        }

        const playerScores = match.scores.filter(s => s.playerId === player.id);
        const totalStrokes = playerScores.reduce((sum, s) => sum + s.strokes, 0);
        const matchAvg = playerScores.length > 0 ? totalStrokes / playerScores.length : 0;
        
        statsMap[player.id].totalPoints += totalStrokes;
        statsMap[player.id].matchesPlayed += 1;
        statsMap[player.id].totalHoles += playerScores.length;
        
        // Calcular la mejor AVG de un solo partido (el menor es mejor)
        if (matchAvg > 0 && (statsMap[player.id].bestMatchAvg === 0 || matchAvg < statsMap[player.id].bestMatchAvg)) {
          statsMap[player.id].bestMatchAvg = matchAvg;
        }
        
        if (match.winnerId === player.id) {
          statsMap[player.id].wins += 1;
        }
      });
    });

    // Calculate averages - SIEMPRE mostrar con decimales
    Object.values(statsMap).forEach(stat => {
      stat.avgPerHole = stat.totalHoles > 0 ? stat.totalPoints / stat.totalHoles : 0;
      // Calcular ratio de victorias/partidos
      stat.winRate = stat.matchesPlayed > 0 ? stat.wins / stat.matchesPlayed : 0;
    });

    // SIEMPRE devolver todos los jugadores, incluso si no tienen partidos
    return Object.values(statsMap);
  };

  const playerStats = getPlayerStats();

  // Sort players
  const sortedStats = [...playerStats].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        // Millor mitjana x partit (mejor AVG de un solo partido - menor es mejor)
        if (a.bestMatchAvg === 0 && b.bestMatchAvg === 0) return 0;
        if (a.bestMatchAvg === 0) return 1;
        if (b.bestMatchAvg === 0) return -1;
        return a.bestMatchAvg - b.bestMatchAvg;
      case 'matches':
        return b.matchesPlayed - a.matchesPlayed;
      case 'ranking':
      default:
        // Ranking global = por ratio de victorias/partidos, si está empatado por AVG (menor es mejor)
        const winRateDiff = b.winRate - a.winRate;
        if (winRateDiff !== 0) return winRateDiff;
        // Si está empatado en ratio, ordenar por AVG (menor es mejor)
        if (a.avgPerHole === 0 && b.avgPerHole === 0) return 0;
        if (a.avgPerHole === 0) return 1;
        if (b.avgPerHole === 0) return -1;
        return a.avgPerHole - b.avgPerHole;
    }
  });

  const sortLabels: Record<SortBy, string> = {
    points: 'Millor partit històric',
    matches: 'Més partits',
    ranking: 'Ranking global',
  };

  // SIEMPRE mostrar las estadísticas, incluso si no hay jugadores o estadísticas


  return (
    <div className="space-y-4">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Estadístiques</h2>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2 text-sm text-secondary-foreground"
          >
            {sortLabels[sortBy]}
            <ChevronDown className="h-4 w-4" />
          </button>
          
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-2 bg-card rounded-xl shadow-lg border border-border z-10 overflow-hidden"
            >
              {Object.entries(sortLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSortBy(key as SortBy);
                    setShowDropdown(false);
                  }}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors ${
                    sortBy === key ? 'bg-primary/10 text-primary' : 'text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 mb-6">
        {/* Bar Chart - Millor mitjana x partit */}
        {sortBy === 'points' && (
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="text-sm font-medium text-foreground mb-4">Millor Partit Històric</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(() => {
                const topStats = sortedStats.slice(0, 5).filter(stat => stat.bestMatchAvg > 0);
                // Encontrar el máximo AVG para invertir el gráfico (menor AVG = columna más alta)
                const maxAvg = Math.max(...topStats.map(s => s.bestMatchAvg), 10);
                return topStats.map(stat => ({
                  name: stat.player.name.length > 8 ? stat.player.name.substring(0, 8) + '...' : stat.player.name,
                  avg: parseFloat(stat.bestMatchAvg.toFixed(1)),
                  invertedValue: maxAvg + 1 - stat.bestMatchAvg, // Invertir: menor AVG = mayor valor
                  color: stat.player.color
                }));
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string, props: any) => {
                    // Mostrar el AVG real, no el valor invertido
                    return [props.payload.avg.toFixed(1), 'AVG'];
                  }}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="invertedValue" radius={[8, 8, 0, 0]}>
                  {sortedStats.slice(0, 5).filter(stat => stat.bestMatchAvg > 0).map((stat, index) => (
                    <Cell key={`cell-${index}`} fill={stat.player.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar Chart - Wins */}
        {sortBy === 'ranking' && (
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="text-sm font-medium text-foreground mb-4">Victòries</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedStats.slice(0, 5).map(stat => ({
                name: stat.player.name.length > 8 ? stat.player.name.substring(0, 8) + '...' : stat.player.name,
                wins: stat.wins,
                color: stat.player.color
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="wins" radius={[8, 8, 0, 0]}>
                  {sortedStats.slice(0, 5).map((stat, index) => (
                    <Cell key={`cell-${index}`} fill={stat.player.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Pie Chart - Matches Played */}
        {sortBy === 'matches' && (
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="text-sm font-medium text-foreground mb-4">Distribució de Partits</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sortedStats.slice(0, 5).map(stat => ({
                    name: stat.player.name,
                    value: stat.matchesPlayed,
                    color: stat.player.color
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sortedStats.slice(0, 5).map((stat, index) => (
                    <Cell key={`cell-${index}`} fill={stat.player.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="space-y-3">
        {sortedStats.length > 0 && (
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {playerStats.length} jugadors
          </p>
        )}
        {sortedStats.length > 0 ? (
          sortedStats.map((stat, index) => (
            <motion.div
              key={stat.player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-4 shadow-card border border-border/50 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => {
                // Buscar el ID del usuario en la BD o usar el ID del jugador
                const playerUserId = stat.player.id.startsWith('user-') 
                  ? stat.player.id.replace('user-', '')
                  : stat.player.id;
                navigate(`/player/${playerUserId}`);
              }}
            >
              <div className="flex items-center gap-3">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                index === 0 ? 'bg-eagle text-eagle-foreground' :
                index === 1 ? 'bg-muted text-foreground' :
                index === 2 ? 'bg-warning/20 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {Math.round(index + 1)}
              </div>
                
                <PlayerAvatar
                  name={stat.player.name}
                  avatar={stat.player.avatar}
                  color={stat.player.color}
                  size="md"
                />
                
                <div className="flex-1">
                  <p className="font-medium text-foreground">{stat.player.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.wins} victòries · {stat.matchesPlayed} partits
                  </p>
                </div>
                
                <div className="text-right">
                  {sortBy === 'points' ? (
                    <>
                      <p className="font-medium text-primary">
                        {stat.bestMatchAvg > 0 ? stat.bestMatchAvg.toFixed(1) : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Millor AVG
                      </p>
                    </>
                  ) : sortBy === 'matches' ? (
                    <>
                      <p className="font-medium text-primary">{stat.matchesPlayed}</p>
                      <p className="text-xs text-muted-foreground">
                        Partits
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-primary">{stat.avgPerHole.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">
                        AVG
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar for wins */}
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${(() => {
                      const maxWins = Math.max(...playerStats.map(p => p.wins), 0);
                      return maxWins > 0 ? Math.min((stat.wins / maxWins) * 100, 100) : 0;
                    })()}%`
                  }}
                />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Encara no hi ha jugadors registrats</p>
          </div>
        )}
      </div>
    </div>
  );
};
