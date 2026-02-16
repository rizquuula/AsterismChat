import React from 'react';
import { useChat } from '../../context/ChatContext';

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

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asterism-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <div className="fixed right-0 top-14 bottom-0 w-80 bg-[#1C1C1E] border-l border-[#38383A] z-50 animate-fade-in-up overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#38383A]">
          <h2 className="text-[17px] font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#8E8E93] hover:text-white transition-colors rounded-lg hover:bg-[#2C2C2E]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-4">
          {/* Chat Statistics */}
          <div className="p-4 bg-[#2C2C2E] rounded-xl">
            <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3">Chat Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[14px]">
                <span className="text-[#8E8E93]">Total Messages</span>
                <span className="text-white font-medium">{state.messages.length}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-[#8E8E93]">Total Agents</span>
                <span className="text-white font-medium">{state.agents.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide px-1">Actions</h3>
            
            <button
              onClick={handleExport}
              disabled={state.messages.length === 0}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#2C2C2E] hover:bg-[#3C3C3E] rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#8E8E93]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-[15px]">Export Chat as JSON</span>
            </button>

            <button
              onClick={handleClearHistory}
              disabled={state.messages.length === 0}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#2C2C2E] hover:bg-[#FF453A]/20 hover:text-[#FF453A] rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-[15px]">Clear Chat History</span>
            </button>
          </div>

          {/* About */}
          <div className="pt-4 border-t border-[#38383A]">
            <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3">About</h3>
            <div className="p-4 bg-[#2C2C2E] rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#5E5CE6] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-white">AsterismChat</h4>
                  <p className="text-[12px] text-[#8E8E93]">Version 1.0.0</p>
                </div>
              </div>
              <p className="text-[13px] text-[#8E8E93]">
                A group chat interface for interacting with multiple AI agents simultaneously.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}