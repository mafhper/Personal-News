import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBackground?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showBackground = true 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  if (!showBackground) {
    return (
      <svg 
        className={`${iconSizes[size]} text-white ${className}`} 
        fill="currentColor" 
        viewBox="0 0 100 100"
      >
        <polygon points="50,75 25,35 75,35" />
      </svg>
    );
  }

  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center ${className}`}>
      <svg 
        className={`${iconSizes[size]} text-white`} 
        fill="currentColor" 
        viewBox="0 0 100 100"
      >
        <polygon points="50,75 25,35 75,35" />
      </svg>
    </div>
  );
};

export default Logo;