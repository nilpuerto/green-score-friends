import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (errorType?: string): string => {
    switch (errorType) {
      case 'user_not_found':
        return 'Incorrecta, ets down o que? No saps entrar un compte?';
      case 'wrong_password':
        return 'Incorrecta, ets down o que? No saps entrar un compte?';
      default:
        return 'Incorrecta, ets down o que? No saps entrar un compte?';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(name, password);

      if (!result.success) {
        toast({
          title: 'Error',
          description: getErrorMessage(result.error),
          variant: 'destructive',
        });
      }
      // Si es exitoso, el AuthContext actualizará el estado y Index redirigirá automáticamente
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hi ha hagut un error inesperat. Torna-ho a provar.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Tarjeta del formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100"
        >
          <div className="text-center mb-5">
            <p className="text-xs font-light text-primary tracking-wide mb-1" style={{ letterSpacing: '0.1em' }}>
              GreenHunters
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              Benvingut de nou!
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Nom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Introdueix el teu nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 text-sm rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white transition-colors"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Contrasenya</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Introdueix la teva contrasenya"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-sm rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white transition-colors"
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  required
                  minLength={4}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>


            <Button
              type="submit"
              size="lg"
              className="w-full h-11 rounded-lg bg-primary text-white hover:bg-primary/90 font-semibold text-sm shadow-md transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};
