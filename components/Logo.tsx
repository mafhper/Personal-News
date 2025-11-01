import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBackground?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className = '', 
  showBackground = true,
  onClick,
  isClickable = false
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

  const baseClasses = isClickable 
    ? 'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg' 
    : '';

  const backgroundClasses = isClickable
    ? 'bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700'
    : 'bg-gradient-to-br from-gray-600 to-gray-800';

  if (!showBackground) {
    const svgElement = (
      <svg 
        className={`${iconSizes[size]} text-white ${className} ${baseClasses}`} 
        fill="currentColor" 
        viewBox="0 0 100 100"
        onClick={onClick}
      >
        <polygon points="50,75 25,35 75,35" />
      </svg>
    );

    if (isClickable) {
      return (
        <div title="Configurações">
          {svgElement}
        </div>
      );
    }

    return svgElement;
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${backgroundClasses} rounded-lg flex items-center justify-center ${className} ${baseClasses}`}
      onClick={onClick}
      title={isClickable ? "Configurações" : undefined}
    >
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