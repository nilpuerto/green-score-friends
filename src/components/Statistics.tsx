import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Users, ChevronDown } from 'lucide-react';
import { Match, Player } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';
import { usePlayers } from '@/contexts/PlayerContext';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatisticsProps {
  matches: Match[];
}

type SortBy = 'points' | 'matches' | 'ranking';

export const Statistics: React.FC<StatisticsProps> = ({ matches }) => {
  const [sortBy, setSortBy] = useState<SortBy>('ranking');
  const [showDropdown, setShowDropdown] = useState(false);
  const { players: allPlayers } = usePlayers();

  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Aggregate stats per player
  const getPlayerStats = () => {
    const statsMap: Record<string, {
      player: Player;
      totalPoints: number;
      matchesPlayed: number;
      wins: number;
      avgPerHole: number;
      totalHoles: number;
      holesPerMatch: number; // Nuevo: hoyos por partido
    }> = {};

    // Inicializar todos los jugadores con estadísticas en 0
    allPlayers.forEach(player => {
      statsMap[player.id] = {
        player,
        totalPoints: 0,
        matchesPlayed: 0,
        wins: 0,
        avgPerHole: 0,
        totalHoles: 0,
        holesPerMatch: 0,
      };
    });

    // Actualizar estadísticas de jugadores que han jugado
    finishedMatches.forEach(match => {
      match.players.forEach(player => {
        // Si el jugador no está en el mapa, añadirlo
        if (!statsMap[player.id]) {
          statsMap[player.id] = {
            player,
            totalPoints: 0,
            matchesPlayed: 0,
            wins: 0,
            avgPerHole: 0,
            totalHoles: 0,
            holesPerMatch: 0,
          };
        }

        const playerScores = match.scores.filter(s => s.playerId === player.id);
        const totalStrokes = playerScores.reduce((sum, s) => sum + s.strokes, 0);
        
        statsMap[player.id].totalPoints += totalStrokes;
        statsMap[player.id].matchesPlayed += 1;
        statsMap[player.id].totalHoles += playerScores.length;
        
        if (match.winnerId === player.id) {
          statsMap[player.id].wins += 1;
        }
      });
    });

    // Calculate averages
    Object.values(statsMap).forEach(stat => {
      stat.avgPerHole = stat.totalHoles > 0 ? stat.totalPoints / stat.totalHoles : 0;
      stat.holesPerMatch = stat.matchesPlayed > 0 ? stat.totalHoles / stat.matchesPlayed : 0;
    });

    return Object.values(statsMap);
  };

  const playerStats = getPlayerStats();

  // Sort players
  const sortedStats = [...playerStats].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        // Menys hoyos por partido (el que ha jugado menos hoyos respecto a sus partidos)
        return a.holesPerMatch - b.holesPerMatch;
      case 'matches':
        return b.matchesPlayed - a.matchesPlayed;
      case 'ranking':
      default:
        // Ranking global = por victorias
        return b.wins - a.wins;
    }
  });

  const sortLabels: Record<SortBy, string> = {
    points: 'Menys hoyos',
    matches: 'Més partits',
    ranking: 'Ranking global',
  };

  // Si no hay jugadores, mostrar mensaje
  if (allPlayers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-foreground mb-2">Estadístiques</h2>
        <p className="text-sm text-muted-foreground">
          Crea partides per veure estadístiques dels jugadors
        </p>
      </div>
    );
  }

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

      {/* Global Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
          <Users className="h-5 w-5 text-primary mx-auto mb-2" />
          <p className="text-xl font-medium text-foreground">{playerStats.length}</p>
          <p className="text-xs text-muted-foreground">Jugadors</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
          <Target className="h-5 w-5 text-success mx-auto mb-2" />
          <p className="text-xl font-medium text-foreground">{finishedMatches.length}</p>
          <p className="text-xs text-muted-foreground">Partits</p>
        </div>
        <div className="bg-card rounded-2xl p-4 text-center border border-border/50">
          <Award className="h-5 w-5 text-eagle mx-auto mb-2" />
          <p className="text-xl font-medium text-foreground">
            {playerStats.reduce((sum, p) => sum + p.wins, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Victòries</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 mb-6">
        {/* Bar Chart - Total Points */}
        {sortBy === 'points' && (
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="text-sm font-medium text-foreground mb-4">Punts Totals</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sortedStats.slice(0, 5).map(stat => ({
                name: stat.player.name.length > 8 ? stat.player.name.substring(0, 8) + '...' : stat.player.name,
                holes: parseFloat(stat.holesPerMatch.toFixed(1)),
                color: stat.player.color
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="holes" radius={[8, 8, 0, 0]}>
                  {sortedStats.slice(0, 5).map((stat, index) => (
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
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
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
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
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
        {sortedStats.map((stat, index) => (
          <motion.div
            key={stat.player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          >
            <div className="flex items-center gap-3">
              {/* Rank */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                index === 0 ? 'bg-eagle text-eagle-foreground' :
                index === 1 ? 'bg-muted text-foreground' :
                index === 2 ? 'bg-warning/20 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              
              <PlayerAvatar
                name={stat.player.name}
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
                    <p className="font-medium text-primary">{stat.holesPerMatch.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">
                      hoyos/partit
                    </p>
                  </>
                ) : sortBy === 'ranking' ? (
                  <>
                    <p className="font-medium text-primary">{stat.wins}</p>
                    <p className="text-xs text-muted-foreground">
                      victòries
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-primary">{stat.matchesPlayed}</p>
                    <p className="text-xs text-muted-foreground">
                      partits
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
                  width: `${Math.min((stat.wins / Math.max(...playerStats.map(p => p.wins), 1)) * 100, 100)}%`
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
