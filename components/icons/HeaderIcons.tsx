import React from 'react';

interface HeaderIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  title?: string;
}

const HeaderIcon: React.FC<HeaderIconProps & { children: React.ReactNode }> = ({
  className = '',
  size = 'md',
  showBackground = true,
  isActive = false,
  onClick,
  title,
  children
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const baseClasses = onClick 
    ? 'cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg' 
    : '';

  const backgroundClasses = onClick
    ? isActive 
      ? 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600'
      : 'bg-gradient-to-br from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700'
    : isActive
      ? 'bg-gradient-to-br from-blue-500 to-blue-700'
      : 'bg-gradient-to-br from-gray-600 to-gray-800';

  if (!showBackground) {
    return (
      <div 
        className={`${iconSizes[size]} text-white ${className} ${baseClasses}`}
        onClick={onClick}
        title={title}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${backgroundClasses} rounded-lg flex items-center justify-center ${className} ${baseClasses}`}
      onClick={onClick}
      title={title}
    >
      <div className={`${iconSizes[size]} text-white`}>
        {children}
      </div>
    </div>
  );
};

export const HeaderIcons = {
  Refresh: (props: HeaderIconProps) => (
    <HeaderIcon {...props}>
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </HeaderIcon>
  ),

  Favorites: (props: HeaderIconProps) => (
    <HeaderIcon {...props}>
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </HeaderIcon>
  ),

  Menu: (props: HeaderIconProps) => (
    <HeaderIcon {...props}>
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" 
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </HeaderIcon>
  ),

  Feeds: (props: HeaderIconProps) => (
    <HeaderIcon {...props}>
      <svg fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" 
              stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </HeaderIcon>
  ),

  Settings: (props: HeaderIconProps) => (
    <HeaderIcon {...props}>
      <svg fill="currentColor" viewBox="0 0 100 100">
        <polygon points="50,75 25,35 75,35" />
      </svg>
    </HeaderIcon>
  )
};