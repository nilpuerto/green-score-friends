import { motion } from 'framer-motion';
import { Trophy, Crown, Calendar, Flag, Users, Target } from 'lucide-react';
import { Match } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';

interface HallOfFameProps {
  matches: Match[];
  onViewMatch: (match: Match) => void;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ matches, onViewMatch }) => {
  const finishedMatches = matches.filter(m => m.status === 'finished');

  const getPlayerTotal = (match: Match, playerId: string) => {
    return match.scores
      .filter(s => s.playerId === playerId)
      .reduce((sum, s) => sum + s.strokes, 0);
  };

  const getPlayerHoles = (match: Match, playerId: string) => {
    return match.scores.filter(s => s.playerId === playerId).length;
  };

  const getPlayerAverage = (match: Match, playerId: string) => {
    const holes = getPlayerHoles(match, playerId);
    if (holes === 0) return '0.0';
    return (getPlayerTotal(match, playerId) / holes).toFixed(1);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (finishedMatches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-eagle/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-10 w-10 text-eagle" />
          </div>
          <p className="text-sm text-muted-foreground">
            Juga més partides per veure la galeria de guanyadors
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-eagle" />
        <h2 className="text-lg font-medium text-foreground">Hall of Fame</h2>
      </div>

      <div className="grid gap-4">
        {finishedMatches.map((match, index) => {
          const allPlayerScores = match.players.map(p => {
            const total = getPlayerTotal(match, p.id);
            const holes = getPlayerHoles(match, p.id);
            const avg = getPlayerAverage(match, p.id);
            return {
              player: p,
              total,
              holes,
              avg: parseFloat(avg)
            };
          }).sort((a, b) => a.total - b.total);

          // Top 3 players for podium
          const top3 = allPlayerScores.slice(0, 3);
          const totalHoles = match.holes.length;

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onViewMatch(match)}
              className="bg-card rounded-xl p-4 shadow-card border border-border/50 cursor-pointer hover:shadow-lg transition-all"
            >
              {/* Match Header - Compact */}
              <div className="mb-4">
                <h3 className="text-base font-semibold text-foreground mb-1">{match.name}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    {match.course}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(match.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {totalHoles} forats
                  </span>
                </div>
              </div>

              {/* Podium - Compact */}
              <div className="flex items-end justify-center gap-2 mb-3">
                {/* 2nd Place (Left) */}
                {top3[1] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg px-2 py-3 mb-1.5 relative" style={{ height: '60px' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">2</span>
                      </div>
                    </div>
                    <PlayerAvatar
                      name={top3[1].player.name}
                      avatar={top3[1].player.avatar}
                      color={top3[1].player.color}
                      size="sm"
                      isLeader={false}
                    />
                    <p className="text-xs font-medium text-foreground mt-1.5 text-center truncate w-full">{top3[1].player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{top3[1].total} cops</p>
                    <p className="text-[10px] text-muted-foreground">{top3[1].avg} cop/hole</p>
                  </div>
                )}

                {/* 1st Place (Center - Tallest) */}
                {top3[0] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-b from-eagle to-eagle/80 rounded-t-lg px-2 py-4 mb-1.5 relative shadow-lg" style={{ height: '90px' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">1</span>
                      </div>
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                        <Crown className="h-5 w-5 text-eagle-foreground" />
                      </div>
                    </div>
                    <PlayerAvatar
                      name={top3[0].player.name}
                      avatar={top3[0].player.avatar}
                      color={top3[0].player.color}
                      size="md"
                      isLeader={true}
                    />
                    <p className="text-xs font-semibold text-eagle mt-1.5 text-center truncate w-full">{top3[0].player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{top3[0].total} cops</p>
                    <p className="text-[10px] text-muted-foreground">{top3[0].avg} cop/hole</p>
                  </div>
                )}

                {/* 3rd Place (Right) */}
                {top3[2] && (
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-full bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg px-2 py-2 mb-1.5 relative" style={{ height: '45px' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">3</span>
                      </div>
                    </div>
                    <PlayerAvatar
                      name={top3[2].player.name}
                      avatar={top3[2].player.avatar}
                      color={top3[2].player.color}
                      size="sm"
                      isLeader={false}
                    />
                    <p className="text-xs font-medium text-foreground mt-1.5 text-center truncate w-full">{top3[2].player.name}</p>
                    <p className="text-[10px] text-muted-foreground">{top3[2].total} cops</p>
                    <p className="text-[10px] text-muted-foreground">{top3[2].avg} cop/hole</p>
                  </div>
                )}
              </div>

              {/* Rest of players if more than 3 */}
              {allPlayerScores.length > 3 && (
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Altres participants</p>
                  <div className="space-y-1">
                    {allPlayerScores.slice(3).map((item) => (
                      <div
                        key={item.player.id}
                        className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/50 border border-border/30 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <PlayerAvatar
                            name={item.player.name}
                            avatar={item.player.avatar}
                            color={item.player.color}
                            size="xs"
                            isLeader={false}
                          />
                          <span className="font-medium text-foreground truncate">{item.player.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground ml-2">
                          <span className="w-12 text-right">{item.total} cops</span>
                          <span className="w-16 text-right">{item.avg} cop/hole</span>
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
