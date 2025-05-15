import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  isDark?: boolean;
}

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export const MethodSelector: React.FC<MethodSelectorProps> = ({ value, onChange, isDark }) => (
  <div>
    <label htmlFor="method" className={cn('text-sm font-semibold mb-1.5 block', isDark ? 'text-blue-200' : 'text-neutral-700')}>
      Method
    </label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id="method" className={cn(isDark ? 'bg-[#0f172acc] border-blue-500 text-white' : 'bg-white border-neutral-800 text-neutral-800')}>
        <SelectValue placeholder="Method" />
      </SelectTrigger>
      <SelectContent>
        {METHODS.map(m => (
          <SelectItem key={m} value={m}>{m}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
