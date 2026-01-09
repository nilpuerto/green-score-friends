import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target, Award, Medal, Flame, Zap, Star } from 'lucide-react';
import { Match, Player } from '@/types/golf';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayers } from '@/contexts/PlayerContext';
import { useMatch } from '@/contexts/MatchContext';
import { supabase } from '@/lib/supabase';
import { AVATAR_COLOR } from '@/lib/utils';

export default function PlayerProfile() {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { players } = usePlayers();
  const { matches } = useMatch();
  const [playerData, setPlayerData] = useState<any>(null);
  const [playerLevel, setPlayerLevel] = useState<string>('Rookie');
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!playerId) {
        navigate('/');
        return;
      }

      try {
        // Primero buscar en el contexto de jugadores para obtener el ID correcto
        const contextPlayer = players.find(p => p.id === playerId || p.name === playerId);
        
        // Determinar el ID real del usuario
        let userId = playerId;
        if (contextPlayer) {
          userId = contextPlayer.id;
          // Si el ID empieza con "user-", extraer el ID real
          if (userId.startsWith('user-')) {
            userId = userId.replace('user-', '');
          }
        } else if (playerId.startsWith('user-')) {
          userId = playerId.replace('user-', '');
        }

        // Buscar el jugador en la base de datos
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, profile_image, level_id')
          .eq('id', userId)
          .single();

        if (error || !userData) {
          // Si no está en BD pero está en el contexto, usar datos del contexto
          if (contextPlayer) {
            setPlayerData({
              id: contextPlayer.id,
              username: contextPlayer.name,
              profile_image: contextPlayer.avatar || null,
            });
            setLoading(false);
            return;
          }
          navigate('/');
          return;
        }

        setPlayerData(userData);

        // Cargar nivel
        if (userData.level_id) {
          const { data: levelData } = await supabase
            .from('levels')
            .select('display_name')
            .eq('id', userData.level_id)
            .single();

          if (levelData) {
            setPlayerLevel(levelData.display_name);
          } else {
            // Si no tiene nivel asignado, calcularlo desde achievements
            const { data: userAchievements } = await supabase
              .from('user_achievements')
              .select('achievement_id')
              .eq('user_id', userData.id);

            const achievementsCount = userAchievements?.length || 0;

            const { data: allLevels } = await supabase
              .from('levels')
              .select('display_name, required_achievements_count, order_index')
              .order('order_index', { ascending: true });

            if (allLevels && allLevels.length > 0) {
              for (let i = allLevels.length - 1; i >= 0; i--) {
                if (achievementsCount >= allLevels[i].required_achievements_count) {
                  setPlayerLevel(allLevels[i].display_name);
                  break;
                }
              }
            }
          }
        } else {
          // Si no tiene level_id, calcularlo desde achievements
          const { data: userAchievements } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userData.id);

          const achievementsCount = userAchievements?.length || 0;

          const { data: allLevels } = await supabase
            .from('levels')
            .select('display_name, required_achievements_count, order_index')
            .order('order_index', { ascending: true });

          if (allLevels && allLevels.length > 0) {
            for (let i = allLevels.length - 1; i >= 0; i--) {
              if (achievementsCount >= allLevels[i].required_achievements_count) {
                setPlayerLevel(allLevels[i].display_name);
                break;
              }
            }
          }
        }

        // Cargar achievements desbloqueados
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id, achievements(code)')
          .eq('user_id', userData.id);

        const unlockedCodes = new Set<string>();
        userAchievements?.forEach((ua: any) => {
          if (ua.achievements?.code) {
            unlockedCodes.add(ua.achievements.code);
          }
        });

        setUnlockedAchievements(unlockedCodes);
      } catch (error) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerData();
  }, [playerId, navigate, players]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Carregant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return null;
  }

  const finishedMatches = matches.filter(m => m.status === 'finished');
  const playerName = playerData.username;

  // Calcular estadísticas del jugador
  const getPlayerStats = () => {
    let wins = 0;
    let bestHole = { strokes: Infinity, par: 0 };
    let streak = 0;
    let currentStreak = 0;
    let totalStrokes = 0;
    let totalHoles = 0;
    let birdies = 0;
    let holeInOne = 0;

    finishedMatches.forEach(match => {
      const userPlayer = match.players.find(p => p.name === playerName);
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
      matchesPlayed: finishedMatches.filter(m => 
        m.players.some(p => p.name === playerName)
      ).length,
      bestHole: bestHole.strokes !== Infinity ? bestHole : null,
      streak,
      currentStreak,
      avgPerHole: totalHoles > 0 ? (totalStrokes / totalHoles).toFixed(1) : '-',
      birdies,
      holeInOne,
    };
  };

  const stats = getPlayerStats();

  // Achievements
  const achievements = [
    { id: 'first-win', code: 'first-win', name: 'Primera Victòria', icon: Trophy, unlocked: unlockedAchievements.has('first-win'), color: 'eagle', description: 'Guanya el teu primer partit' },
    { id: 'five-wins', code: 'five-wins', name: '5 Victòries', icon: Award, unlocked: unlockedAchievements.has('five-wins'), color: 'success', description: 'Guanya 5 partits' },
    { id: 'streak-3', code: 'streak-3', name: 'Ratxa de 3', icon: Flame, unlocked: unlockedAchievements.has('streak-3'), color: 'warning', description: 'Guanya 3 partits seguits' },
    { id: 'ten-matches', code: 'ten-matches', name: '10 Partits', icon: Target, unlocked: unlockedAchievements.has('ten-matches'), color: 'primary', description: 'Juga 10 partits' },
    { id: 'five-birdies', code: 'five-birdies', name: '5 Birdies', icon: Zap, unlocked: unlockedAchievements.has('five-birdies'), color: 'success', description: 'Fes 5 birdies en total' },
    { id: 'hole-in-one', code: 'hole-in-one', name: 'Hole in One', icon: Star, unlocked: unlockedAchievements.has('hole-in-one'), color: 'eagle', description: 'Fes un hole in one' },
  ];

  // Encontrar el jugador en el contexto para obtener su color
  const contextPlayer = players.find(p => p.id === playerId || p.name === playerName);
  const playerColor = contextPlayer?.color || AVATAR_COLOR;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back button */}
        <button
          onClick={() => {
            // Usar navigate(-1) para volver sin recargar
            navigate(-1);
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Tornar</span>
        </button>

        {/* Profile Card */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              {playerData.profile_image ? (
                <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: playerColor }}>
                  <img 
                    src={playerData.profile_image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium text-white"
                  style={{ backgroundColor: playerColor }}
                >
                  {playerName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-medium text-foreground">{playerName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-warning">{playerLevel}</span>
                <Medal className="h-4 w-4 text-warning" />
              </div>
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
                <p className={`text-xs mt-1 ${
                  achievement.unlocked ? 'text-muted-foreground' : 'text-muted-foreground/70'
                }`}>
                  {achievement.description}
                </p>
                {achievement.unlocked && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-success font-medium">Desbloquejat</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

