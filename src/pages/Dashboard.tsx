import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { matches, activeMatch, setActiveMatch, getMatchById } = useMatch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);

  const handleMatchCreated = (matchId: string) => {
    const match = getMatchById(matchId);
    if (match) {
      setActiveMatch(match);
    }
  };

  const handleMatchClick = (match: Match) => {
    if (match.status === 'finished') {
      setViewingMatch(match);
    } else {
      setActiveMatch(match);
    }
  };

  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const finishedMatches = matches.filter(m => m.status === 'finished');

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
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-sm text-muted-foreground">
            Hola, {user?.name}
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.main
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-6"
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
            className="p-4"
          >
            <HallOfFame 
              matches={matches} 
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
            className="p-4"
          >
            <Statistics matches={matches} />
          </motion.main>
        )}

        {activeTab === 'profile' && (
          <motion.main
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4"
          >
            <Profile 
              user={user} 
              matches={matches} 
              onLogout={logout}
            />
          </motion.main>
        )}
      </AnimatePresence>

      {/* FAB */}
      {activeTab === 'home' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed right-4 bottom-24 z-40"
        >
          <Button
            variant="fab"
            size="fab"
            onClick={() => setShowCreateModal(true)}
            className="shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      )}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <CreateMatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMatchCreated={handleMatchCreated}
      />
    </div>
  );
};
