import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { SplashScreen } from '@/components/SplashScreen';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Cuando el usuario está autenticado, mostrar splash
    if (isAuthenticated) {
      setShowSplash(true);
    }
  }, [isAuthenticated]);

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
