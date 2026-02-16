import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useChat } from '../../context/ChatContext';

export function InputArea() {
  const { state, sendMessage } = useChat();
  const { agents, groups, activeGroupId } = state;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(message.trim());
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

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <footer className="shrink-0 h-[60px] bg-[#1C1C1E] border-t border-[#38383A]">
      <div className="h-full px-4 flex items-center gap-3">
        {/* Current target indicator */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#2C2C2E] rounded-lg text-[14px] text-white min-w-[120px]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#8E8E93]" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          <span className="truncate">
            {activeGroup?.name || 'Select a group'}
          </span>
        </div>

        {/* Message Input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (/new for new session)"
            disabled={isSending}
            rows={1}
            className="w-full px-4 py-2 bg-[#2C2C2E] border-none rounded-xl text-[15px] text-white placeholder-[#636366] resize-none focus:outline-none focus:ring-2 focus:ring-[#0A84FF] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '200px' }}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
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