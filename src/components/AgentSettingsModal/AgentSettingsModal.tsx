import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Agent, AgentSettings, defaultAgentSettings } from '../../types';
import { testAgentConnection } from '../../context/chatApi';

interface AgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  onSave: (settings: AgentSettings) => void;
}

export function AgentSettingsModal({ isOpen, onClose, agent, onSave }: AgentSettingsModalProps) {
  const [settings, setSettings] = useState<AgentSettings>(agent.settings || defaultAgentSettings);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(agent.settings || defaultAgentSettings);
      setTestResult(null);
    }
  }, [isOpen, agent]);

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const result = await testAgentConnection({
      ...agent,
      settings,
    });

    setTestResult(result);
    setIsTesting(false);
  };

  const handleTimeoutChange = (value: number) => {
    setSettings(prev => ({ ...prev, timeout: value * 1000 }));
  };

  const handleRetryDelayChange = (value: number) => {
    setSettings(prev => ({ ...prev, retryDelay: value * 1000 }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${agent.name} Settings`}>
      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
          <div>
            <h4 className="text-[15px] font-medium text-[var(--text-primary)]">Enabled</h4>
            <p className="text-[13px] text-[var(--text-secondary)]">Allow agent to respond to messages</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.enabled ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Auto Response Toggle */}
        <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl">
          <div>
            <h4 className="text-[15px] font-medium text-[var(--text-primary)]">Auto Response</h4>
            <p className="text-[13px] text-[var(--text-secondary)]">Automatically respond to messages</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoResponse: !prev.autoResponse }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.autoResponse ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border)]'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.autoResponse ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Timeout Setting */}
        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[15px] font-medium text-[var(--text-primary)]">Timeout</h4>
              <p className="text-[13px] text-[var(--text-secondary)]">Maximum wait time for response</p>
            </div>
            <span className="text-[15px] font-medium text-[var(--accent-primary)]">
              {settings.timeout / 1000}s
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={settings.timeout / 1000}
            onChange={(e) => handleTimeoutChange(Number(e.target.value))}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
          />
          <div className="flex justify-between text-[11px] text-[var(--text-tertiary)]">
            <span>5s</span>
            <span>120s</span>
          </div>
        </div>

        {/* Max Retries Setting */}
        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[15px] font-medium text-[var(--text-primary)]">Max Retries</h4>
              <p className="text-[13px] text-[var(--text-secondary)]">Number of retry attempts on failure</p>
            </div>
            <span className="text-[15px] font-medium text-[var(--accent-primary)]">
              {settings.maxRetries}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={settings.maxRetries}
            onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: Number(e.target.value) }))}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
          />
          <div className="flex justify-between text-[11px] text-[var(--text-tertiary)]">
            <span>0</span>
            <span>5</span>
          </div>
        </div>

        {/* Retry Delay Setting */}
        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[15px] font-medium text-[var(--text-primary)]">Retry Delay</h4>
              <p className="text-[13px] text-[var(--text-secondary)]">Delay between retry attempts</p>
            </div>
            <span className="text-[15px] font-medium text-[var(--accent-primary)]">
              {settings.retryDelay / 1000}s
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={settings.retryDelay / 1000}
            onChange={(e) => handleRetryDelayChange(Number(e.target.value))}
            className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
          />
          <div className="flex justify-between text-[11px] text-[var(--text-tertiary)]">
            <span>0.5s</span>
            <span>5s</span>
          </div>
        </div>

        {/* Test Connection */}
        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full"
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          
          {testResult && (
            <div
              className={`p-3 rounded-xl text-[14px] ${
                testResult.success
                  ? 'bg-[var(--accent-success)]/20 text-[var(--accent-success)]'
                  : 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]'
              }`}
            >
              {testResult.success ? '✓' : '✗'} {testResult.message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </Modal>
  );
}