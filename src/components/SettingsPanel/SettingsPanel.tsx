import React from 'react';
import { useChat } from '../../context/ChatContext';
import { ThemeSettings } from './ThemeSettings';
import { ChatStats } from './ChatStats';
import { ExportSettings } from './ExportSettings';
import { AboutSection } from './AboutSection';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { state, clearMessages } = useChat();

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      clearMessages();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-14 bottom-0 w-80 bg-[var(--bg-secondary)] border-l border-[var(--border)] z-50 animate-fade-in-up overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors rounded-lg hover:bg-[var(--bg-tertiary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-4">
          {/* Theme Settings */}
          <ThemeSettings />

          {/* Chat Statistics */}
          <ChatStats state={state} />

          {/* Export Settings */}
          <ExportSettings state={state} />

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-[var(--border)]">
            <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide px-1">Actions</h3>
            
            <button
              onClick={handleClearHistory}
              disabled={state.messages.length === 0}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--accent-error)]/20 hover:text-[var(--accent-error)] rounded-xl text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-[15px]">Clear Chat History</span>
            </button>
          </div>

          {/* About */}
          <AboutSection />
        </div>
      </div>
    </>
  );
}
