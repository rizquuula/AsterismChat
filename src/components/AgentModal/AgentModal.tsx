import React, { useState, useEffect } from 'react';
import { Agent, defaultAgentSettings } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent?: Agent | null;
  onSave: (agentData: Omit<Agent, 'id' | 'createdAt'>) => void;
}

export function AgentModal({ isOpen, onClose, agent, onSave }: AgentModalProps) {
  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setEndpoint(agent.endpoint);
      setModel(agent.model);
      setApiKey(agent.apiKey);
    } else {
      setName('');
      setEndpoint('');
      setModel('');
      setApiKey('');
    }
    setErrors({});
  }, [agent, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Agent name is required';
    }

    if (!endpoint.trim()) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else {
      try {
        const url = new URL(endpoint);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.endpoint = 'URL must use HTTP or HTTPS';
        }
      } catch {
        newErrors.endpoint = 'Invalid URL format';
      }
    }

    if (!model.trim()) {
      newErrors.model = 'Model name is required';
    }

    if (!apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      endpoint: endpoint.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
      lastResponseAt: agent?.lastResponseAt,
      settings: agent?.settings || defaultAgentSettings,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={agent ? 'Edit Agent' : 'Add Agent'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Security Warning */}
        <div className="p-3 bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 rounded-lg">
          <div className="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF9F0A] shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-[12px] text-[#FF9F0A]">
              API keys are stored in localStorage. For production use, consider using a backend proxy.
            </p>
          </div>
        </div>

        <Input
          label="Agent Name"
          placeholder="e.g., Asteri, Assistant"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />

        <Input
          label="Endpoint URL"
          placeholder="http://localhost:8000/v1/chat/completions"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          error={errors.endpoint}
        />

        <Input
          label="Model Name"
          placeholder="e.g., asterism/Asteri"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          error={errors.model}
        />

        <Input
          label="API Key"
          type="password"
          placeholder="Enter your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          error={errors.apiKey}
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            {agent ? 'Save Changes' : 'Add Agent'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}