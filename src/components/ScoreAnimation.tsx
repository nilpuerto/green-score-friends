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
    // Si type es null, detener inmediatamente
    if (!type) {
      setShow(false);
      onComplete?.();
      return;
    }
    
    setShow(true);
    
    let frameId: number | null = null;
    const timeouts: NodeJS.Timeout[] = [];
      
    if (type === 'hole-in-one') {
      // Animación alucinante para hole-in-one
      const duration = 5000;
      const end = Date.now() + duration;
      
      const frame = () => {
        if (Date.now() >= end) return;
        
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'],
        });
        
        if (Date.now() < end) {
          frameId = requestAnimationFrame(frame);
        }
      };
      frame();
      
      // Explosión central múltiple
      for (let i = 0; i < 5; i++) {
        const timeout = setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 360,
            origin: { y: 0.5, x: 0.5 },
            colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FFA500'],
            shapes: ['circle', 'square'],
          });
        }, i * 300);
        timeouts.push(timeout);
      }
    } else if (type === 'birdie') {
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
      const timeout = setTimeout(() => {
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
      timeouts.push(timeout);
    }

    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, type === 'hole-in-one' ? 5000 : 2000);
    timeouts.push(timer);

    return () => {
      // Limpiar todos los timeouts y animaciones
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      timeouts.forEach(timeout => clearTimeout(timeout));
      setShow(false);
    };
  }, [type, onComplete]);

  const getContent = () => {
    switch (type) {
      case 'hole-in-one':
        return { emoji: '🏆', text: 'HOLE IN ONE!!!', color: 'text-eagle' };
      case 'eagle':
        return { emoji: '🦅', text: 'EAGLE!', color: 'text-eagle' };
      case 'birdie':
        return { emoji: '🐦', text: 'BIRDIE!', color: 'text-success' };
      case 'par':
        return { emoji: '✓', text: 'Par', color: 'text-primary' };
      case 'bogey':
        return { emoji: '😔', text: 'Bogey', color: 'text-warning' };
      case 'double-bogey':
        return { emoji: '😓', text: 'Double Bogey', color: 'text-destructive' };
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
              className={`block mb-2 ${type === 'hole-in-one' ? 'text-9xl' : 'text-7xl'}`}
            >
              {content.emoji}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`${type === 'hole-in-one' ? 'text-5xl' : 'text-3xl'} font-bold ${content.color}`}
              style={type === 'hole-in-one' ? {
                textShadow: '0 0 20px currentColor, 0 0 40px currentColor',
              } : {}}
            >
              {content.text}
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
