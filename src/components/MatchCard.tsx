import { motion } from 'framer-motion';
import { MapPin, Users, Trophy } from 'lucide-react';
import { Match } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';

interface MatchCardProps {
  match: Match;
  onClick: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  const getLeader = () => {
    if (match.scores.length === 0) return null;
    
    const playerTotals = match.players.map(player => {
      const total = match.scores
        .filter(s => s.playerId === player.id)
        .reduce((sum, s) => sum + s.strokes, 0);
      return { player, total };
    }).filter(p => p.total > 0);

    if (playerTotals.length === 0) return null;
    
    return playerTotals.reduce((min, p) => p.total < min.total ? p : min, playerTotals[0]).player;
  };

  const leader = getLeader();
  const holesCompleted = new Set(match.scores.map(s => s.holeNumber)).size;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-2xl p-4 shadow-card cursor-pointer border border-border/50"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-lg">{match.name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{match.course}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          match.status === 'ongoing' 
            ? 'bg-success/10 text-success' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {match.status === 'ongoing' ? 'En joc' : 'Acabat'}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {match.players.slice(0, 4).map((player) => (
              <PlayerAvatar
                key={player.id}
                name={player.name}
                color={player.color}
                size="sm"
                isLeader={leader?.id === player.id}
              />
            ))}
          </div>
          {match.players.length > 4 && (
            <span className="text-xs text-muted-foreground">+{match.players.length - 4}</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {match.status === 'ongoing' && (
            <span>Forat {holesCompleted}/{match.holes.length}</span>
          )}
          {match.status === 'finished' && (
            <div className="flex items-center gap-1 text-eagle">
              <Trophy className="h-4 w-4" />
              <span className="font-medium">
                {match.players.find(p => p.id === match.winnerId)?.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
