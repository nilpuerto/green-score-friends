import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMatch } from '@/contexts/MatchContext';
import { Hole, Player } from '@/types/golf';
import confetti from 'canvas-confetti';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: (matchId: string) => void;
}

const playerColors = ['#1B5E3C', '#2D7A50', '#3D9A64', '#4CAF50', '#66BB6A', '#81C784'];

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onMatchCreated,
}) => {
  const { createMatch } = useMatch();
  const [matchName, setMatchName] = useState('');
  const [course, setCourse] = useState('');
  const [numHoles, setNumHoles] = useState(9);
  const [players, setPlayers] = useState<{ name: string }[]>([
    { name: '' },
    { name: '' },
  ]);

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, { name: '' }]);
    }
  };

  const removePlayer = (index: number) => {
    if (players.length > 2) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...players];
    updated[index] = { name };
    setPlayers(updated);
  };

  const handleCreate = () => {
    if (!matchName.trim() || !course.trim()) return;
    if (players.some(p => !p.name.trim())) return;

    const holes: Hole[] = Array.from({ length: numHoles }, (_, i) => ({
      number: i + 1,
      par: 4,
    }));

    const matchPlayers: Player[] = players.map((p, i) => ({
      id: crypto.randomUUID(),
      name: p.name,
      color: playerColors[i % playerColors.length],
    }));

    const match = createMatch(matchName, course, holes, matchPlayers);
    
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1B5E3C', '#2D7A50', '#3D9A64'],
    });

    onMatchCreated(match.id);
    onClose();
    
    // Reset form
    setMatchName('');
    setCourse('');
    setNumHoles(9);
    setPlayers([{ name: '' }, { name: '' }]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-background rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-foreground">Nova Partida</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nom de la partida
                  </label>
                  <Input
                    value={matchName}
                    onChange={(e) => setMatchName(e.target.value)}
                    placeholder="Ex: Torneig del Dissabte"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Camp de golf
                  </label>
                  <Input
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Ex: Club de Golf Barcelona"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nombre de forats
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setNumHoles(Math.max(3, numHoles - 1))}
                      className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="h-5 w-5 text-secondary-foreground" />
                    </button>
                    <span className="text-2xl font-bold text-foreground w-16 text-center">
                      {numHoles}
                    </span>
                    <button
                      onClick={() => setNumHoles(Math.min(18, numHoles + 1))}
                      className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Plus className="h-5 w-5 text-secondary-foreground" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Jugadors
                  </label>
                  <div className="space-y-2">
                    {players.map((player, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: playerColors[index % playerColors.length] }}
                        />
                        <Input
                          value={player.name}
                          onChange={(e) => updatePlayerName(index, e.target.value)}
                          placeholder={`Jugador ${index + 1}`}
                          className="flex-1"
                        />
                        {players.length > 2 && (
                          <button
                            onClick={() => removePlayer(index)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {players.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addPlayer}
                      className="mt-2 text-primary"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Afegir jugador
                    </Button>
                  )}
                </div>
              </div>

              <Button
                onClick={handleCreate}
                className="w-full mt-6"
                size="lg"
                disabled={!matchName.trim() || !course.trim() || players.some(p => !p.name.trim())}
              >
                Crear Partida
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
