import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Edit2, Trophy, Target, Award, Medal, Flame } from 'lucide-react';
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

  const finishedMatches = matches.filter(m => m.status === 'finished');

  // Calculate user stats (assuming user is player '1')
  const getUserStats = () => {
    let wins = 0;
    let bestHole = { strokes: Infinity, par: 0 };
    let streak = 0;
    let currentStreak = 0;
    let totalStrokes = 0;
    let totalHoles = 0;

    finishedMatches.forEach(match => {
      const userScores = match.scores.filter(s => s.playerId === '1');
      
      if (match.winnerId === '1') {
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
        if (hole && score.strokes < bestHole.strokes) {
          bestHole = { strokes: score.strokes, par: hole.par };
        }
      });
    });

    return {
      wins,
      matchesPlayed: finishedMatches.length,
      bestHole: bestHole.strokes !== Infinity ? bestHole : null,
      streak,
      avgPerHole: totalHoles > 0 ? (totalStrokes / totalHoles).toFixed(1) : '-',
    };
  };

  const stats = getUserStats();

  // Achievements
  const achievements = [
    { id: 'first-win', name: 'Primera Victòria', icon: Trophy, unlocked: stats.wins >= 1, color: 'eagle' },
    { id: 'five-wins', name: '5 Victòries', icon: Award, unlocked: stats.wins >= 5, color: 'success' },
    { id: 'streak-3', name: 'Ratxa de 3', icon: Flame, unlocked: stats.streak >= 3, color: 'warning' },
    { id: 'ten-matches', name: '10 Partits', icon: Target, unlocked: stats.matchesPlayed >= 10, color: 'primary' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-2xl font-medium text-primary-foreground">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center"
            >
              <Edit2 className="h-3 w-3 text-secondary-foreground" />
            </button>
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
                <p className="text-sm text-muted-foreground">{user?.email}</p>
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
              className={`p-3 rounded-xl border ${
                achievement.unlocked
                  ? `bg-${achievement.color}/10 border-${achievement.color}/30`
                  : 'bg-muted/50 border-border/30 opacity-50'
              }`}
            >
              <achievement.icon
                className={`h-5 w-5 mb-2 ${
                  achievement.unlocked ? `text-${achievement.color}` : 'text-muted-foreground'
                }`}
              />
              <p className={`text-xs font-medium ${
                achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {achievement.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Match History */}
      {finishedMatches.length > 0 && (
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <h3 className="font-medium text-foreground mb-4">Historial de Partits</h3>
          <div className="space-y-2">
            {finishedMatches.slice(0, 5).map((match) => {
              const userScore = match.scores
                .filter(s => s.playerId === '1')
                .reduce((sum, s) => sum + s.strokes, 0);
              const isWinner = match.winnerId === '1';

              return (
                <div
                  key={match.id}
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
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
