import logo from '@/assets/logo.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
  xl: 'h-32 w-32',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl',
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  return (
    <div className="flex items-center gap-2">
      <img 
        src={logo} 
        alt="Green Hunter" 
        className={`${sizeClasses[size]} object-contain rounded-lg`}
      />
      {showText && (
        <span className={`font-normal tracking-wide text-primary ${textSizeClasses[size]}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
          Green Hunter
        </span>
      )}
    </div>
  );
};
