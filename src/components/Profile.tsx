import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Edit2, Trophy, Target, Award, Medal, Flame, Camera, X, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Match, Player } from '@/types/golf';
import { PlayerAvatar } from './PlayerAvatar';

interface ProfileProps {
  user: { name: string; email: string } | null;
  matches: Match[];
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, matches, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Calculate user stats
  const getUserStats = () => {
    if (!user) {
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
      const userPlayer = match.players.find(p => p.name === user.name);
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

  // Achievements
  const achievements = [
    { id: 'first-win', name: 'Primera Victòria', icon: Trophy, unlocked: stats.wins >= 1, color: 'eagle', description: 'Guanya el teu primer partit' },
    { id: 'five-wins', name: '5 Victòries', icon: Award, unlocked: stats.wins >= 5, color: 'success', description: 'Guanya 5 partits' },
    { id: 'streak-3', name: 'Ratxa de 3', icon: Flame, unlocked: stats.streak >= 3, color: 'warning', description: 'Guanya 3 partits seguits' },
    { id: 'ten-matches', name: '10 Partits', icon: Target, unlocked: stats.matchesPlayed >= 10, color: 'primary', description: 'Juga 10 partits' },
    { id: 'five-birdies', name: '5 Birdies', icon: Zap, unlocked: stats.birdies >= 5, color: 'success', description: 'Fes 5 birdies en total' },
    { id: 'hole-in-one', name: 'Hole in One', icon: Star, unlocked: stats.holeInOne >= 1, color: 'eagle', description: 'Fes un hole in one' },
  ];

  return (
    <div className="space-y-4 pb-4">
      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {profileImage ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-medium text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
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
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
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
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3 text-destructive-foreground" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setProfileImage(reader.result as string);
                  };
                  reader.readAsDataURL(file);
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
                />
                <Button size="sm" onClick={() => setIsEditing(false)}>
                  Guardar
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-medium text-foreground">{nickname || user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-warning">Rookie</span>
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
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <Medal className="h-4 w-4 text-eagle" />
          Medalles i Trofeus
        </h3>
        <div className="grid grid-cols-2 gap-3">
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
              const userPlayer = match.players.find(p => p.name === user?.name);
              const userScore = userPlayer
                ? match.scores
                    .filter(s => s.playerId === userPlayer.id)
                    .reduce((sum, s) => sum + s.strokes, 0)
                : 0;
              const isWinner = userPlayer && match.winnerId === userPlayer.id;

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
                    <span className="text-sm font-medium text-foreground">{userScore}</span>
                    {isWinner && (
                      <Trophy className="h-4 w-4 text-eagle" />
                    )}
                    <span className="text-xs text-muted-foreground">Acabat</span>
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
