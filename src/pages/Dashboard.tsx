import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Logo } from '@/components/Logo';
import { MatchCard } from '@/components/MatchCard';
import { CreateMatchModal } from '@/components/CreateMatchModal';
import { Scoreboard } from '@/components/Scoreboard';
import { MatchReplay } from '@/components/MatchReplay';
import { HallOfFame } from '@/components/HallOfFame';
import { Statistics } from '@/components/Statistics';
import { Profile } from '@/components/Profile';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import { Match } from '@/types/golf';

type Tab = 'home' | 'hall' | 'stats' | 'profile';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { matches, allMatches, activeMatch, setActiveMatch, getMatchById, deleteMatch } = useMatch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Guardar la pestaña activa en sessionStorage para restaurarla al volver
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('greenHuntersActiveTab');
    return (saved as Tab) || 'home';
  });

  // Guardar la pestaña activa cuando cambie
  useEffect(() => {
    sessionStorage.setItem('greenHuntersActiveTab', activeTab);
  }, [activeTab]);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  const handleMatchCreated = (matchId: string) => {
    const match = getMatchById(matchId);
    if (match) {
      setActiveMatch(match);
    }
  };

  const handleMatchClick = (match: Match) => {
    // Partidos acabados solo se pueden ver, no editar
    if (match.status === 'finished') {
      setViewingMatch(match);
    } else {
      // Solo partidos en curso se pueden editar
      setActiveMatch(match);
    }
  };

  const handleShareMatch = (match: Match) => {
    // Calcular scores por jugador
    const playerScores = match.players.map(player => {
      const scores = match.scores.filter(s => s.playerId === player.id);
      const total = scores.reduce((sum, s) => sum + s.strokes, 0);
      const scoresByHole = match.holes.map(hole => {
        const score = scores.find(s => s.holeNumber === hole.number);
        return score ? score.strokes : '-';
      });
      return { player, total, scoresByHole };
    }).sort((a, b) => a.total - b.total);

    // Crear texto formateado
    let shareText = `🏌️ *${match.name}*\n`;
    shareText += `📍 ${match.course}\n\n`;
    shareText += `*Resultats:*\n\n`;

    playerScores.forEach((ps, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏌️';
      shareText += `${medal} *${ps.player.name}*: ${ps.total} punts\n`;
      
      // Mostrar scores por hoyo
      ps.scoresByHole.forEach((score, holeIndex) => {
        if (score !== '-') {
          shareText += `   Forat ${holeIndex + 1}: ${score}\n`;
        }
      });
      shareText += '\n';
    });

    shareText += `\n🎯 GreenHunters`;

    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    
    // Intentar abrir WhatsApp
    window.open(whatsappUrl, '_blank');
  };

  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Calcular AVG puntos del usuario
  const getUserAvgPoints = () => {
    if (!user) return '0.0';
    
    const userMatches = finishedMatches.filter(match => 
      match.players.some(p => p.name === user.name)
    );
    
    if (userMatches.length === 0) return '0.0';
    
    let totalStrokes = 0;
    let totalHoles = 0;
    
    userMatches.forEach(match => {
      const userPlayer = match.players.find(p => p.name === user.name);
      if (userPlayer) {
        const userScores = match.scores.filter(s => s.playerId === userPlayer.id);
        totalStrokes += userScores.reduce((sum, s) => sum + s.strokes, 0);
        totalHoles += userScores.length;
      }
    });
    
    if (totalHoles === 0) return '0.0';
    return (totalStrokes / totalHoles).toFixed(1);
  };

  // Show Scoreboard for ongoing match
  if (activeMatch) {
    return (
      <Scoreboard
        match={activeMatch}
        onBack={() => setActiveMatch(null)}
      />
    );
  }

  // Show MatchReplay for finished match (view only)
  if (viewingMatch) {
    return (
      <MatchReplay
        match={viewingMatch}
        onBack={() => setViewingMatch(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-top flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header className="bg-card border-b border-border p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" showText={false} />
            <span className="text-sm font-medium text-primary">GreenHunters</span>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'home' && ongoingMatches.length > 0 && (
              <div className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-primary">
                  {ongoingMatches.length} {ongoingMatches.length === 1 ? 'partida activa' : 'partides actives'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary">
                AVG: {getUserAvgPoints()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.main
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-6 h-full overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Ongoing Matches */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-foreground">Partides en joc</h2>
                <span className="text-sm text-muted-foreground">{ongoingMatches.length}</span>
              </div>
              {ongoingMatches.length > 0 ? (
                <div className="space-y-3">
                  {ongoingMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <MatchCard
                        match={match}
                        onClick={() => handleMatchClick(match)}
                        onDelete={() => setMatchToDelete(match)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl p-8 text-center border border-dashed border-border"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">Cap partida activa</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crea una nova partida per començar a jugar amb els teus amics
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Partida
                  </Button>
                </motion.div>
              )}
            </section>

            {/* Recent Matches */}
            {finishedMatches.length > 0 && (
              <section>
                <h2 className="text-base font-medium text-foreground mb-4">Partides recents</h2>
                <div className="space-y-3">
                  {finishedMatches.slice(0, 3).map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <MatchCard
                        match={match}
                        onClick={() => handleMatchClick(match)}
                        onDelete={() => setMatchToDelete(match)}
                        onShare={() => handleShareMatch(match)}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.main>
        )}

        {activeTab === 'hall' && (
          <motion.main
            key="hall"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 overflow-y-auto"
            style={{ height: 'calc(100vh - 180px)', WebkitOverflowScrolling: 'touch' }}
          >
            <HallOfFame 
              matches={allMatches} 
              onViewMatch={(match) => setViewingMatch(match)}
            />
          </motion.main>
        )}

        {activeTab === 'stats' && (
          <motion.main
            key="stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 h-full overflow-y-auto"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <Statistics matches={allMatches} />
          </motion.main>
        )}

        {activeTab === 'profile' && (
          <motion.main
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 profile-scroll overflow-y-auto"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '6rem',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
              height: 'calc(100vh - 140px)',
              maxHeight: 'calc(100vh - 140px)'
            }}
          >
            <Profile 
              user={user} 
              matches={matches} 
              onLogout={logout}
            />
          </motion.main>
        )}
      </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CreateMatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMatchCreated={handleMatchCreated}
      />
      
      {/* Delete Match Dialog */}
      <AlertDialog open={!!matchToDelete} onOpenChange={(open) => !open && setMatchToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md p-5 rounded-2xl">
          <AlertDialogHeader className="pb-2">
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Eliminar partida
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Vols posar aquest partit a la casa d'en Bague?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:gap-3 mt-3">
            <AlertDialogCancel className="w-full sm:w-auto m-0 bg-gray-200 hover:bg-gray-300 text-gray-900 border-0">
              Cancel·lar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (matchToDelete) {
                  await deleteMatch(matchToDelete.id);
                  setMatchToDelete(null);
                }
              }}
              className="w-full sm:w-auto m-0 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
