'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

import { SaveFlowDialog } from '@/components/flows/save-flow-dialog';
import EnvironmentManager from '@/components/enviroments/environment-manager';
import { ProfileSync } from '@/components/auth/profile-sync';

import { Button } from '@/components/ui/button';
import { useInitializeFlowStore } from '@/store/hooks/useInitializeFlowStore';
import { useFlowStore } from '@/store';
import { Save, Play, Loader2, Sun, Moon, Share } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { AiFlowAssistantDialog } from '@/components/ai/ai-flow-assistant-dialog';
import { useWarnOnUnload } from '@/store/hooks/useWarnOnUnload';
import FlowManager from '@/components/flows/flow-manager';
import { SyncInvitationsClient } from '@/components/auth/useSync';

// Cartoon reusable styles
const cartoonBtn =
  'relative gap-2 rounded-2xl border-2 px-4 py-2 font-bold transition-all duration-150 shadow-cartoon hover:-translate-y-0.5 hover:shadow-xl active:scale-95 disabled:opacity-60';
const outlineBtn = (dark: boolean) =>
  cn(
    cartoonBtn,
    dark
      ? 'bg-[#192844] border-blue-400 text-blue-100 hover:bg-blue-700/10 active:bg-blue-900/30'
      : 'bg-white border-neutral-800 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-200'
  );
const primaryBtn = cn(
  cartoonBtn,
  'bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-900'
);
const successBtn = cn(
  cartoonBtn,
  'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800'
);
const iconBtn = (dark: boolean) =>
  cn(
    'h-11 w-11 flex items-center justify-center rounded-full border-2 shadow-cartoon hover:scale-110 active:scale-95 focus:outline-none transition-all',
    dark
      ? 'bg-[#23315d] border-blue-400 text-blue-100 hover:bg-blue-600/20'
      : 'bg-white border-neutral-800 text-neutral-900 hover:bg-neutral-100'
  );

/* --------------------------- Theme toggle (UI) ---------------------------- */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={iconBtn(dark)}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      tabIndex={0}
    >
      {dark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
    </button>
  );
}

/* ------------------------------ AppHeader ------------------------------ */
interface AppHeaderProps {
  onOpenSaveDialog: () => void;
  onOpenAiDialog: () => void;
}

function AppHeader({ onOpenSaveDialog, onOpenAiDialog }: AppHeaderProps) {
  const {
    isSaving,
    currentFlowId,
    loadEnvironments,
    saveCurrentFlow,
    isRunning,
    runFlow,
    pendingInvitationsCount,
  } = useFlowStore();

  const { theme } = useTheme();
  const dark = theme === 'dark';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    (async () => {
      await loadEnvironments();
    })();
  }, [loadEnvironments]);

  if (!mounted) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3 border-b-2 backdrop-blur-xl shadow-[0_4px_30px_0_rgba(0,60,180,0.05)]',
        dark
          ? 'bg-[#0f172acc] border-blue-500/60'
          : 'bg-gradient-to-r from-white/80 via-white/95 to-neutral-100 border-neutral-800'
      )}
    >
      {/* --- izquierda --- */}
      <div className="flex items-center gap-4">
        <SignedIn>
          <FlowManager />
          <EnvironmentManager />
        </SignedIn>
      </div>

      {/* --- derecha --- */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <SignedIn>
          {/* Shared button con badge cartoon */}
          <Button
            size="sm"
            className={cn(outlineBtn(dark), "relative px-4 py-2")}
            onClick={() => router.push('/dashboard/shared')}
          >
            <Share className="h-5 w-5" />
            <span className="hidden sm:inline ml-2 font-semibold">Shared</span>
            {pendingInvitationsCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white dark:border-blue-950 bg-rose-500 text-[11px] font-bold shadow cartoon-badge z-20 animate-bounce text-white">
                {pendingInvitationsCount}
              </span>
            )}
          </Button>
          {/* Save */}
          <Button
            size="sm"
            className={outlineBtn(dark)}
            onClick={() => saveCurrentFlow()}
            disabled={!currentFlowId || isSaving}
          >
            {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span className="hidden sm:inline ml-2 font-semibold">Save</span>
          </Button>
          {/* Save As */}
          <Button size="sm" className={outlineBtn(dark)} onClick={onOpenSaveDialog}>
            <Save className="h-5 w-5" />
            <span className="hidden sm:inline ml-2 font-semibold">Save&nbsp;As…</span>
          </Button>
          {/* Run */}
          <Button
            size="sm"
            className={successBtn}
            onClick={runFlow}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
            <span className="hidden sm:inline ml-2 font-semibold">Run</span>
          </Button>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: cn(
                  "border-2 shadow-md rounded-full transition-all",
                  dark ? "border-blue-400" : "border-neutral-800"
                ),
              },
            }}
          />
        </SignedIn>

        <SignedOut>
          <SignInButton mode="modal">
            <Button size="sm" className={primaryBtn}>
              Sign&nbsp;In
            </Button>
          </SignInButton>
        </SignedOut>
      </div>
    </header>
  );
}

/* ------------------------------- Layout ------------------------------- */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  useInitializeFlowStore();
  useWarnOnUnload();

  const [saveOpen, setSaveOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const pathname = usePathname();
  const special = pathname?.includes('/dashboard/library') || pathname?.includes('/dashboard/shared');

  return (
    <div className="flex h-screen flex-col overflow-hidden text-neutral-800 dark:text-blue-100">
      <ProfileSync />
      <SyncInvitationsClient />

      {!special && (
        <AppHeader onOpenSaveDialog={() => setSaveOpen(true)} onOpenAiDialog={() => setAiOpen(true)} />
      )}

      <main
        className={cn(
          'flex-grow overflow-auto',
          special ? 'pt-0' : 'pt-0',
          'bg-white dark:bg-[#0f172a]'
        )}
      >
        {children}
      </main>

      <SignedIn>
        <SaveFlowDialog isOpen={saveOpen} onOpenChange={setSaveOpen} />
        <AiFlowAssistantDialog isOpen={aiOpen} onOpenChange={setAiOpen} />
      </SignedIn>
    </div>
  );
}
