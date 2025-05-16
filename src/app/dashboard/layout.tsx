'use client';;
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


/* ----------------- estilos cartoon reutilizables (solo UI) ---------------- */
const baseBtn = 'gap-1 rounded-xl border px-4 py-2 text-sm font-semibold transition-transform duration-150 hover:scale-[1.03] disabled:opacity-60';
const outlineBtn = (dark: boolean) =>
  cn(
    baseBtn,
    dark
      ? 'bg-[#1e293b] border-blue-400 text-blue-100 hover:bg-[#334155]'
      : 'bg-white border-neutral-800 text-neutral-800 hover:bg-neutral-100'
  );
const primaryBtn = cn(baseBtn, 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800');
const successBtn = cn(baseBtn, 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800');

/* --------------------------- Theme toggle (UI) ---------------------------- */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className={cn(
        'h-10 w-10 rounded-full border focus:outline-none',
        dark
          ? 'bg-[#1e293b] border-blue-400 text-blue-100 hover:bg-[#334155]'
          : 'bg-white border-neutral-800 text-neutral-800 hover:bg-neutral-100'
      )}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

/* ------------------------------ AppHeader ------------------------------ */
interface AppHeaderProps {
  onOpenSaveDialog: () => void;
  onOpenAiDialog: () => void;
}

function AppHeader({ onOpenSaveDialog, onOpenAiDialog }: AppHeaderProps) {
  /* lógica original intacta */
  const {
    isSaving,
    currentFlowId,
    currentFlowName,
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
    // IIFE to handle async function in useEffect
    (async () => {
      await loadEnvironments();
    })();
  }, [loadEnvironments]);

  if (!mounted) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 shadow-md backdrop-blur-md',
        dark ? 'bg-[#0f172acc] border-b border-blue-500/60' : 'bg-white/80 border-b border-neutral-800'
      )}
    >
      {/* --- izquierda --- */}
      <div className="flex items-center gap-3">
        <SignedIn>
          <FlowManager />
          <EnvironmentManager />
        </SignedIn>
      </div>

      {/* --- derecha --- */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <SignedIn>
          <Button
            size="sm"
            className={outlineBtn(dark) + " relative"}
            onClick={() => router.push('/dashboard/shared')}
          >
            <Share className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Shared</span>
            {pendingInvitationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {pendingInvitationsCount}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            className={outlineBtn(dark)}
            onClick={() => saveCurrentFlow()}
            disabled={!currentFlowId || isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1.5">Save</span>
          </Button>

          <Button size="sm" className={outlineBtn(dark)} onClick={onOpenSaveDialog}>
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline ml-1.5">Save&nbsp;As…</span>
          </Button>

          <Button
            size="sm"
            className={successBtn}
            onClick={runFlow}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            <span className="hidden sm:inline ml-1.5">Run</span>
          </Button>

          <UserButton afterSignOutUrl="/" />
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
