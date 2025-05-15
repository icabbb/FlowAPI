import React from 'react';
import { cn } from '@/lib/utils';

interface LabelInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  isDark?: boolean;
}

export const LabelInput: React.FC<LabelInputProps> = ({ value, onChange, onBlur, isDark }) => (
  <div>
    <label htmlFor="label" className={cn(
      'text-sm font-semibold mb-1.5 block',
      isDark ? 'text-blue-200' : 'text-neutral-700')}
    >
      Label
    </label>
    <input
      id="label"
      name="label"
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder="HTTP Request Node Label"
      onMouseDown={e => e.stopPropagation()}
      className={cn(
        'w-full h-10 px-3 text-sm rounded-lg shadow-sm border-2 focus:outline-none',
        'allow-text-selection',
        isDark
          ? 'bg-neutral-800 border-blue-500 text-white focus:border-blue-400'
          : 'bg-white border-neutral-800 text-neutral-800 focus:border-blue-500')}
    />
  </div>
);
