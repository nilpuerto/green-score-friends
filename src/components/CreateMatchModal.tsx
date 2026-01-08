import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, UserPlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMatch } from '@/contexts/MatchContext';
import { usePlayers } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Hole, Player } from '@/types/golf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayerAvatar } from './PlayerAvatar';
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
  const { players: availablePlayers, addPlayer } = usePlayers();
  const { user } = useAuth();
  const [matchName, setMatchName] = useState('');
  const [course, setCourse] = useState('');
  const [numHoles, setNumHoles] = useState(9);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [showDropdowns, setShowDropdowns] = useState<boolean[]>([]);

  // Inicializar con el usuario actual si existe
  useEffect(() => {
    if (isOpen) {
      if (user) {
        if (availablePlayers.length === 0) {
          // Si no hay jugadores, añadir el usuario actual
          const userPlayer = addPlayer(user.name);
          setSelectedPlayers([userPlayer.id]);
          setShowDropdowns([false]);
        } else if (selectedPlayers.length === 0) {
          // Si hay jugadores pero no hay seleccionados, seleccionar el usuario
          const userPlayer = availablePlayers.find(p => p.name === user.name);
          if (userPlayer) {
            setSelectedPlayers([userPlayer.id]);
            setShowDropdowns([false]);
          } else {
            const newPlayer = addPlayer(user.name);
            setSelectedPlayers([newPlayer.id]);
            setShowDropdowns([false]);
          }
        }
      } else if (selectedPlayers.length === 0) {
        // Si no hay usuario, empezar con 2 slots vacíos
        setSelectedPlayers(['', '']);
        setShowDropdowns([false, false]);
      }
    }
  }, [isOpen]);

  const addPlayerSlot = () => {
    if (selectedPlayers.length < 6) {
      setSelectedPlayers([...selectedPlayers, '']);
      setShowDropdowns([...showDropdowns, false]);
    }
  };

  const removePlayerSlot = (index: number) => {
    if (selectedPlayers.length > 2) {
      setSelectedPlayers(selectedPlayers.filter((_, i) => i !== index));
      setShowDropdowns(showDropdowns.filter((_, i) => i !== index));
    }
  };

  const updatePlayerSelection = (index: number, playerId: string) => {
    const updated = [...selectedPlayers];
    updated[index] = playerId;
    setSelectedPlayers(updated);
    
    const dropdowns = [...showDropdowns];
    dropdowns[index] = false;
    setShowDropdowns(dropdowns);
  };

  const handleCreate = () => {
    if (!matchName.trim() || !course.trim()) return;
    if (selectedPlayers.some(id => !id)) return;

    const holes: Hole[] = Array.from({ length: numHoles }, (_, i) => ({
      number: i + 1,
      par: 4,
    }));

    const matchPlayers: Player[] = selectedPlayers
      .map((playerId, i) => {
        let player = availablePlayers.find(p => p.id === playerId);
        if (!player) {
          // Si el jugador no existe, crear uno nuevo (no debería pasar, pero por seguridad)
          player = addPlayer(`Jugador ${i + 1}`);
        }
        return {
          ...player,
          color: playerColors[i % playerColors.length],
        };
      })
      .filter((p): p is Player => p !== null);

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
    if (user) {
      const userPlayer = availablePlayers.find(p => p.name === user.name);
      setSelectedPlayers(userPlayer ? [userPlayer.id] : []);
    } else {
      setSelectedPlayers([]);
    }
    setShowDropdowns([]);
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
                    {selectedPlayers.map((playerId, index) => {
                      const selectedPlayer = availablePlayers.find(p => p.id === playerId);
                      return (
                        <div key={index} className="flex items-center gap-2">
                          {selectedPlayer ? (
                            <PlayerAvatar
                              name={selectedPlayer.name}
                              color={selectedPlayer.color}
                              size="sm"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full shrink-0 bg-muted"
                              style={{ backgroundColor: playerColors[index % playerColors.length] }}
                            />
                          )}
                          <Select
                            value={playerId}
                            onValueChange={(value) => updatePlayerSelection(index, value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={`Selecciona jugador ${index + 1}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {availablePlayers.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedPlayers.length > 2 && (
                            <button
                              onClick={() => removePlayerSlot(index)}
                              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedPlayers.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={addPlayerSlot}
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
                disabled={!matchName.trim() || !course.trim() || selectedPlayers.some(id => !id)}
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
