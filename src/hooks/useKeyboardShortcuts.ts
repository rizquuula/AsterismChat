import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'cmd' | 'shift' | 'alt')[];
  action: () => void;
  description: string;
  category: 'navigation' | 'chat' | 'general';
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.isContentEditable;

    // Allow some shortcuts even in input fields
    const allowedInInput = ['Escape', 'Enter'];
    if (isInputField && !allowedInInput.includes(event.key)) {
      // Check if it's a modifier-only shortcut (like Cmd+K)
      const hasModifiers = event.metaKey || event.ctrlKey || event.altKey;
      if (!hasModifiers) return;
    }

    for (const shortcut of shortcutsRef.current) {
      const { key, modifiers, action } = shortcut;

      // Check key match
      const keyMatch = event.key.toLowerCase() === key.toLowerCase() ||
                       event.code.toLowerCase() === key.toLowerCase();

      if (!keyMatch) continue;

      // Check modifiers
      const ctrlMatch = modifiers.includes('ctrl') === (event.ctrlKey || event.metaKey);
      const cmdMatch = modifiers.includes('cmd') === event.metaKey;
      const shiftMatch = modifiers.includes('shift') === event.shiftKey;
      const altMatch = modifiers.includes('alt') === event.altKey;

      if (ctrlMatch && cmdMatch && shiftMatch && altMatch) {
        event.preventDefault();
        action();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Default keyboard shortcuts for the app
export const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'Enter',
    modifiers: ['cmd'],
    action: () => {}, // Handled by InputArea
    description: 'Send message',
    category: 'chat',
  },
  {
    key: 'k',
    modifiers: ['cmd'],
    action: () => {}, // Quick switcher - to be implemented
    description: 'Open quick switcher',
    category: 'navigation',
  },
  {
    key: '/',
    modifiers: ['cmd'],
    action: () => {}, // Show shortcuts help
    description: 'Show keyboard shortcuts',
    category: 'general',
  },
  {
    key: 'f',
    modifiers: ['cmd'],
    action: () => {}, // Focus search
    description: 'Search messages',
    category: 'navigation',
  },
  {
    key: 'n',
    modifiers: ['cmd'],
    action: () => {}, // New session
    description: 'Start new session',
    category: 'chat',
  },
  {
    key: 'Escape',
    modifiers: [],
    action: () => {}, // Close modals
    description: 'Close modal or panel',
    category: 'general',
  },
];

// Helper to get display string for shortcut
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers.includes('cmd')) {
    parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  }
  if (shortcut.modifiers.includes('ctrl')) {
    parts.push('Ctrl');
  }
  if (shortcut.modifiers.includes('shift')) {
    parts.push(navigator.platform.includes('Mac') ? '⇧' : 'Shift');
  }
  if (shortcut.modifiers.includes('alt')) {
    parts.push(navigator.platform.includes('Mac') ? '⌥' : 'Alt');
  }
  
  const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  parts.push(key);
  
  return parts.join('+');
}