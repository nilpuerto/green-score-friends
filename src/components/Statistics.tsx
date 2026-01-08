import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Target, Users, ChevronDown } from 'lucide-react';
import { Match, Player } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';

interface StatisticsProps {
  matches: Match[];
}

type SortBy = 'points' | 'matches' | 'ranking';

export const Statistics: React.FC<StatisticsProps> = ({ matches }) => {
  const [sortBy, setSortBy] = useState<SortBy>('ranking');
  const [showDropdown, setShowDropdown] = useState(false);

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
    }> = {};

    finishedMatches.forEach(match => {
      match.players.forEach(player => {
        if (!statsMap[player.id]) {
          statsMap[player.id] = {
            player,
            totalPoints: 0,
            matchesPlayed: 0,
            wins: 0,
            avgPerHole: 0,
            totalHoles: 0,
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
    });

    return Object.values(statsMap);
  };

  const playerStats = getPlayerStats();

  // Sort players
  const sortedStats = [...playerStats].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return a.totalPoints - b.totalPoints; // Lower is better in golf
      case 'matches':
        return b.matchesPlayed - a.matchesPlayed;
      case 'ranking':
      default:
        // Ranking = wins first, then avg per hole
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.avgPerHole - b.avgPerHole;
    }
  });

  const sortLabels: Record<SortBy, string> = {
    points: 'Menys punts',
    matches: 'Més partits',
    ranking: 'Ranking global',
  };

  if (finishedMatches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-foreground mb-2">Estadístiques</h2>
        <p className="text-sm text-muted-foreground">
          Juga partides per veure el ranking i estadístiques
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
                <p className="font-medium text-primary">{stat.totalPoints}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.avgPerHole.toFixed(1)} avg
                </p>
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
