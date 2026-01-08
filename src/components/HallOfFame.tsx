import { motion } from 'framer-motion';
import { Trophy, Crown } from 'lucide-react';
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

      <div className="grid gap-6">
        {finishedMatches.map((match, index) => {
          const allPlayerScores = match.players.map(p => ({
            player: p,
            total: getPlayerTotal(match, p.id)
          })).sort((a, b) => a.total - b.total);

          // Top 3 players for podium
          const top3 = allPlayerScores.slice(0, 3);

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onViewMatch(match)}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50 cursor-pointer hover:shadow-lg transition-all"
            >
              {/* Match Header */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-1">{match.name}</h3>
                <p className="text-sm text-muted-foreground">{match.course}</p>
              </div>

              {/* Podium */}
              <div className="flex items-end justify-center gap-2 mb-4">
                {/* 2nd Place (Left) */}
                {top3[1] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg px-3 py-4 mb-2 relative" style={{ height: '80px' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">2</span>
                      </div>
                    </div>
                    <PlayerAvatar
                      name={top3[1].player.name}
                      color={top3[1].player.color}
                      size="md"
                      isLeader={false}
                    />
                    <p className="text-xs font-medium text-foreground mt-2 text-center">{top3[1].player.name}</p>
                    <p className="text-xs text-muted-foreground">{top3[1].total} cops</p>
                  </div>
                )}

                {/* 1st Place (Center - Tallest) */}
                {top3[0] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-b from-eagle to-eagle/80 rounded-t-lg px-3 py-6 mb-2 relative shadow-lg" style={{ height: '120px' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">1</span>
                      </div>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <Crown className="h-6 w-6 text-eagle-foreground" />
                      </div>
                    </div>
                    <PlayerAvatar
                      name={top3[0].player.name}
                      color={top3[0].player.color}
                      size="lg"
                      isLeader={true}
                    />
                    <p className="text-sm font-semibold text-eagle mt-2 text-center">{top3[0].player.name}</p>
                    <p className="text-xs text-muted-foreground">{top3[0].total} cops</p>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {top3[2] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg px-3 py-3 mb-2 relative" style={{ height: '60px' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">3</span>
                      </div>
                    </div>
                    <PlayerAvatar
                      name={top3[2].player.name}
                      color={top3[2].player.color}
                      size="md"
                      isLeader={false}
                    />
                    <p className="text-xs font-medium text-foreground mt-2 text-center">{top3[2].player.name}</p>
                    <p className="text-xs text-muted-foreground">{top3[2].total} cops</p>
                  </div>
                )}
              </div>

              {/* Rest of players if more than 3 */}
              {allPlayerScores.length > 3 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Altres participants</p>
                  <div className="flex flex-wrap gap-2">
                    {allPlayerScores.slice(3).map((item) => (
                      <div
                        key={item.player.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/30"
                      >
                        <PlayerAvatar
                          name={item.player.name}
                          color={item.player.color}
                          size="sm"
                          isLeader={false}
                        />
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.player.name}</p>
                          <p className="text-xs text-muted-foreground">{item.total} cops</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
