import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Mostrar el logo después de un pequeño delay
    const showTimer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    // Completar después de 2 segundos
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.25, 0.1, 0.25, 1] // ease-in-out suave
            }}
            className="flex items-center justify-center"
          >
            <Logo size="xl" showText={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

