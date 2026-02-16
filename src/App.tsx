import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/ChatArea/ChatArea';
import { InputArea } from './components/InputArea/InputArea';
import { AgentModal } from './components/AgentModal/AgentModal';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { Modal } from './components/common/Modal';
import { Button } from './components/common/Button';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal/KeyboardShortcutsModal';
import { QuickSwitcher } from './components/QuickSwitcher/QuickSwitcher';
import { SearchBar } from './components/SearchBar/SearchBar';
import { TabBar } from './components/TabBar/TabBar';
import { useKeyboardShortcuts, KeyboardShortcut } from './hooks/useKeyboardShortcuts';
import { Agent } from './types';

function AppContent() {
  const { state, addAgent, updateAgent, deleteAgent, startNewSession, addGroup } = useChat();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isQuickSwitcherOpen, setIsQuickSwitcherOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const handleNewTab = () => {
    // Create a new group with all agents
    const allAgentIds = state.agents.map(a => a.id);
    if (allAgentIds.length > 0) {
      const groupName = `Chat ${state.groups.length + 1}`;
      const group = addGroup(groupName, allAgentIds);
    }
  };

  // Define keyboard shortcuts
  const shortcuts = useMemo<KeyboardShortcut[]>(() => [
    {
      key: 'k',
      modifiers: ['cmd'],
      action: () => setIsQuickSwitcherOpen(true),
      description: 'Open quick switcher',
      category: 'navigation',
    },
    {
      key: '/',
      modifiers: ['cmd'],
      action: () => setIsShortcutsOpen(true),
      description: 'Show keyboard shortcuts',
      category: 'general',
    },
    {
      key: 'f',
      modifiers: ['cmd'],
      action: () => setIsSearchOpen(true),
      description: 'Search messages',
      category: 'navigation',
    },
    {
      key: 'n',
      modifiers: ['cmd'],
      action: () => startNewSession(),
      description: 'Start new session',
      category: 'chat',
    },
    {
      key: 'Escape',
      modifiers: [],
      action: () => {
        if (isSearchOpen) setIsSearchOpen(false);
        else if (isQuickSwitcherOpen) setIsQuickSwitcherOpen(false);
        else if (isShortcutsOpen) setIsShortcutsOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (isAgentModalOpen) setIsAgentModalOpen(false);
        else if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      },
      description: 'Close modal or panel',
      category: 'general',
    },
  ], [startNewSession, isSearchOpen, isQuickSwitcherOpen, isShortcutsOpen, isSettingsOpen, isAgentModalOpen, isDeleteModalOpen]);

  // Register keyboard shortcuts
  useKeyboardShortcuts({ shortcuts });

  const handleAddAgent = () => {
    setEditingAgent(null);
    setIsAgentModalOpen(true);
  };

  const handleEditAgent = (agentId: string) => {
    const agent = state.agents.find(a => a.id === agentId);
    if (agent) {
      setEditingAgent(agent);
      setIsAgentModalOpen(true);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    setDeletingAgentId(agentId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingAgentId) {
      deleteAgent(deletingAgentId);
      setDeletingAgentId(null);
      setIsDeleteModalOpen(false);
    }
  };

  const handleSaveAgent = (agentData: Omit<Agent, 'id' | 'createdAt'>) => {
    if (editingAgent) {
      updateAgent({
        ...editingAgent,
        ...agentData,
      });
    } else {
      addAgent(agentData);
    }
  };

  const agentToDelete = state.agents.find(a => a.id === deletingAgentId);

  return (
    <div className="h-screen bg-[var(--bg-primary)]">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />
      
      <Sidebar 
        onAddAgent={handleAddAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
      />
      
      <div className="fixed left-[280px] top-14 right-0 bottom-0 flex flex-col">
        {state.groups.length > 0 && (
          <TabBar onNewTab={handleNewTab} />
        )}
        <ChatArea />
        <InputArea />
      </div>

      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        agent={editingAgent}
        onSave={handleSaveAgent}
      />

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Agent"
      >
        <div className="space-y-4">
          <p className="text-[15px] text-[var(--text-primary)]">
            Are you sure you want to delete <span className="font-semibold">{agentToDelete?.name}</span>? 
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
        shortcuts={shortcuts}
      />

      <QuickSwitcher
        isOpen={isQuickSwitcherOpen}
        onClose={() => setIsQuickSwitcherOpen(false)}
      />

      {isSearchOpen && (
        <SearchBar 
          onClose={() => setIsSearchOpen(false)}
          onJumpToMessage={(messageId) => {
            // Scroll to message - this would need to be implemented in ChatArea
            console.log('Jump to message:', messageId);
          }}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;