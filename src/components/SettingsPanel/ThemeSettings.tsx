import React from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';

interface ThemeSettingsProps {
  className?: string;
}

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'system', label: 'System', icon: '💻' },
];

export function ThemeSettings({ className = '' }: ThemeSettingsProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className={`p-4 bg-[#2C2C2E] rounded-xl ${className}`}>
      <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3">
        Appearance
      </h3>
      <div className="flex gap-2">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
              theme === option.value
                ? 'bg-[#0A84FF] text-white'
                : 'bg-[#1C1C1E] text-[#8E8E93] hover:bg-[#3C3C3E]'
            }`}
          >
            <span className="text-xl">{option.icon}</span>
            <span className="text-[13px] font-medium">{option.label}</span>
          </button>
        ))}
      </div>
      {theme === 'system' && (
        <p className="text-[12px] text-[#8E8E93] mt-3 text-center">
          Currently using {resolvedTheme} mode based on system preference
        </p>
      )}
    </div>
  );
}