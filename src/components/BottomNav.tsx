import { Home, Trophy, User, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavProps {
  activeTab: 'home' | 'hall' | 'stats' | 'profile';
  onTabChange: (tab: 'home' | 'hall' | 'stats' | 'profile') => void;
}

const tabs = [
  { id: 'home' as const, icon: Home, label: 'Partides' },
  { id: 'hall' as const, icon: Trophy, label: 'Hall of Fame' },
  { id: 'stats' as const, icon: BarChart3, label: 'Estadístiques' },
  { id: 'profile' as const, icon: User, label: 'Perfil' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border safe-bottom">
      <nav className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 py-2 px-4 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`h-5 w-5 relative z-10 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span
                className={`text-xs font-medium relative z-10 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
