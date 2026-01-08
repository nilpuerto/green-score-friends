import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ScoreType } from '@/types/golf';

interface ScoreAnimationProps {
  type: ScoreType | null;
  onComplete?: () => void;
}

export const ScoreAnimation: React.FC<ScoreAnimationProps> = ({ type, onComplete }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (type) {
      setShow(true);
      
      if (type === 'birdie') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#1B5E3C', '#2D7A50', '#3D9A64', '#FFD700'],
        });
      } else if (type === 'eagle') {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF8C00'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FFD700', '#FFA500'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FFD700', '#FFA500'],
          });
        }, 200);
      }

      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [type, onComplete]);

  const getContent = () => {
    switch (type) {
      case 'eagle':
        return { emoji: '🦅', text: 'EAGLE!', color: 'text-eagle' };
      case 'birdie':
        return { emoji: '🐦', text: 'BIRDIE!', color: 'text-success' };
      case 'par':
        return { emoji: '✓', text: 'Par', color: 'text-primary' };
      case 'bogey':
        return { emoji: '😅', text: 'Bogey', color: 'text-warning' };
      case 'double-bogey':
        return { emoji: '😬', text: 'Double Bogey', color: 'text-destructive' };
      default:
        return null;
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {show && content && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.5 }}
              className="text-7xl block mb-2"
            >
              {content.emoji}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-3xl font-bold ${content.color}`}
            >
              {content.text}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
