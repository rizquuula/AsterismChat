import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const colors = [
  '#FF453A', '#FF9F0A', '#30D158', '#0A84FF', '#5E5CE6',
  '#BF5AF2', '#FF375F', '#64D2FF', '#32D74B', '#AC8E68',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const color = getColorFromName(name);
  const initial = name.charAt(0).toUpperCase();

  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}