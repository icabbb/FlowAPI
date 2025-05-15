import React from 'react';
import { cn } from '@/lib/utils';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  openReferenceSelector: () => void;
  isDark?: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ value, onChange, onBlur, openReferenceSelector, isDark }) => (
  <div>
    <label htmlFor="url" className={cn('text-sm font-semibold mb-1.5 block', isDark ? 'text-blue-200' : 'text-neutral-700')}>
      URL
    </label>
    <div className="flex gap-2">
      <input
        id="url"
        name="url"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="https://api.example.com/endpoint"
        onMouseDown={e => e.stopPropagation()}
        className={cn(
          'flex-1 h-10 px-3 text-sm rounded-lg shadow-sm border-2 focus:outline-none',
          'allow-text-selection',
          isDark
            ? 'bg-neutral-800 border-blue-500 text-white focus:border-blue-400'
            : 'bg-white border-neutral-800 text-neutral-800 focus:border-blue-500')}
      />
      <button
        type="button"
        title="Insert variable/reference"
        onClick={openReferenceSelector}
        className={cn('px-2 rounded border', isDark ? 'border-blue-500 text-blue-200' : 'border-neutral-800 text-neutral-800')}
      >
        {'{ }'}
      </button>
    </div>
  </div>
);
