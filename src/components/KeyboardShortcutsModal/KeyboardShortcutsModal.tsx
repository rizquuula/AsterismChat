import React from 'react';
import { Modal } from '../common/Modal';
import { KeyboardShortcut, getShortcutDisplay } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  const categories = [
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'navigation', label: 'Navigation', icon: '🧭' },
    { id: 'general', label: 'General', icon: '⚙️' },
  ];

  const getShortcutsByCategory = (category: string) => {
    return shortcuts.filter(s => s.category === category);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-6">
        {categories.map(category => {
          const categoryShortcuts = getShortcutsByCategory(category.id);
          if (categoryShortcuts.length === 0) return null;

          return (
            <div key={category.id}>
              <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3 flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={`${shortcut.category}-${index}`}
                    className="flex items-center justify-between py-2 px-3 bg-[var(--bg-secondary)] rounded-lg"
                  >
                    <span className="text-[14px] text-[var(--text-primary)]">{shortcut.description}</span>
                    <kbd className="px-2 py-1 text-[12px] font-mono bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded border border-[var(--border)]">
                      {getShortcutDisplay(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t border-[var(--border)]">
          <p className="text-[12px] text-[var(--text-tertiary)] text-center">
            Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[11px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[11px]">/</kbd> to show this dialog
          </p>
        </div>
      </div>
    </Modal>
  );
}