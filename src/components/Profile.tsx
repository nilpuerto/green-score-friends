import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Edit2, Trophy, Target, Award, Medal, Flame, Camera, X, Zap, Star, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Match, Player } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayers } from '@/contexts/PlayerContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AVATAR_COLOR, generateGolfCardColorFromId } from '@/lib/utils';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_type: string;
  color: string;
  unlocked: boolean;
}

interface ProfileProps {
  user: { name: string; email: string } | null;
  matches: Match[];
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, matches, onLogout }) => {
  const { user: authUser, updateUser, refreshUser } = useAuth();
  const { refreshPlayers } = usePlayers();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(authUser?.username || user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(authUser?.profile_image || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  // Actualizar estado cuando cambie authUser
  useEffect(() => {
    if (authUser) {
      setNickname(authUser.username);
      setProfileImage(authUser.profile_image || null);
    }
  }, [authUser]);

  // Refrescar usuario al cargar el perfil para actualizar nivel y achievements
  useEffect(() => {
    const refreshLevel = async () => {
      if (authUser) {
        await refreshUser();
        // Pequeño delay para asegurar que los achievements se hayan guardado
        await new Promise(resolve => setTimeout(resolve, 300));
        // Cargar achievements desbloqueados desde la BD
        await loadUnlockedAchievements();
      }
    };
    refreshLevel();
  }, [authUser?.id]); // Refrescar cuando cambie el usuario

  // También refrescar cuando se monta el componente (por si viene de finalizar partido)
  useEffect(() => {
    if (authUser) {
      loadUnlockedAchievements();
    }
  }, []); // Solo al montar

  // Cargar achievements desbloqueados desde la BD
  const loadUnlockedAchievements = async () => {
    if (!authUser) return;

    try {
      const { data: userAchievements, error } = await supabase
        .from('user_achievements')
        .select('achievement_id, achievements(code)')
        .eq('user_id', authUser.id);

      if (error) {
        console.error('Error loading unlocked achievements:', error);
        return;
      }

      const unlockedCodes = new Set<string>();
      userAchievements?.forEach((ua: any) => {
        if (ua.achievements?.code) {
          unlockedCodes.add(ua.achievements.code);
        }
      });

      setUnlockedAchievements(unlockedCodes);
    } catch (error) {
      console.error('Error loading unlocked achievements:', error);
    }
  };

  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Calculate user stats
  const getUserStats = () => {
    const currentUserName = authUser?.username || user?.name || '';
    if (!currentUserName) {
      return {
        wins: 0,
        matchesPlayed: 0,
        bestHole: null,
        streak: 0,
        currentStreak: 0,
        avgPerHole: '-',
        birdies: 0,
        holeInOne: 0,
      };
    }

    let wins = 0;
    let bestHole = { strokes: Infinity, par: 0 };
    let streak = 0;
    let currentStreak = 0;
    let totalStrokes = 0;
    let totalHoles = 0;
    let birdies = 0;
    let holeInOne = 0;

    finishedMatches.forEach(match => {
      const userPlayer = match.players.find(p => p.name === currentUserName);
      if (!userPlayer) return;

      const userScores = match.scores.filter(s => s.playerId === userPlayer.id);
      
      if (match.winnerId === userPlayer.id) {
        wins++;
        currentStreak++;
        streak = Math.max(streak, currentStreak);
      } else {
        currentStreak = 0;
      }

      userScores.forEach(score => {
        totalStrokes += score.strokes;
        totalHoles++;
        const hole = match.holes.find(h => h.number === score.holeNumber);
        
        if (hole) {
          // Contar birdies (1 bajo par)
          if (score.strokes === hole.par - 1) {
            birdies++;
          }
          
          // Contar hole-in-one
          if (score.strokes === 1) {
            holeInOne++;
          }
          
          if (score.strokes < bestHole.strokes) {
            bestHole = { strokes: score.strokes, par: hole.par };
          }
        }
      });
    });

    return {
      wins,
      matchesPlayed: finishedMatches.length,
      bestHole: bestHole.strokes !== Infinity ? bestHole : null,
      streak,
      currentStreak,
      avgPerHole: totalHoles > 0 ? (totalStrokes / totalHoles).toFixed(1) : '-',
      birdies,
      holeInOne,
    };
  };

  const stats = getUserStats();

  // Achievements - usar datos de BD para determinar si están desbloqueados
  const achievements = [
    { id: 'first-win', code: 'first-win', name: 'Primera Victòria', icon: Trophy, unlocked: unlockedAchievements.has('first-win'), color: 'eagle', description: 'Guanya el teu primer partit' },
    { id: 'five-wins', code: 'five-wins', name: '5 Victòries', icon: Award, unlocked: unlockedAchievements.has('five-wins'), color: 'success', description: 'Guanya 5 partits' },
    { id: 'streak-3', code: 'streak-3', name: 'Ratxa de 3', icon: Flame, unlocked: unlockedAchievements.has('streak-3'), color: 'warning', description: 'Guanya 3 partits seguits' },
    { id: 'ten-matches', code: 'ten-matches', name: '10 Partits', icon: Target, unlocked: unlockedAchievements.has('ten-matches'), color: 'primary', description: 'Juga 10 partits' },
    { id: 'five-birdies', code: 'five-birdies', name: '5 Birdies', icon: Zap, unlocked: unlockedAchievements.has('five-birdies'), color: 'success', description: 'Fes 5 birdies en total' },
    { id: 'hole-in-one', code: 'hole-in-one', name: 'Hole in One', icon: Star, unlocked: unlockedAchievements.has('hole-in-one'), color: 'eagle', description: 'Fes un hole in one' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {profileImage ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: AVATAR_COLOR }}>
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-white"
                style={{ backgroundColor: AVATAR_COLOR }}
              >
                {(nickname || authUser?.username || user?.name)?.charAt(0).toUpperCase()}
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                />
              </div>
            )}
            <button
              onClick={() => {
                if (isEditing) {
                  fileInputRef.current?.click();
                } else {
                  setIsEditing(!isEditing);
                }
              }}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors z-10"
              disabled={isUploading || isSaving}
            >
              {isEditing ? (
                <Camera className="h-3 w-3 text-secondary-foreground" />
              ) : (
                <Edit2 className="h-3 w-3 text-secondary-foreground" />
              )}
            </button>
            {isEditing && profileImage && (
              <button
                onClick={() => setProfileImage(null)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center z-10"
                disabled={isUploading || isSaving}
              >
                <X className="h-3 w-3 text-destructive-foreground" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !authUser) return;

                // Validar tamaño (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                  toast({
                    title: 'Error',
                    description: 'La imatge és massa gran. Màxim 5MB.',
                    variant: 'destructive',
                  });
                  return;
                }

                // Validar tipo
                if (!file.type.startsWith('image/')) {
                  toast({
                    title: 'Error',
                    description: 'El fitxer ha de ser una imatge.',
                    variant: 'destructive',
                  });
                  return;
                }

                setIsUploading(true);
                try {
                  // Redimensionar y optimizar la imagen antes de convertirla a base64
                  const resizeImage = (file: File, maxWidth: number = 200, maxHeight: number = 200, quality: number = 0.6): Promise<string> => {
                    return new Promise((resolve, reject) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = (e) => {
                        const img = new Image();
                        img.src = e.target?.result as string;
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;

                          // Calcular nuevas dimensiones manteniendo la proporción
                          if (width > height) {
                            if (width > maxWidth) {
                              height = Math.round((height * maxWidth) / width);
                              width = maxWidth;
                            }
                          } else {
                            if (height > maxHeight) {
                              width = Math.round((width * maxHeight) / height);
                              height = maxHeight;
                            }
                          }

                          canvas.width = width;
                          canvas.height = height;

                          const ctx = canvas.getContext('2d');
                          if (!ctx) {
                            reject(new Error('No se pudo obtener el contexto del canvas'));
                            return;
                          }

                          // Mejorar la calidad de renderizado
                          ctx.imageSmoothingEnabled = true;
                          ctx.imageSmoothingQuality = 'high';
                          
                          ctx.drawImage(img, 0, 0, width, height);
                          
                          // Convertir a base64 con calidad más baja para reducir tamaño significativamente
                          // Usar webp si está disponible, si no jpeg
                          const base64 = canvas.toDataURL('image/webp', quality) || canvas.toDataURL('image/jpeg', quality);
                          
                          resolve(base64);
                        };
                        img.onerror = reject;
                      };
                      reader.onerror = reject;
                    });
                  };

                  // Optimizar y convertir a base64
                  const base64Image = await resizeImage(file);
                  
                  // Actualizar el estado local inmediatamente para preview
                  setProfileImage(base64Image);

                  // Guardar automáticamente en la base de datos
                  if (authUser) {
                    const success = await updateUser(undefined, base64Image);
                    if (success) {
                      // Refrescar datos del usuario y jugadores
                      await refreshUser();
                      await refreshPlayers();
                      
                      toast({
                        title: 'Imatge actualitzada',
                        description: 'La imatge s\'ha guardat correctament.',
                      });
                    } else {
                      toast({
                        title: 'Error',
                        description: 'Hi ha hagut un error en guardar la imatge.',
                        variant: 'destructive',
                      });
                    }
                  }
                } catch (error) {
                  console.error('Error processing image:', error);
                  toast({
                    title: 'Error',
                    description: 'Hi ha hagut un error en processar la imatge.',
                    variant: 'destructive',
                  });
                } finally {
                  setIsUploading(false);
                }
              }}
            />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Nom o nickname"
                  className="h-9"
                  disabled={isSaving || isUploading}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={async () => {
                      if (!authUser) return;
                      
                      setIsSaving(true);
                      try {
                        // Actualizar nombre y/o foto
                        const success = await updateUser(
                          nickname.trim() !== authUser.username ? nickname.trim() : undefined,
                          profileImage || undefined
                        );

                        if (success) {
                          // Refrescar datos del usuario y jugadores
                          await refreshUser();
                          await refreshPlayers();
                          
                          setIsEditing(false);
                          toast({
                            title: 'Perfil actualitzat',
                            description: 'Els canvis s\'han guardat correctament.',
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Hi ha hagut un error en guardar els canvis.',
                            variant: 'destructive',
                          });
                        }
                      } catch (error) {
                        console.error('Error saving profile:', error);
                        toast({
                          title: 'Error',
                          description: 'Hi ha hagut un error inesperat.',
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving || isUploading || !nickname.trim()}
                  >
                    {isSaving ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      // Cancelar edición y restaurar valores originales
                      if (authUser) {
                        setNickname(authUser.username);
                        setProfileImage(authUser.profile_image || null);
                      }
                      setIsEditing(false);
                    }}
                    disabled={isSaving || isUploading}
                  >
                    Cancel·lar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-medium text-foreground">{nickname || authUser?.username || user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-warning">{authUser?.level || user?.level || 'Rookie'}</span>
                  <Medal className="h-4 w-4 text-warning" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-xl font-medium text-foreground">{stats.matchesPlayed}</p>
            <p className="text-xs text-muted-foreground">Partits</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-medium text-success">{stats.wins}</p>
            <p className="text-xs text-muted-foreground">Victòries</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-medium text-primary">{stats.avgPerHole}</p>
            <p className="text-xs text-muted-foreground">Avg/Forat</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-medium text-eagle">{stats.streak}</p>
            <p className="text-xs text-muted-foreground">Max Ratxa</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 mb-4">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Medal className="h-4 w-4 text-eagle" />
          Medalles i Trofeus
        </h3>
        <div className="grid grid-cols-2 gap-3 pb-2">
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={achievement.unlocked ? { scale: 1.05 } : {}}
              className={`p-4 rounded-xl border-2 transition-all ${
                achievement.unlocked
                  ? achievement.color === 'eagle' 
                    ? 'bg-eagle/10 border-eagle/50 shadow-md'
                    : achievement.color === 'success'
                    ? 'bg-success/10 border-success/50 shadow-md'
                    : achievement.color === 'warning'
                    ? 'bg-warning/10 border-warning/50 shadow-md'
                    : 'bg-primary/10 border-primary/50 shadow-md'
                  : 'bg-muted/30 border-border/30 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  achievement.unlocked
                    ? achievement.color === 'eagle' 
                      ? 'bg-eagle/20'
                      : achievement.color === 'success'
                      ? 'bg-success/20'
                      : achievement.color === 'warning'
                      ? 'bg-warning/20'
                      : 'bg-primary/20'
                    : 'bg-muted'
                }`}>
                  <achievement.icon
                    className={`h-5 w-5 ${
                      achievement.unlocked 
                        ? achievement.color === 'eagle' 
                          ? 'text-eagle'
                          : achievement.color === 'success'
                          ? 'text-success'
                          : achievement.color === 'warning'
                          ? 'text-warning'
                          : 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                </div>
                {achievement.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-lg"
                  >
                    ✨
                  </motion.div>
                )}
              </div>
              <p className={`text-xs font-medium ${
                achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {achievement.name}
              </p>
              {achievement.description && (
                <p className={`text-xs mt-1 ${
                  achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
                }`}>
                  {achievement.description}
                </p>
              )}
              {achievement.unlocked && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-success mt-1 font-medium"
                >
                  ✓ Desbloquejat
                </motion.p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Match History - Solo lectura */}
      {finishedMatches.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <h3 className="font-medium text-foreground mb-4">Historial de Partits</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Els partits acabats només es poden visualitzar, no editar
          </p>
          <div className="space-y-2">
            {finishedMatches.slice(0, 5).map((match) => {
              const currentUserName = authUser?.username || user?.name || '';
              const userPlayer = match.players.find(p => p.name === currentUserName);
              if (!userPlayer) return null;

              // Calcular posición del usuario en el partido
              const allPlayerScores = match.players.map(p => ({
                player: p,
                total: match.scores
                  .filter(s => s.playerId === p.id)
                  .reduce((sum, s) => sum + s.strokes, 0)
              })).sort((a, b) => a.total - b.total);

              const userPosition = allPlayerScores.findIndex(item => item.player.id === userPlayer.id) + 1;

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{match.name}</p>
                    <p className="text-xs text-muted-foreground">{match.course}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      userPosition === 1 ? 'text-eagle' :
                      userPosition === 2 ? 'text-muted-foreground' :
                      userPosition === 3 ? 'text-amber-600' :
                      'text-muted-foreground'
                    }`}>
                      {userPosition}º
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logout */}
      <Button variant="outline" className="w-full" onClick={onLogout}>
        <LogOut className="h-4 w-4 mr-2" />
        Tancar sessió
      </Button>
    </div>
  );
};
