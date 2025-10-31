import React from 'react';
import { Modal } from './Modal';

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation shortcuts
  { key: 'Ctrl + K', description: 'Open search', category: 'Navigation' },
  { key: 'Ctrl + R', description: 'Refresh articles', category: 'Navigation' },
  { key: 'Ctrl + M', description: 'Manage feeds', category: 'Navigation' },
  { key: 'Ctrl + S', description: 'Open settings', category: 'Navigation' },
  { key: 'Ctrl + H', description: 'Show keyboard shortcuts', category: 'Navigation' },

  // Article navigation
  { key: '↑ ↓', description: 'Navigate between articles', category: 'Articles' },
  { key: 'Enter', description: 'Open selected article', category: 'Articles' },
  { key: 'Space', description: 'Open selected article', category: 'Articles' },
  { key: '1-6', description: 'Select category (All, Tech, Reviews, etc.)', category: 'Articles' },

  // General shortcuts
  { key: 'Escape', description: 'Close modal or cancel action', category: 'General' },
  { key: 'Tab', description: 'Navigate between interactive elements', category: 'General' },
  { key: 'Shift + Tab', description: 'Navigate backwards between elements', category: 'General' },

  // Accessibility
  { key: 'Alt + 1', description: 'Skip to main content', category: 'Accessibility' },
  { key: 'Alt + 2', description: 'Skip to navigation', category: 'Accessibility' },
  { key: 'Alt + 3', description: 'Skip to search', category: 'Accessibility' },
];

const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
  if (!acc[shortcut.category]) {
    acc[shortcut.category] = [];
  }
  acc[shortcut.category].push(shortcut);
  return acc;
}, {} as Record<string, KeyboardShortcut[]>);

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="keyboard-shortcuts-title"
      initialFocus="h2"
    >
      <div className="max-w-2xl">
        <h2 id="keyboard-shortcuts-title" className="text-2xl font-bold mb-6 text-white" tabIndex={-1}>
          Keyboard Shortcuts
        </h2>

        <div className="space-y-6 max-h-96 overflow-y-auto">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <section key={category} aria-labelledby={`${category.toLowerCase()}-shortcuts`}>
              <h3
                id={`${category.toLowerCase()}-shortcuts`}
                className="text-lg font-semibold mb-3 text-[rgb(var(--color-accent))] uppercase tracking-wider"
              >
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-md"
                  >
                    <span className="text-gray-300">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-sm font-mono border border-gray-600">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="bg-gray-600 text-white font-bold px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
            aria-label="Close keyboard shortcuts help"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
