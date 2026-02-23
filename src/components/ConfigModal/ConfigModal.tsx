import React, { useState, useCallback, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AsterismConfig } from '../../types';
import { getAsterismConfig } from '../../services/api';
import { ConfigTree } from './ConfigTree';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string | null;
}

export function ConfigModal({ isOpen, onClose, agentId }: ConfigModalProps) {
  const [config, setConfig] = useState<AsterismConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchConfig = useCallback(async () => {
    if (!agentId) {
      setError('No agent selected');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const result = await getAsterismConfig(agentId);
    
    if (isMountedRef.current) {
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        setError(result.error || 'Failed to load config');
      }
      setIsLoading(false);
    }
  }, [agentId]);

  React.useEffect(() => {
    isMountedRef.current = true;
    if (isOpen && agentId) {
      fetchConfig();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [isOpen, agentId, fetchConfig]);

  const handleRefresh = async () => {
    await fetchConfig();
  };

  const handleSave = async () => {
    await fetchConfig();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asterism Config"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[var(--text-secondary)]">
            View and edit the asterism server configuration
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading || !agentId}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh config"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[var(--accent-error)]/20 text-[var(--accent-error)] rounded-lg text-[14px]">
            {error}
          </div>
        )}

        {isLoading && !config ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : config && agentId ? (
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
            <ConfigTree
              data={config}
              path=""
              agentId={agentId}
              onUpdate={handleSave}
            />
          </div>
        ) : null}

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfigModal;
