import { motion } from 'framer-motion';

interface PlayerAvatarProps {
  name: string;
  avatar?: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isLeader?: boolean;
  animate?: boolean;
}

const sizeClasses = {
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

  const content = (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white relative shadow-md`}
      style={{ backgroundColor: color }}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
      {isLeader && (
        <span className="absolute -top-1 -right-1 text-sm">👑</span>
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
