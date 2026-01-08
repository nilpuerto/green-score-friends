import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trophy, LogOut, TrendingUp, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { MatchCard } from '@/components/MatchCard';
import { CreateMatchModal } from '@/components/CreateMatchModal';
import { Scoreboard } from '@/components/Scoreboard';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';

type Tab = 'home' | 'hall' | 'stats' | 'profile';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { matches, activeMatch, setActiveMatch, getMatchById } = useMatch();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  const handleMatchCreated = (matchId: string) => {
    const match = getMatchById(matchId);
    if (match) {
      setActiveMatch(match);
    }
  };

  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const finishedMatches = matches.filter(m => m.status === 'finished');

  if (activeMatch) {
    return (
      <Scoreboard
        match={activeMatch}
        onBack={() => setActiveMatch(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* Header */}
      <header className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hola, {user?.name}
            </span>
          </div>
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
                <h2 className="text-lg font-bold text-foreground">Partides en joc</h2>
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
                        onClick={() => setActiveMatch(match)}
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
                  <h3 className="font-semibold text-foreground mb-2">Cap partida activa</h3>
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
                <h2 className="text-lg font-bold text-foreground mb-4">Partides recents</h2>
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
                        onClick={() => setActiveMatch(match)}
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
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-eagle/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-10 w-10 text-eagle" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Hall of Fame</h2>
              <p className="text-muted-foreground">
                Juga més partides per desbloquejar el saló de la fama
              </p>
            </div>
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
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Estadístiques</h2>
              <p className="text-muted-foreground">
                Les teves estadístiques apareixeran aquí quan juguis partides
              </p>
            </div>
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
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 mb-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{matches.length}</p>
                  <p className="text-xs text-muted-foreground">Partides</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{finishedMatches.length}</p>
                  <p className="text-xs text-muted-foreground">Acabades</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-eagle">0</p>
                  <p className="text-xs text-muted-foreground">Victòries</p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Tancar sessió
              </Button>
            </div>
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
