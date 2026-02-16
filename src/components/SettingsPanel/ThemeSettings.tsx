import React from 'react';
import { useTheme, Theme } from '../../context/ThemeContext';

interface ThemeSettingsProps {
  className?: string;
}

const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'dark', label: 'Dark', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" /></svg> },
  { value: 'light', label: 'Light', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg> },
  { value: 'system', label: 'System', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5a1 1 0 00-1 1v2.129l2.834 1.414 1.414-2.829L8.771 12z" clipRule="evenodd" /></svg> },
];

export function ThemeSettings({ className = '' }: ThemeSettingsProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className={`p-4 dark:bg-gray-800 bg-gray-100 rounded-xl ${className}`}>
      <h3 className="text-[13px] font-semibold dark:text-gray-400 text-gray-600 uppercase tracking-wide mb-3">
        Appearance
      </h3>
      <div className="flex gap-2">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
              theme === option.value
                ? 'dark:bg-blue-500 bg-blue-500 text-white'
                : 'dark:bg-gray-900 bg-white dark:text-gray-400 text-gray-600 hover:dark:bg-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-xl">{option.icon}</span>
            <span className="text-[13px] font-medium">{option.label}</span>
          </button>
        ))}
      </div>
      {theme === 'system' && (
        <p className="text-[12px] dark:text-gray-400 text-gray-600 mt-3 text-center">
          Currently using {resolvedTheme} mode based on system preference
        </p>
      )}
    </div>
  );
}