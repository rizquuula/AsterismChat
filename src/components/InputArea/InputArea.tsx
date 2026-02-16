import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChat } from '../../context/ChatContext';

export function InputArea() {
  const { state, sendMessage } = useChat();
  const { agents } = state;
  const [message, setMessage] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAgentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!message.trim() || agents.length === 0 || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message.trim(), selectedAgents);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectAllAgents = () => {
    setSelectedAgents(agents.map(a => a.id));
  };

  const deselectAllAgents = () => {
    setSelectedAgents([]);
  };

  const selectedCount = selectedAgents.length === 0 ? agents.length : selectedAgents.length;
  const isAllSelected = selectedAgents.length === 0 || selectedAgents.length === agents.length;

  return (
    <footer className="fixed left-0 right-0 bottom-0 h-[60px] bg-[#1C1C1E] border-t border-[#38383A] z-30">
      <div className="h-full px-4 flex items-center gap-3">
        {/* Agent Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
            disabled={agents.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-[#2C2C2E] hover:bg-[#3C3C3E] rounded-lg text-[14px] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8E8E93]" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span>{isAllSelected ? 'All' : `${selectedCount}/${agents.length}`}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-[#8E8E93] transition-transform ${isAgentDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isAgentDropdownOpen && agents.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#1C1C1E] border border-[#38383A] rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
              <div className="p-2 border-b border-[#38383A] flex gap-2">
                <button
                  onClick={selectAllAgents}
                  className="flex-1 px-2 py-1 text-[12px] text-[#0A84FF] hover:bg-[#2C2C2E] rounded-lg transition-colors"
                >
                  All
                </button>
                <button
                  onClick={deselectAllAgents}
                  className="flex-1 px-2 py-1 text-[12px] text-[#8E8E93] hover:bg-[#2C2C2E] rounded-lg transition-colors"
                >
                  None
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {agents.map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#2C2C2E] rounded-lg transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selectedAgents.includes(agent.id) || (selectedAgents.length === 0 && isAllSelected)
                        ? 'bg-[#0A84FF] border-[#0A84FF]'
                        : 'border-[#636366]'
                    }`}>
                      {(selectedAgents.includes(agent.id) || (selectedAgents.length === 0 && isAllSelected)) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[14px] text-white truncate">{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={agents.length > 0 ? "Type a message..." : "Add an agent to start chatting"}
            disabled={agents.length === 0}
            rows={1}
            className="w-full px-4 py-2 bg-[#2C2C2E] border-none rounded-xl text-[15px] text-white placeholder-[#636366] resize-none focus:outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '200px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || agents.length === 0 || isSending}
          className="flex items-center justify-center w-10 h-10 bg-[#0A84FF] hover:bg-[#409CFF] disabled:bg-[#0A84FF]/50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-150 hover:scale-105 active:scale-95"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          )}
        </button>
      </div>
    </footer>
  );
}