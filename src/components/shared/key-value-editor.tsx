'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input'; // ⬅️ usa el Input de shadcn
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

/* ───────── helpers ───────── */
const cartoonBtn = (dark: boolean) => ({
  outline: cn(
    'gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60',
    dark
      ? 'border-blue-500 bg-neutral-800 text-blue-300 hover:bg-neutral-700 focus:ring-blue-500 focus:ring-offset-neutral-900'
      : 'border-neutral-800 bg-white text-neutral-800 hover:bg-neutral-100 focus:ring-blue-500',
  ),
  icon: cn(
    'flex h-9 w-9 items-center justify-center rounded-lg border-2 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50',
    dark
      ? 'border-blue-500 text-blue-300 hover:bg-neutral-700 hover:text-blue-200 focus:ring-blue-500 focus:ring-offset-neutral-900'
      : 'border-neutral-800 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:ring-blue-500',
  ),
});

/* ───────── types ───────── */
export interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface Props {
  entries: KeyValueEntry[];
  onChange: (entries: KeyValueEntry[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/* ───────── component ───────── */
export function KeyValueEditor({
  entries,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}: Props) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const { outline, icon } = cartoonBtn(dark);

  const [local, setLocal] = useState<KeyValueEntry[]>([]);

  useEffect(() => setLocal(entries || []), [entries]);

  /* utilities */
  const push = (arr: KeyValueEntry[]) => {
    setLocal(arr);
    onChange(arr);
  };

  /* handlers */
  const toggle   = (id: string) => push(local.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)));
  const edit     = (id: string, f: 'key' | 'value', v: string) =>
    push(local.map((e) => (e.id === id ? { ...e, [f]: v } : e)));
  const remove   = (id: string) => push(local.filter((e) => e.id !== id));
  const add      = () =>
    push([...local, { id: crypto.randomUUID(), key: '', value: '', enabled: true }]);

  /* ───────── UI ───────── */
  return (
    <div className="space-y-2.5">
      {local.map((e) => (
        <div key={e.id} className="flex items-center gap-2.5 overflow-x-hidden">
          <Checkbox
            checked={e.enabled}
            onCheckedChange={() => toggle(e.id)}
            className={cn(
              'nodrag h-5 w-5 rounded border-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1',
              dark
                ? 'border-blue-500 bg-neutral-800 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-700 focus:ring-blue-500 focus:ring-offset-neutral-900'
                : 'border-neutral-800 bg-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-700 focus:ring-blue-500',
            )}
          />

          {/* key */}
          <Input
            value={e.key}
            placeholder={keyPlaceholder}
            onChange={(ev) => edit(e.id, 'key', ev.target.value)}
            onMouseDown={(ev) => ev.stopPropagation()}
            className={cn(
              'min-w-0 flex-1',
              dark
                ? 'bg-neutral-800 border-blue-500 placeholder:text-blue-200/50 focus:border-blue-400'
                : 'bg-white border-neutral-800 placeholder:text-neutral-500 focus:border-blue-500',
            )}
          />

          {/* value */}
          <Input
            value={e.value}
            placeholder={valuePlaceholder}
            onChange={(ev) => edit(e.id, 'value', ev.target.value)}
            onMouseDown={(ev) => ev.stopPropagation()}
            className={cn(
              'min-w-0 flex-1',
              dark
                ? 'bg-neutral-800 border-blue-500 placeholder:text-blue-200/50 focus:border-blue-400'
                : 'bg-white border-neutral-800 placeholder:text-neutral-500 focus:border-blue-500',
            )}
          />

          {/* delete */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(e.id)}
            className={cn(icon, 'nodrag flex-shrink-0', dark
              ? 'hover:bg-red-900/50 hover:text-red-300 hover:border-red-500 focus:ring-red-500'
              : 'hover:bg-red-100 hover:text-red-600 focus:ring-red-500')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button onClick={add} size="sm" className={cn(outline, 'mt-3 w-full justify-center py-2 nodrag')}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Variable
      </Button>
    </div>
  );
}
