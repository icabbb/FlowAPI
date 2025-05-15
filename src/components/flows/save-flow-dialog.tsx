'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useFlowStore } from '@/store';
import { generateSlug } from '@/lib/utils';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectSeparator,
} from '@/components/ui/select';
import { PlusCircle, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ────────────── cartoon helpers con fondo unificado ────────────── */
const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // FONDO UNIFICADO
  const bg = dark ? 'bg-[#0f172a]' : 'bg-white';
  const border = dark ? 'border-blue-600' : 'border-slate-900';
  const shadow = dark
    ? 'shadow-[4px_4px_0_#172554]'
    : 'shadow-[4px_4px_0_#0f172a]';

  const btn = (
    variant: 'primary' | 'outline' = 'outline',
  ) =>
    cn(
      'rounded-xl border-[2px] font-semibold flex items-center gap-1.5 transition-transform duration-150 hover:scale-[1.03] disabled:opacity-60 px-4 py-2 h-9 text-sm',
      shadow,
      bg,
      border,
      variant === 'primary' &&
        (dark
          ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
          : 'bg-blue-500 hover:bg-blue-600 border-slate-900 text-white'),
      variant === 'outline' &&
        (dark
          ? 'bg-[#1e293b] hover:bg-[#334155] text-blue-100 border-blue-500'
          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-900'),
    );

  const input = cn(
    'w-full h-10 px-3 rounded-lg border-[2px] shadow-inner text-sm focus:ring-2',
    bg,
    border,
    dark
      ? 'text-blue-100 placeholder:text-blue-300 focus:ring-blue-400'
      : 'text-slate-800 placeholder:text-slate-400 focus:ring-blue-500',
  );
  const textarea = cn(input,bg, 'min-h-[70px]', dark ? 'bg-blue-600' : '');
  const dlg = cn(
    'p-0 sm:max-w-lg rounded-2xl border-[3px] shadow-xl overflow-hidden',
    bg,
    border,
    shadow,
    dark ? 'text-blue-100' : ''
  );

  // Para <SelectTrigger> y otros, solo usar input
  return { dark, btn, input, textarea, dlg, bg };
};

/* ──────────────────────── SaveFlowDialog ──────────────────────── */

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveFlowDialog({ isOpen, onOpenChange }: Props) {
  const {
    saveCurrentFlow,
    isSaving,
    currentFlowId,
    currentFlowName,
    currentFlowDescription,
    currentFlowCollection,
    currentFlowSlug,
    savedFlows,
    loadSavedFlows,
  } = useFlowStore();

  const { btn, input, textarea, dlg, bg } = useCartoon();

  // State fields
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [coll, setColl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [newColl, setNewColl] = useState(false);

  // Collections list
  const collections = useMemo(() => {
    const set = new Set<string>();
    savedFlows.forEach(f => f.collections && set.add(f.collections));
    return [...set].sort();
  }, [savedFlows]);

  // Reset values when open
  useEffect(() => {
    if (isOpen) {
      setName(currentFlowName || 'New Flow');
      setDesc(currentFlowDescription || '');
      setColl(currentFlowCollection || '');
      setCustomSlug(currentFlowSlug || '');
      setNewColl(false);
    }
  }, [isOpen, currentFlowName, currentFlowDescription, currentFlowCollection, currentFlowSlug]);

  // Save action
  const handleSave = async () => {
    if (!name.trim()) return;
    await saveCurrentFlow(name, desc, coll || null, undefined, undefined, customSlug.trim());
    await loadSavedFlows();
    onOpenChange(false);
  };

  // Dialog close
  const close = () => !isSaving && onOpenChange(false);

  /* ─────────────── render ─────────────── */
  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className={dlg}>
        <DialogHeader className="p-5 border-b-[2px]">
          <DialogTitle>Save Current Flow</DialogTitle>
          <DialogDescription>
            Assign a name and (optional) collection.
          </DialogDescription>
        </DialogHeader>

        <div className={cn('px-5 py-4 space-y-4', bg)}>
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" className={input} value={name} onChange={e => setName(e.target.value)} disabled={isSaving} />
          </div>
          {/* Collection */}
          <div className="space-y-1.5">
            <Label>Collection</Label>
            {newColl ? (
              <div className="flex gap-2">
                <Input className={input} value={coll} onChange={e => setColl(e.target.value)} placeholder="New collection…" disabled={isSaving} />
                <Button size="sm" variant="ghost" onClick={() => setNewColl(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Select value={coll || '__NONE__'} onValueChange={v => {
                if (v === '__CREATE_NEW__') { setNewColl(true); setColl(''); }
                else setColl(v === '__NONE__' ? '' : v);
              }}>
                <SelectTrigger className={input}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent className={bg}>
                  <SelectItem value="__NONE__">No Collection</SelectItem>
                  <SelectSeparator />
                  {collections.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectSeparator />
                  <SelectItem value="__CREATE_NEW__" className="flex gap-1.5">
                    <PlusCircle className="h-4 w-4" /> Create New…
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="customSlug">Custom Slug (Optional)</Label>
            <Input 
              id="customSlug" 
              className={input} 
              value={customSlug} 
              onChange={(e) => setCustomSlug(generateSlug(e.target.value))} 
              placeholder="e.g., my-awesome-flow"
              disabled={isSaving}
            />
            {customSlug && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Preview: {typeof window !== 'undefined' ? window.location.origin : ''}/flow/{customSlug}
              </p>
            )}
          </div>
          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" className={textarea} value={desc} onChange={e => setDesc(e.target.value)} disabled={isSaving} />
          </div>
        </div>
        {/* Footer */}
        <DialogFooter className={cn("p-4 border-t-[2px] flex justify-end gap-2", bg)}>
          <DialogClose asChild>
            <Button className={btn('outline')}>Cancel</Button>
          </DialogClose>
          <Button
            className={btn('primary')}
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving…' : currentFlowId ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
