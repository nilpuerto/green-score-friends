import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  username: string;
  level?: string;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (username?: string, profileImage?: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'greenHuntersUserSession';
const SESSION_EXPIRY_DAYS = 30;

interface SessionData {
  user: User;
  expiryDate: string; // ISO string
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedSession = localStorage.getItem(SESSION_KEY);
        if (!savedSession) {
          setUser(null);
          return;
        }

        const sessionData: SessionData = JSON.parse(savedSession);
        const expiryDate = new Date(sessionData.expiryDate);
        const now = new Date();

        // Verificar si la sesión ha expirado (30 días)
        if (now > expiryDate) {
          // Sesión expirada, limpiar y pedir login
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
          return;
        }

        // Sesión válida, restaurar usuario
        // Verificar que el usuario aún existe en la BD
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, level_id, profile_image')
          .eq('id', sessionData.user.id)
          .single();

        if (error || !userData) {
          // Usuario no existe en BD, limpiar sesión
          localStorage.removeItem(SESSION_KEY);
          setUser(null);
          return;
        }

        // Calcular nivel según achievements actuales
        const { data: userAchievements } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', userData.id);

        const achievementsCount = userAchievements?.length || 0;

        // Obtener todos los niveles ordenados
        const { data: allLevels } = await supabase
          .from('levels')
          .select('id, display_name, required_achievements_count, order_index')
          .order('order_index', { ascending: true });

        let levelName = 'Rookie';
        let levelId = null;

        if (allLevels && allLevels.length > 0) {
          // Encontrar el nivel más alto que el usuario puede alcanzar
          for (let i = allLevels.length - 1; i >= 0; i--) {
            if (achievementsCount >= allLevels[i].required_achievements_count) {
              levelName = allLevels[i].display_name;
              levelId = allLevels[i].id;
              break;
            }
          }
          // Si no encuentra ninguno, usar Rookie (el primero)
          if (!levelId && allLevels.length > 0) {
            levelName = allLevels[0].display_name;
            levelId = allLevels[0].id;
          }
        }

        // Si el level_id en BD no coincide, actualizarlo
        if (userData.level_id !== levelId && levelId) {
          await supabase
            .from('users')
            .update({ level_id: levelId })
            .eq('id', userData.id);
        }

        // Actualizar datos del usuario desde BD
        const updatedUser: User = {
          id: userData.id,
          name: userData.username,
          username: userData.username,
          level: levelName,
          profile_image: userData.profile_image || undefined,
        };

        setUser(updatedUser);

        // Actualizar sesión con datos actualizados
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + SESSION_EXPIRY_DAYS);
        const updatedSession: SessionData = {
          user: updatedUser,
          expiryDate: newExpiryDate.toISOString(),
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      }
    };

    checkSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Buscar usuario por username en Supabase REST API
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('id, username, password_hash, level_id, profile_image')
        .eq('username', username)
        .single();

      if (fetchError || !userData) {
        // Usuario no encontrado
        return { success: false, error: 'user_not_found' };
      }

      // Verificar contraseña usando bcrypt en el cliente
      const passwordMatch = await verifyPassword(password, userData.password_hash);
      
      if (!passwordMatch) {
        // Contraseña incorrecta
        return { success: false, error: 'wrong_password' };
      }

      // Obtener información del nivel
      let levelName = 'Rookie';
      if (userData.level_id) {
        const { data: level } = await supabase
          .from('levels')
          .select('display_name')
          .eq('id', userData.level_id)
          .single();
        if (level) {
          levelName = level.display_name;
        }
      }

      const user: User = {
        id: userData.id,
        name: userData.username,
        username: userData.username,
        level: levelName,
        profile_image: userData.profile_image || undefined,
      };

      setUser(user);

      // Guardar sesión en localStorage con fecha de expiración (30 días)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);
      const sessionData: SessionData = {
        user,
        expiryDate: expiryDate.toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'unknown' };
    }
  };

  // Función helper para verificar contraseña
  const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    try {
      // Usar bcryptjs para comparar en el cliente
      const bcrypt = await import('bcryptjs');
      return await bcrypt.compare(password, hash);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // No hay registro, solo login
    return false;
  };

  const logout = () => {
    setUser(null);
    // Limpiar sesión de localStorage
    localStorage.removeItem(SESSION_KEY);
    // El componente Index se actualizará automáticamente cuando isAuthenticated cambie
  };

  // Función para actualizar datos del usuario
  const updateUser = async (username?: string, profileImage?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const updateData: { username?: string; profile_image?: string; updated_at?: string } = {};
      
      if (username !== undefined) {
        updateData.username = username;
      }
      
      if (profileImage !== undefined) {
        updateData.profile_image = profileImage;
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        return false;
      }

      // Actualizar el estado local del usuario
      await refreshUser();
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  // Función para refrescar los datos del usuario desde la BD
  const refreshUser = async () => {
    if (!user) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, username, level_id, profile_image')
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        console.error('Error refreshing user:', error);
        return;
      }

      // Calcular nivel según achievements actuales
      const { data: userAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, id')
        .eq('user_id', userData.id);

      if (achievementsError) {
        // Silently handle error
      }

      const achievementsCount = userAchievements?.length || 0;

      // Obtener todos los niveles ordenados
      const { data: allLevels, error: levelsError } = await supabase
        .from('levels')
        .select('id, display_name, required_achievements_count, order_index')
        .order('order_index', { ascending: true });

      if (levelsError) {
        // Silently handle error
      }

      let levelName = 'Rookie';
      let levelId = null;

      if (allLevels && allLevels.length > 0) {
        // Encontrar el nivel más alto que el usuario puede alcanzar
        for (let i = allLevels.length - 1; i >= 0; i--) {
          if (achievementsCount >= allLevels[i].required_achievements_count) {
            levelName = allLevels[i].display_name;
            levelId = allLevels[i].id;
            break;
          }
        }
        // Si no encuentra ninguno, usar Rookie (el primero)
        if (!levelId && allLevels.length > 0) {
          levelName = allLevels[0].display_name;
          levelId = allLevels[0].id;
        }
      }

      // Si el level_id en BD no coincide, actualizarlo
      if (userData.level_id !== levelId && levelId) {
        await supabase
          .from('users')
          .update({ level_id: levelId })
          .eq('id', userData.id);
      }

      const updatedUser: User = {
        id: userData.id,
        name: userData.username,
        username: userData.username,
        level: levelName,
        profile_image: userData.profile_image || undefined,
      };

      setUser(updatedUser);

      // Actualizar sesión en localStorage con datos actualizados
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        const sessionData: SessionData = JSON.parse(savedSession);
        const updatedSession: SessionData = {
          user: updatedUser,
          expiryDate: sessionData.expiryDate, // Mantener la misma fecha de expiración
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, updateUser, refreshUser }}>
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
