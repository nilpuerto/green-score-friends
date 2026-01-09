import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, SkipForward, Trophy, Eye } from 'lucide-react';
import { Match } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';
import { Logo } from './Logo';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

interface MatchReplayProps {
  match: Match;
  onBack: () => void;
}

export const MatchReplay: React.FC<MatchReplayProps> = ({ match, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentHole, setCurrentHole] = useState(0);
  const [showResults, setShowResults] = useState(true);

  const getPlayerScore = (playerId: string, holeNumber: number) => {
    return match.scores.find(s => s.playerId === playerId && s.holeNumber === holeNumber)?.strokes;
  };

  const getPlayerTotal = (playerId: string, upToHole?: number) => {
    return match.scores
      .filter(s => s.playerId === playerId && (!upToHole || s.holeNumber <= upToHole))
      .reduce((sum, s) => sum + s.strokes, 0);
  };

  const getPlayerAverage = (playerId: string) => {
    const playerScores = match.scores.filter(s => s.playerId === playerId);
    if (playerScores.length === 0) return 0;
    const total = playerScores.reduce((sum, s) => sum + s.strokes, 0);
    return (total / playerScores.length).toFixed(1);
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

  const winner = match.players.find(p => p.id === match.winnerId);

  // Auto-play replay
  useEffect(() => {
    if (isPlaying && currentHole < match.holes.length) {
      const timer = setTimeout(() => {
        setCurrentHole(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (currentHole >= match.holes.length) {
      setIsPlaying(false);
      // Celebration when replay ends
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#1B5E3C', '#FFA500'],
      });
    }
  }, [isPlaying, currentHole, match.holes.length]);

  const startReplay = () => {
    setShowResults(false);
    setCurrentHole(0);
    setTimeout(() => {
      setIsPlaying(true);
      setCurrentHole(1);
    }, 500);
  };

  // Get current standings up to currentHole
  const getCurrentStandings = () => {
    return match.players
      .map(player => ({
        player,
        total: getPlayerTotal(player.id, currentHole),
      }))
      .sort((a, b) => a.total - b.total);
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <Logo size="md" showText={false} />
          <div className="flex-1">
            <h1 className="font-medium text-lg text-foreground">{match.name}</h1>
            <p className="text-sm text-muted-foreground">{match.course}</p>
          </div>
          <div className="bg-success/10 rounded-full px-3 py-1">
            <span className="text-sm text-success">Acabat</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showResults ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
          >
            {/* Winner celebration */}
            {winner && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-eagle/20 to-eagle/5 rounded-2xl p-6 text-center border border-eagle/30"
              >
                <div className="relative inline-block mb-4">
                  <PlayerAvatar
                    name={winner.name}
                    color={winner.color}
                    size="lg"
                    isLeader={true}
                  />
                  <div className="absolute -top-3 -right-3 bg-eagle rounded-full p-2">
                    <Trophy className="h-5 w-5 text-eagle-foreground" />
                  </div>
                </div>
                <h2 className="text-xl font-medium text-foreground mb-1">
                  🎉 {winner.name} guanya!
                </h2>
                <p className="text-3xl font-medium text-primary">
                  {getPlayerTotal(winner.id)} cops
                </p>
              </motion.div>
            )}

            {/* Final Scores */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-medium text-foreground mb-4">Resultats Finals</h3>
              <div className="space-y-3">
                {match.players
                  .map(player => ({
                    player,
                    total: getPlayerTotal(player.id),
                    avg: getPlayerAverage(player.id),
                  }))
                  .sort((a, b) => a.total - b.total)
                  .map((item, index) => (
                    <div
                      key={item.player.id}
                      className="flex items-center gap-3"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-eagle text-eagle-foreground' :
                        index === 1 ? 'bg-muted text-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <PlayerAvatar
                        name={item.player.name}
                        color={item.player.color}
                        size="sm"
                        isLeader={item.player.id === match.winnerId}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-foreground block">{item.player.name}</span>
                        <span className="text-xs text-muted-foreground">AVG: {item.avg}</span>
                      </div>
                      <span className="font-medium text-primary">{item.total}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Hole by hole scores */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 overflow-x-auto">
              <h3 className="font-medium text-foreground mb-4">Puntuació per Forat</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Jugador</th>
                    {match.holes.map(hole => (
                      <th key={hole.number} className="text-center px-2 py-2 text-muted-foreground font-medium">
                        {hole.number}
                      </th>
                    ))}
                    <th className="text-center px-2 py-2 text-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {match.players.map(player => (
                    <tr key={player.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <PlayerAvatar name={player.name} avatar={player.avatar} color={player.color} size="sm" />
                          <span className="text-foreground">{player.name}</span>
                        </div>
                      </td>
                      {match.holes.map(hole => {
                        const score = getPlayerScore(player.id, hole.number);
                        return (
                          <td key={hole.number} className={`text-center px-2 py-2 font-medium ${getScoreColor(score, hole.par)}`}>
                            {score || '-'}
                          </td>
                        );
                      })}
                      <td className="text-center px-2 py-2 font-medium text-primary">
                        {getPlayerTotal(player.id)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30">
                    <td className="py-2 pr-4 text-muted-foreground text-xs">Par</td>
                    {match.holes.map(hole => (
                      <td key={hole.number} className="text-center px-2 py-2 text-xs text-muted-foreground">
                        {hole.par}
                      </td>
                    ))}
                    <td className="text-center px-2 py-2 text-xs text-muted-foreground">
                      {match.holes.reduce((sum, h) => sum + h.par, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Replay button */}
            <Button onClick={startReplay} className="w-full" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Veure Replay
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="replay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
          >
            {/* Replay controls */}
            <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border/50">
              <span className="text-sm text-muted-foreground">
                Forat {currentHole} / {match.holes.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full bg-primary text-primary-foreground"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setCurrentHole(prev => Math.min(prev + 1, match.holes.length))}
                  className="p-2 rounded-full bg-secondary text-secondary-foreground"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowResults(true)}
                  className="p-2 rounded-full bg-secondary text-secondary-foreground"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Course visualization */}
            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex gap-1 overflow-x-auto pb-2">
                {match.holes.map((hole, index) => (
                  <motion.div
                    key={hole.number}
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      index + 1 <= currentHole
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    animate={{
                      scale: index + 1 === currentHole ? 1.1 : 1,
                    }}
                  >
                    {hole.number}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Live standings during replay with animated avatars */}
            <div className="space-y-3">
              {(() => {
                const currentStandings = getCurrentStandings();
                const previousStandings = currentHole > 1 
                  ? match.players
                      .map(player => ({
                        player,
                        total: getPlayerTotal(player.id, currentHole - 1),
                      }))
                      .sort((a, b) => a.total - b.total)
                  : currentStandings;
                
                return currentStandings.map((item, index) => {
                  const previousIndex = previousStandings.findIndex(p => p.player.id === item.player.id);
                  const positionChanged = previousIndex !== index && previousIndex !== -1;
                const currentScore = getPlayerScore(item.player.id, currentHole);
                const previousTotal = currentHole > 1 
                  ? match.scores
                      .filter(s => s.playerId === item.player.id && s.holeNumber < currentHole)
                      .reduce((sum, s) => sum + s.strokes, 0)
                  : 0;

                return (
                  <motion.div
                    key={item.player.id}
                    layout
                    initial={false}
                    animate={{
                      y: 0,
                      scale: positionChanged ? [1, 1.05, 1] : 1,
                    }}
                    transition={{
                      layout: { duration: 0.5, ease: "easeInOut" },
                      scale: { duration: 0.3 }
                    }}
                    className="bg-card rounded-2xl p-4 shadow-card border border-border/50 relative overflow-hidden"
                  >
                    {/* Progress indicator */}
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 bg-primary/10"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(item.total / (match.holes.reduce((sum, h) => sum + h.par, 0) * 2)) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <motion.span
                        key={`rank-${index}-${currentHole}`}
                        initial={{ scale: 0.8, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === 0 ? 'bg-eagle text-eagle-foreground' :
                          index === 1 ? 'bg-muted text-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </motion.span>
                      
                      <motion.div
                        animate={{
                          x: positionChanged ? [0, 10, 0] : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <PlayerAvatar
                          name={item.player.name}
                          color={item.player.color}
                          size="md"
                          isLeader={index === 0}
                          animate={true}
                        />
                      </motion.div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.player.name}</p>
                        <div className="flex items-center gap-2">
                          {currentHole > 0 && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Forat {currentHole}: 
                              </p>
                              <motion.span
                                key={`score-${currentHole}-${item.player.id}`}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-xs font-medium text-primary"
                              >
                                {currentScore || '-'}
                              </motion.span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <motion.div
                        key={`total-${item.total}-${currentHole}`}
                        initial={{ scale: 0.8, y: -10 }}
                        animate={{ scale: 1, y: 0 }}
                        className="text-right"
                      >
                        <motion.span
                          className="text-2xl font-medium text-primary block"
                          animate={item.total !== previousTotal ? {
                            scale: [1, 1.2, 1],
                            color: ['hsl(var(--primary))', 'hsl(var(--eagle))', 'hsl(var(--primary))']
                          } : {}}
                        >
                          {item.total || 0}
                        </motion.span>
                        {positionChanged && index < previousIndex && (
                          <motion.span
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-success"
                          >
                            ↑
                          </motion.span>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                );
                });
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
