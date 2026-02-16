import React, { useState } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/ChatArea/ChatArea';
import { InputArea } from './components/InputArea/InputArea';
import { AgentModal } from './components/AgentModal/AgentModal';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { Modal } from './components/common/Modal';
import { Button } from './components/common/Button';
import { Agent } from './types';

function AppContent() {
  const { state, addAgent, updateAgent, deleteAgent } = useChat();
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);

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
    <div className="h-screen bg-[#000000]">
      <Header onSettingsClick={() => setIsSettingsOpen(true)} />
      
      <Sidebar 
        onAddAgent={handleAddAgent}
        onEditAgent={handleEditAgent}
        onDeleteAgent={handleDeleteAgent}
      />
      
      <div className="fixed left-[280px] top-14 right-0 bottom-0 flex flex-col">
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
          <p className="text-[15px] text-white">
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
    </div>
  );
}

function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

export default App;