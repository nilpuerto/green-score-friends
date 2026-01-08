import { motion } from 'framer-motion';
import { Trophy, Medal, Star } from 'lucide-react';
import { Match } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';

interface HallOfFameProps {
  matches: Match[];
  onViewMatch: (match: Match) => void;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ matches, onViewMatch }) => {
  const finishedMatches = matches.filter(m => m.status === 'finished');

  const getWinner = (match: Match) => {
    return match.players.find(p => p.id === match.winnerId);
  };

  const getPlayerTotal = (match: Match, playerId: string) => {
    return match.scores
      .filter(s => s.playerId === playerId)
      .reduce((sum, s) => sum + s.strokes, 0);
  };

  if (finishedMatches.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-eagle/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-10 w-10 text-eagle" />
        </div>
        <h2 className="text-lg font-medium text-foreground mb-2">Hall of Fame</h2>
        <p className="text-sm text-muted-foreground">
          Juga més partides per veure la galeria de guanyadors
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="h-5 w-5 text-eagle" />
        <h2 className="text-lg font-medium text-foreground">Hall of Fame</h2>
      </div>

      <div className="grid gap-4">
        {finishedMatches.map((match, index) => {
          const winner = getWinner(match);
          const winnerScore = winner ? getPlayerTotal(match, winner.id) : 0;

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onViewMatch(match)}
              className="bg-card rounded-2xl p-4 shadow-card border border-border/50 cursor-pointer hover:shadow-lg transition-all"
            >
              {/* Winner Card */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  {winner && (
                    <PlayerAvatar
                      name={winner.name}
                      color={winner.color}
                      size="lg"
                      isLeader={true}
                    />
                  )}
                  <div className="absolute -top-2 -right-2 bg-eagle rounded-full p-1">
                    <Trophy className="h-3 w-3 text-eagle-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{winner?.name || 'Guanyador'}</p>
                  <p className="text-sm text-muted-foreground">{match.name}</p>
                  <p className="text-xs text-muted-foreground">{match.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-medium text-primary">{winnerScore}</p>
                  <p className="text-xs text-muted-foreground">cops</p>
                </div>
              </div>

              {/* Medals/Trophies */}
              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1 bg-eagle/10 rounded-full px-2 py-1">
                  <Medal className="h-3 w-3 text-eagle" />
                  <span className="text-xs text-eagle">Victòria</span>
                </div>
                <div className="flex items-center gap-1 bg-success/10 rounded-full px-2 py-1">
                  <Star className="h-3 w-3 text-success" />
                  <span className="text-xs text-success">{match.holes.length} forats</span>
                </div>
              </div>

              {/* All players */}
              <div className="mt-3 flex gap-2">
                {match.players.map(player => (
                  <PlayerAvatar
                    key={player.id}
                    name={player.name}
                    color={player.color}
                    size="sm"
                    isLeader={player.id === match.winnerId}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
