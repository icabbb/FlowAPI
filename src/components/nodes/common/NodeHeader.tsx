'use client';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface NodeHeaderProps {
  label: string;
  status?: 'idle' | 'loading' | 'success' | 'error';
  icon?: React.ElementType;
  dark?: boolean;
  variant?:
    | 'blue'
    | 'lime'
    | 'purple'
    | 'pink'
    | 'gray'
    | 'yellow'
    | 'orange'
    | 'red'
    | 'green'
    | 'cyan';
}

export function NodeHeader({
  label,
  status = 'idle',
  icon: Icon,
  dark = false,
  variant = 'gray',
}: NodeHeaderProps) {
  const IconComponent = Icon ? <Icon className="h-4 w-4 flex-shrink-0" /> : null;

  const headerClass = cn(
    'px-3 py-2 border-b-2 rounded-t-xl flex items-center justify-between gap-2',
    dark
      ? {
          blue: 'border-blue-500 bg-[#1e293b]',
          lime: 'border-lime-500 bg-[#1f3324]',
          purple: 'border-purple-500 bg-[#2e1e4d]',
          pink: 'border-pink-500 bg-[#4a1d3e]',
          gray: 'border-neutral-600 bg-neutral-900',
          yellow: 'border-yellow-500 bg-[#3a2f13]',
          orange: 'border-orange-500 bg-[#462d17]',
          red: 'border-red-500 bg-[#4a1a1a]',
          green: 'border-green-500 bg-[#1f3a2f]',
          cyan: 'border-cyan-500 bg-[#153e4a]',
        }[variant]
      : {
          blue: 'border-blue-500 bg-blue-100',
          lime: 'border-lime-500 bg-lime-100',
          purple: 'border-purple-500 bg-purple-100',
          pink: 'border-pink-500 bg-pink-100',
          gray: 'border-neutral-800 bg-neutral-100',
          yellow: 'border-yellow-500 bg-yellow-100',
          orange: 'border-orange-500 bg-orange-100',
          red: 'border-red-500 bg-red-100',
          green: 'border-green-500 bg-green-100',
          cyan: 'border-cyan-500 bg-cyan-100',
        }[variant]
  );

  const textColor = dark ? 'text-white' : 'text-neutral-800';

  return (
    <div className={headerClass}>
      <div className="flex items-center gap-2 overflow-hidden">
        {IconComponent}
        <h3 className={cn('text-sm font-bold truncate', textColor)} title={label}>
          {label}
        </h3>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
        {status === 'success' && <CheckCircle2 className="h-4 w-4 text-lime-500" />}
        {status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
      </div>
    </div>
  );
}
