import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { SplashScreen } from '@/components/SplashScreen';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [hasShownSplash, setHasShownSplash] = useState(() => {
    // Verificar si ya se mostró el splash en esta sesión
    return sessionStorage.getItem('greenHuntersSplashShown') === 'true';
  });

  useEffect(() => {
    // Cuando el usuario está autenticado, mostrar splash solo la primera vez en la sesión
    if (isAuthenticated && !hasShownSplash) {
      setShowSplash(true);
      setHasShownSplash(true);
      sessionStorage.setItem('greenHuntersSplashShown', 'true');
    }
  }, [isAuthenticated, hasShownSplash]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <Dashboard />;
};

export default Index;
