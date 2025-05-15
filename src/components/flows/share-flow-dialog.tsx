'use client';;
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Check,
  ClipboardCopy,
  Info,
  Link2,
  Loader2,
  RotateCw,
  Save,
  Share2,
  X,
} from 'lucide-react';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useFlowStore } from '@/store';
import { cn } from '@/lib/utils';

/* ──────────── cartoon helper (igual al resto) ──────────── */
const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const shadow = dark
    ? 'shadow-[4px_4px_0_#172554]'
    : 'shadow-[4px_4px_0_#0f172a]';

  const btn = (tone: 'primary' | 'outline' | 'destructive' | 'ghost' = 'outline', small = false) =>
    cn(
      'rounded-xl border-[2px] font-semibold inline-flex items-center gap-1.5 transition-transform hover:scale-[1.03] disabled:opacity-60',
      shadow,
      small ? 'px-3 py-1.5 h-8 text-xs' : 'px-4 py-2 h-9 text-sm',
      tone === 'primary' &&
        (dark
          ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
          : 'bg-blue-500 hover:bg-blue-600 border-slate-900 text-white'),
      tone === 'outline' &&
        (dark
          ? 'bg-[#1e293b] hover:bg-[#334155] text-blue-100 border-blue-500'
          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-900'),
      tone === 'destructive' &&
        (dark
          ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white'
          : 'bg-red-500 hover:bg-red-600 border-slate-900 text-white'),
      tone === 'ghost' &&
        'border-transparent bg-transparent shadow-none hover:bg-slate-100 dark:hover:bg-[#1e293b]',
    );

  const input = cn(
    'w-full h-10 px-3 rounded-lg border-[2px] shadow-inner text-sm focus:ring-2',
    dark
      ? 'bg-neutral-700 border-blue-500 text-blue-100 placeholder:text-blue-300 focus:ring-blue-400'
      : 'bg-white border-slate-900 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500',
  );

  const selectTrigger = input;

  const panel = cn(
    'rounded-2xl border-[3px] sm:max-w-[520px] shadow-lg z-50',
    shadow,
    dark ? 'bg-[#0f172a] border-blue-600 text-blue-100' : 'bg-white border-slate-900',
  );

  const sectionBorder = dark ? 'border-blue-600' : 'border-slate-900';

  return { dark, btn, input, selectTrigger, panel, sectionBorder };
};

/* ──────────────── Props / Types ──────────────── */
interface ShareFlowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ─────────────────── dialog ──────────────────── */
export function ShareFlowDialog({ isOpen, onOpenChange }: ShareFlowDialogProps) {
  /* ---------- stores & helpers ---------- */
  const flowStore = useFlowStore();
  const {
    dark,
    btn,
    input,
    selectTrigger,
    panel,
    sectionBorder,
  } = useCartoon();

  /* ---------- state (idéntico) ---------- */
  const {
    currentFlowId,
    currentFlowName,
    currentFlowDescription,
    currentFlowCollection,
    saveCurrentFlow,
    isDirty,
    userId,
  } = flowStore;

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [expirationType, setExpirationType] = useState<'never' | 'date'>('never');
  const [expirationDate, setExpirationDate] = useState('');
  const [existingShares, setExistingShares] = useState<any[]>([]);
  const [needsSaving, setNeedsSaving] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>(
    'pending',
  );

  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCollection, setSaveCollection] = useState('');

  /* ---------- refs / timers ---------- */
  const autoRefresh = useRef<NodeJS.Timeout | null>(null);

  /* ---------- effects (sin cambios de negocio) ---------- */
  useEffect(() => {
    if (!isOpen) {
      clearInterval(autoRefresh.current!);
      return;
    }

    // reset
    setShareError(null);
    setShareId(null);
    setShareUrl(null);
    setHasCopied(false);

    if (!currentFlowId || isDirty) {
      setNeedsSaving(true);
      setSaveName(currentFlowName || '');
      setSaveDescription(currentFlowDescription || '');
      setSaveCollection(currentFlowCollection || '');
    } else {
      setNeedsSaving(false);
      verifyFlow();
    }
    loadShares();

    if (activeTab === 'manage') kickAutoRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentFlowId, isDirty, currentFlowName, currentFlowDescription, currentFlowCollection]);

  useEffect(() => {
    if (isOpen && activeTab === 'manage') kickAutoRefresh();
    else clearInterval(autoRefresh.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /* ---------- api helpers (idénticos) ---------- */
  const verifyFlow = async () => {
    if (!currentFlowId) return;
    setIsVerifying(true);
    setVerificationStatus('pending');
    try {
      const res = await fetch(`/api/flow/${currentFlowId}`);
      if (res.ok) setVerificationStatus('success');
      else setVerificationStatus('error');
    } catch {
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const loadShares = async () => {
    try {
      const res = await fetch('/api/public-flow');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExistingShares(data);
      const mine = data.find((s: any) => s.flow_id === currentFlowId && s.is_active);
      if (mine) {
        setShareId(mine.id);
        setShareUrl(`${location.origin}/share/${mine.id}`);
      }
    } catch {
      // swallow
    }
  };

  const kickAutoRefresh = () => {
    clearInterval(autoRefresh.current!);
    autoRefresh.current = setInterval(() => {
      if (document.visibilityState === 'visible') loadShares();
    }, 30000);
  };

  /* ---------- actions (idénticos, solo clases) ---------- */
  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleCreateShare = async () => {
    if (needsSaving || verificationStatus === 'error' || isDirty) {
      setShareError('Save your flow first. The current changes are not reflected in the share link.');
      return;
    }
    setIsLoading(true);
    setShareError(null);
    try {
      const res = await fetch('/api/public-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: currentFlowId,
          expires_at:
            expirationType === 'date' && expirationDate
              ? new Date(expirationDate).toISOString()
              : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShareId(data.id);
      setShareUrl(`${location.origin}/share/${data.id}`);
      loadShares();
    } catch (e: any) {
      setShareError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateShare = async (id: string) => {
    setIsLoading(true);
    try {
      await fetch('/api/public-flow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share_id: id }),
      });
      if (id === shareId) {
        setShareId(null);
        setShareUrl(null);
      }
      loadShares();
    } finally {
      setIsLoading(false);
    }
  };

  const saveFlowThenShare = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      await saveCurrentFlow(saveName, saveDescription, saveCollection || null);
      setNeedsSaving(false);
      verifyFlow();
      handleCreateShare();
    } catch (e: any) {
      setShareError(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  /* ---------- render helpers ---------- */
  const Line = ({ children }: { children: ReactNode }) => (
    <div className="space-y-2">{children}</div>
  );

  /* ────────────────────── RENDER ─────────────────────── */
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={panel} onClick={e => e.stopPropagation()}>
        {/* header */}
        <DialogHeader
          className={cn('p-6 pb-4 border-b-[3px]', sectionBorder)}
        >
          <DialogTitle className="text-xl font-bold">Share Flow</DialogTitle>
          <DialogDescription className="text-sm opacity-80">
            Create a read-only public link.
          </DialogDescription>
        </DialogHeader>

        {/* verifying spinner */}
        {isVerifying && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm opacity-70">Verifying flow…</p>
          </div>
        )}

        {/* need save first */}
        {!isVerifying && needsSaving && (
          <div className="p-6 space-y-5">
            <Alert
              className={cn(
                'border-[2px] rounded-lg',
                dark
                  ? 'bg-yellow-900/20 border-yellow-600 text-yellow-200'
                  : 'bg-yellow-50 border-yellow-400 text-yellow-800',
              )}
            >
              <AlertTitle className="flex items-center gap-1.5">
                <Info className="h-4 w-4" />
                Save required
              </AlertTitle>
              <AlertDescription className="mt-1 text-sm">
                {shareError ||
                  'This flow is not yet stored in the database. Save it first.'}
              </AlertDescription>
            </Alert>

            <Line>
              <Label className="font-semibold text-sm">Name *</Label>
              <input
                className={input}
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
              />
            </Line>
            <Line>
              <Label className="font-semibold text-sm">Description</Label>
              <input
                className={input}
                value={saveDescription}
                onChange={e => setSaveDescription(e.target.value)}
              />
            </Line>
            <Line>
              <Label className="font-semibold text-sm">Collection</Label>
              <input
                className={input}
                value={saveCollection}
                onChange={e => setSaveCollection(e.target.value)}
              />
            </Line>

            <div className="flex justify-end gap-2">
              <Button className={btn('outline', true)} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className={btn('primary', true)}
                disabled={isSaving || !saveName.trim()}
                onClick={saveFlowThenShare}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save & Share
              </Button>
            </div>
          </div>
        )}

        {/* main tabs when flow ok */}
        {!isVerifying && !needsSaving && (
          <Tabs
            value={activeTab}
            onValueChange={v => setActiveTab(v as any)}
            className="mt-4"
          >
            <TabsList
              className={cn(
                'grid grid-cols-2 rounded-lg p-1',
                dark ? 'bg-[#1e293b]' : 'bg-slate-100',
                sectionBorder,
              )}
            >
              <TabsTrigger value="create" className="text-sm py-1.5 rounded-md">
                Create
              </TabsTrigger>
              <TabsTrigger value="manage" className="text-sm py-1.5 rounded-md">
                Manage
              </TabsTrigger>
            </TabsList>

            {/* ───── create tab ───── */}
            <TabsContent value="create" className="pt-5 space-y-5">
              {shareUrl ? (
                <>
                  <Alert
                    className={cn(
                      'border-[2px] rounded-lg',
                      dark
                        ? 'bg-green-900/20 border-green-600 text-green-200'
                        : 'bg-green-50 border-green-400 text-green-800',
                    )}
                  >
                    <AlertDescription className="flex items-center gap-1.5 text-sm">
                      <Check className="h-4 w-4" />
                      Link created!
                    </AlertDescription>
                  </Alert>

                  <Line>
                    <Label className="font-semibold text-sm">Share URL</Label>
                    <div className="flex gap-2">
                      <input
                        className={cn(input, 'flex-1 select-all cursor-pointer')}
                        value={shareUrl}
                        readOnly
                        onClick={e => e.stopPropagation()}
                      />
                      <Button
                        className={btn('outline', true)}
                        onClick={handleCopy}
                      >
                        {hasCopied ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <ClipboardCopy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </Line>

                  <div className="flex justify-between">
                    <Button className={btn('outline', true)} onClick={() => setShareUrl(null)}>
                      New Link
                    </Button>
                    <Button
                      className={btn('destructive', true)}
                      disabled={!shareId || isLoading}
                      onClick={() => shareId && deactivateShare(shareId)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Deactivate
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {shareError && (
                    <Alert
                      variant="destructive"
                      className={cn(
                        'border-[2px] rounded-lg',
                        dark
                          ? 'bg-red-900/20 border-red-600 text-red-200'
                          : 'bg-red-50 border-red-400 text-red-800',
                      )}
                    >
                      <AlertDescription className="text-sm">
                        {shareError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Line>
                    <Label className="font-semibold text-sm">Expiration</Label>
                    <Select
                      value={expirationType}
                      onValueChange={v =>
                        setExpirationType(v as 'never' | 'date')
                      }
                      disabled={isLoading || isSaving || needsSaving || verificationStatus === 'error'}
                    >
                      <SelectTrigger className={selectTrigger}>
                        <SelectValue placeholder="Expiration" />
                      </SelectTrigger>
                      <SelectContent className={panel}>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="date">Choose date…</SelectItem>
                      </SelectContent>
                    </Select>
                  </Line>

                  {expirationType === 'date' && (
                    <Line>
                      <Label className="font-semibold text-sm">
                        Expire on
                      </Label>
                      <input
                        className={input}
                        type="date"
                        value={expirationDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setExpirationDate(e.target.value)}
                        disabled={isLoading || isSaving || needsSaving || verificationStatus === 'error'}
                      />
                    </Line>
                  )}

                  <Button
                    className={btn('primary')}
                    disabled={
                      isLoading ||
                      !currentFlowId ||
                      (expirationType === 'date' && !expirationDate) ||
                      needsSaving ||
                      verificationStatus === 'error'
                    }
                    onClick={handleCreateShare}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    Create link
                  </Button>
                </>
              )}
            </TabsContent>

            {/* ───── manage tab ───── */}
            <TabsContent value="manage" className="pt-5">
              <Card className="border-0 shadow-none">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Your share links</h3>
                    <Button
                      className={btn('ghost', true)}
                      onClick={loadShares}
                      title="Refresh"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>

                  {existingShares.length === 0 ? (
                    <div
                      className={cn(
                        'rounded-lg border-[2px] border-dashed p-6 text-center text-sm opacity-70',
                        dark
                          ? 'border-blue-500/40 text-blue-200'
                          : 'border-slate-300',
                      )}
                    >
                      No share links yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {existingShares
                        .filter((s: any) => s.is_active)
                        .map((s: any) => (
                          <div
                            key={s.id}
                            className={cn(
                              'rounded-md border-[2px] p-3 text-sm',
                              s.flow_id === currentFlowId
                                ? dark
                                  ? 'border-blue-500 bg-blue-900/20'
                                  : 'border-blue-400 bg-blue-50'
                                : dark
                                ? 'border-blue-500/30'
                                : 'border-slate-300',
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1.5 truncate">
                                <Link2 className="h-3.5 w-3.5" />
                                {s.flow_id === currentFlowId
                                  ? 'Current flow'
                                  : 'Other flow'}
                              </span>
                              <Button
                                className={btn('ghost', true)}
                                onClick={() => deactivateShare(s.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="mt-2 flex justify-between text-xs opacity-70">
                              <span>
                                Created:{' '}
                                {new Date(s.created_at).toLocaleDateString()}
                              </span>
                              <span>Views: {s.access_count}</span>
                            </div>
                            <Button
                              className={cn(btn('outline', true), 'mt-3 w-full')}
                              onClick={() =>
                                navigator.clipboard.writeText(
                                  `${location.origin}/share/${s.id}`,
                                )
                              }
                            >
                              <ClipboardCopy className="h-3 w-3" />
                              Copy URL
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* footer */}
        <DialogFooter
          className={cn(
            'mt-6 pt-4 border-t-[3px] flex justify-end',
            sectionBorder,
          )}
        >
          <DialogClose asChild>
            <Button className={btn('outline')}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
