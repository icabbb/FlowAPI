'use client';

import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface CartoonNodeWrapperProps {
  id: string;
  isConnectable: boolean;
  status?: 'idle' | 'loading' | 'success' | 'error';
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
  children: React.ReactNode;
}

export function CartoonNodeWrapper({
  id,
  isConnectable,
  status = 'idle',
  variant = 'gray',
  children,
}: CartoonNodeWrapperProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const topBorderClass = cn(
    'border-t-[3px]',
    status === 'loading'
      ? 'border-blue-500'
      : status === 'success'
      ? 'border-lime-500'
      : status === 'error'
      ? 'border-red-500'
      : 'border-transparent'
  );

  const variantClass = {
    blue: isDark
      ? 'bg-[#1e293b] border-blue-500 text-blue-100'
      : 'bg-blue-50 border-blue-500 text-blue-900',
    lime: isDark
      ? 'bg-[#1f3324] border-lime-500 text-lime-100'
      : 'bg-lime-50 border-lime-500 text-lime-900',
    purple: isDark
      ? 'bg-[#2e1e4d] border-purple-500 text-purple-100'
      : 'bg-purple-50 border-purple-500 text-purple-900',
    pink: isDark
      ? 'bg-[#4a1d3e] border-pink-500 text-pink-100'
      : 'bg-pink-50 border-pink-500 text-pink-900',
    gray: isDark
      ? 'bg-neutral-800 border-neutral-500 text-neutral-200'
      : 'bg-white border-neutral-800 text-neutral-800',
    yellow: isDark
      ? 'bg-[#3a2f13] border-yellow-500 text-yellow-100'
      : 'bg-yellow-50 border-yellow-500 text-yellow-900',
    orange: isDark
      ? 'bg-[#462d17] border-orange-500 text-orange-100'
      : 'bg-orange-50 border-orange-500 text-orange-900',
    red: isDark
      ? 'bg-[#4a1a1a] border-red-500 text-red-100'
      : 'bg-red-50 border-red-500 text-red-900',
    green: isDark
      ? 'bg-[#1f3a2f] border-green-500 text-green-100'
      : 'bg-green-50 border-green-500 text-green-900',
    cyan: isDark
      ? 'bg-[#153e4a] border-cyan-500 text-cyan-100'
      : 'bg-cyan-50 border-cyan-500 text-cyan-900',
  }[variant];

  return (
    <div
      className={cn(
        'rounded-xl shadow-md overflow-hidden nowheel transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-0.5',
        topBorderClass,
        variantClass
      )}
    >
      {children}
    </div>
  );
}
