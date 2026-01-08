import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('greenHuntersUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (name: string, password: string): Promise<boolean> => {
    // Simulate login - in production, this would call an API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (name && password.length >= 4) {
      const newUser = {
        id: crypto.randomUUID(),
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@greenhunter.local`, // Generate email from name
      };
      setUser(newUser);
      localStorage.setItem('greenHuntersUser', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (name && email && password.length >= 4) {
      const newUser = {
        id: crypto.randomUUID(),
        name,
        email,
      };
      setUser(newUser);
      localStorage.setItem('greenHuntersUser', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('greenHuntersUser');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
