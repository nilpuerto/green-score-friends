import { motion } from 'framer-motion';
import { AVATAR_COLOR } from '@/lib/utils';

interface PlayerAvatarProps {
  name: string;
  avatar?: string;
  color?: string; // Opcional ahora, se usa AVATAR_COLOR por defecto
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLeader?: boolean;
  animate?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  name,
  avatar,
  color,
  size = 'md',
  isLeader = false,
  animate = false,
}) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  // Usar siempre el color verde normal para avatares, ignorar el color pasado
  const avatarColor = AVATAR_COLOR;

  const content = (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white relative shadow-md`}
      style={{ backgroundColor: avatarColor }}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
      {isLeader && (
        <span className={`absolute -top-1 -right-1 ${
          size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-xs' : 'text-sm'
        }`}>👑</span>
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};
