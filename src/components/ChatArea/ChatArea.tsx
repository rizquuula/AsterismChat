import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { MessageBubble } from '../MessageBubble/MessageBubble';

export function ChatArea() {
  const { state, getActiveGroupMessages } = useChat();
  const { messages, agents, groups, activeGroupId } = state;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages for active group or all messages if no group selected
  const displayMessages = activeGroupId 
    ? getActiveGroupMessages()
    : messages;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages]);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <main className="flex-1 dark:bg-black bg-gray-50 overflow-y-auto">
      <div className="min-h-full p-4">
        {/* Active group indicator */}
        {activeGroupId && activeGroup && (
          <div className="max-w-3xl mx-auto mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 dark:bg-blue-500/20 bg-blue-50 border dark:border-blue-500/30 border-blue-200 rounded-full">
              <div className="w-2 h-2 dark:bg-green-500 bg-green-500 rounded-full" />
              <span className="text-[13px] dark:text-blue-400 text-blue-600 font-medium">{activeGroup.name}</span>
            </div>
          </div>
        )}

        {displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl dark:bg-gray-900 bg-gray-200 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 dark:text-gray-500 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            {agents.length === 0 ? (
              <>
                <h3 className="text-[17px] font-semibold dark:text-white text-gray-900 mb-2">No agents yet</h3>
                <p className="text-[14px] dark:text-gray-400 text-gray-600 max-w-xs">
                  Add your first agent from the sidebar to start chatting with multiple AI agents
                </p>
              </>
            ) : activeGroupId ? (
              <>
                <h3 className="text-[17px] font-semibold dark:text-white text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-[14px] dark:text-gray-400 text-gray-600 max-w-xs">
                  Send a message to start chatting in {activeGroup?.name}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-[17px] font-semibold dark:text-white text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-[14px] dark:text-gray-400 text-gray-600 max-w-xs">
                  Select a group or send a message to all {agents.length} agent{agents.length > 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {displayMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </main>
  );
}