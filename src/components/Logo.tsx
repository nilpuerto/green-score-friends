import logo from '@/assets/logo.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  return (
    <div className="flex items-center gap-2">
      <img 
        src={logo} 
        alt="Green Hunters" 
        className={`${sizeClasses[size]} object-contain rounded-lg`}
      />
      {showText && (
        <span className={`font-normal tracking-tight text-foreground ${textSizeClasses[size]}`}>
          Green Hunters
        </span>
      )}
    </div>
  );
};
