import React, { useState } from 'react';
import { Agent } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  onCreateGroup: (name: string, agentIds: string[]) => void;
}

export function GroupModal({ isOpen, onClose, agents, onCreateGroup }: GroupModalProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedAgentIds.length === 0) return;
    
    onCreateGroup(newGroupName.trim(), selectedAgentIds);
    
    // Reset form
    setNewGroupName('');
    setSelectedAgentIds([]);
    onClose();
  };

  const handleClose = () => {
    setNewGroupName('');
    setSelectedAgentIds([]);
    onClose();
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgentIds(prev => 
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Group"
    >
      <div className="space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g., Research Team"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          autoFocus
        />
        
        <div>
          <label className="block text-sm font-medium dark:text-gray-400 text-gray-600 mb-1.5">
            Select Agents
          </label>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => toggleAgentSelection(agent.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  selectedAgentIds.includes(agent.id)
                    ? 'dark:bg-blue-500/20 bg-blue-50 border dark:border-blue-500/30 border-blue-200'
                    : 'dark:bg-gray-900 bg-gray-100 hover:dark:bg-gray-800 hover:bg-gray-200 border border-transparent'
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedAgentIds.includes(agent.id)
                    ? 'dark:bg-blue-500 bg-blue-500 border-blue-500'
                    : 'dark:border-gray-600 border-gray-400'
                }`}>
                  {selectedAgentIds.includes(agent.id) && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-[14px] dark:text-white text-gray-900">{agent.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateGroup}
            disabled={!newGroupName.trim() || selectedAgentIds.length === 0}
            className="flex-1"
          >
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}