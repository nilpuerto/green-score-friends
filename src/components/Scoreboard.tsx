import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Trophy, Minus, Plus } from 'lucide-react';
import { Match, ScoreType } from '@/types/golf';
import { useMatch } from '@/contexts/MatchContext';
import { PlayerAvatar } from './PlayerAvatar';
import { ScoreAnimation } from './ScoreAnimation';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface ScoreboardProps {
  match: Match;
  onBack: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ match, onBack }) => {
  const { updateScore, finishMatch, setActiveMatch } = useMatch();
  const [currentHole, setCurrentHole] = useState(1);
  const [animationType, setAnimationType] = useState<ScoreType | null>(null);
  const [lastUpdatedPlayer, setLastUpdatedPlayer] = useState<string | null>(null);

  const getPlayerScore = (playerId: string, holeNumber: number) => {
    return match.scores.find(s => s.playerId === playerId && s.holeNumber === holeNumber)?.strokes;
  };

  const getPlayerTotal = (playerId: string) => {
    return match.scores
      .filter(s => s.playerId === playerId)
      .reduce((sum, s) => sum + s.strokes, 0);
  };

  const getScoreType = (strokes: number, par: number): ScoreType => {
    const diff = strokes - par;
    if (diff <= -2) return 'eagle';
    if (diff === -1) return 'birdie';
    if (diff === 0) return 'par';
    if (diff === 1) return 'bogey';
    if (diff === 2) return 'double-bogey';
    return 'other';
  };

  const getScoreColor = (strokes: number | undefined, par: number) => {
    if (!strokes) return 'text-muted-foreground';
    const diff = strokes - par;
    if (diff <= -2) return 'text-eagle';
    if (diff === -1) return 'text-success';
    if (diff === 0) return 'text-foreground';
    if (diff === 1) return 'text-warning';
    return 'text-destructive';
  };

  const handleScoreChange = useCallback((playerId: string, delta: number) => {
    const currentScore = getPlayerScore(playerId, currentHole) || match.holes[currentHole - 1].par;
    const newScore = Math.max(1, currentScore + delta);
    
    updateScore(match.id, playerId, currentHole, newScore);
    setLastUpdatedPlayer(playerId);

    const scoreType = getScoreType(newScore, match.holes[currentHole - 1].par);
    if (scoreType === 'birdie' || scoreType === 'eagle') {
      setAnimationType(scoreType);
    }
  }, [currentHole, match, updateScore]);

  const getLeader = () => {
    const playerTotals = match.players.map(player => ({
      player,
      total: getPlayerTotal(player.id),
    })).filter(p => p.total > 0);

    if (playerTotals.length === 0) return null;
    return playerTotals.reduce((min, p) => p.total < min.total ? p : min, playerTotals[0]).player;
  };

  const leader = getLeader();
  const currentHolePar = match.holes[currentHole - 1]?.par || 4;

  const handleFinishMatch = () => {
    finishMatch(match.id);
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#FFD700', '#1B5E3C', '#FFA500'],
    });
    setActiveMatch(null);
    onBack();
  };

  const allHolesComplete = match.holes.every(hole => 
    match.players.every(player => getPlayerScore(player.id, hole.number) !== undefined)
  );

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <ScoreAnimation type={animationType} onComplete={() => setAnimationType(null)} />
      
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg text-foreground">{match.name}</h1>
            <p className="text-sm text-muted-foreground">{match.course}</p>
          </div>
        </div>

        {/* Mini leaderboard */}
        {leader && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 rounded-xl p-3 flex items-center gap-3"
          >
            <span className="text-xl">👑</span>
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">Lidera:</span>
              <span className="font-semibold text-primary ml-2">{leader.name}</span>
            </div>
            <span className="font-bold text-primary">{getPlayerTotal(leader.id)}</span>
          </motion.div>
        )}
      </div>

      {/* Hole selector */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Forat Actual</span>
          <span className="text-sm text-muted-foreground">Par {currentHolePar}</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {match.holes.map((hole) => {
            const allScored = match.players.every(p => getPlayerScore(p.id, hole.number) !== undefined);
            return (
              <button
                key={hole.number}
                onClick={() => setCurrentHole(hole.number)}
                className={`flex-shrink-0 w-10 h-10 rounded-full font-semibold transition-all ${
                  currentHole === hole.number
                    ? 'bg-primary text-primary-foreground shadow-button'
                    : allScored
                    ? 'bg-success/10 text-success border-2 border-success/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {hole.number}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score entry */}
      <div className="p-4 space-y-4">
        {match.players.map((player) => {
          const score = getPlayerScore(player.id, currentHole);
          const total = getPlayerTotal(player.id);
          const isLeader = leader?.id === player.id;

          return (
            <motion.div
              key={player.id}
              animate={lastUpdatedPlayer === player.id ? { scale: [1, 1.02, 1] } : {}}
              className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PlayerAvatar
                    name={player.name}
                    color={player.color}
                    size="md"
                    isLeader={isLeader}
                    animate={lastUpdatedPlayer === player.id}
                  />
                  <div>
                    <p className="font-semibold text-foreground">{player.name}</p>
                    <p className="text-sm text-muted-foreground">Total: {total || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleScoreChange(player.id, -1)}
                    className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Minus className="h-5 w-5 text-secondary-foreground" />
                  </button>
                  <motion.span
                    key={score}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`text-3xl font-bold w-12 text-center ${getScoreColor(score, currentHolePar)}`}
                  >
                    {score || '-'}
                  </motion.span>
                  <button
                    onClick={() => handleScoreChange(player.id, 1)}
                    className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <Plus className="h-5 w-5 text-secondary-foreground" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Finish button */}
      {allHolesComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-4 right-4 safe-bottom"
        >
          <Button
            onClick={handleFinishMatch}
            variant="eagle"
            size="lg"
            className="w-full"
          >
            <Trophy className="h-5 w-5 mr-2" />
            Acabar Partida
          </Button>
        </motion.div>
      )}
    </div>
  );
};
