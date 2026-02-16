import React from 'react';

interface AboutSectionProps {
  className?: string;
}

export function AboutSection({ className = '' }: AboutSectionProps) {
  return (
    <div className={`pt-4 border-t dark:border-gray-700 border-gray-200 ${className}`}>
      <h3 className="text-[13px] font-semibold dark:text-gray-400 text-gray-600 uppercase tracking-wide mb-3">
        About
      </h3>
      <div className="p-4 dark:bg-gray-800 bg-gray-100 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div>
            <h4 className="text-[15px] font-semibold dark:text-white text-gray-900">Asterism Chat</h4>
            <p className="text-[12px] dark:text-gray-400 text-gray-600">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-[13px] dark:text-gray-400 text-gray-600">
          A group chat interface for interacting with multiple AI agents simultaneously.
        </p>
      </div>
    </div>
  );
}