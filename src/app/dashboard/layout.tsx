'use client'; // This layout needs client-side logic (hooks, state from AppHeader)

import { useState, useEffect } from 'react';
import { FlowManager } from "@/components/flows/flow-manager";
import { SaveFlowDialog } from "@/components/flows/save-flow-dialog";
import { EnvironmentManager } from "@/components/flows/environment-manager";
import { Button } from "@/components/ui/button";
import { useFlowStore, useInitializeFlowStore } from "@/store/flow-store";
import { Save, Play, Loader2, Sun, Moon } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ThemeProvider, useTheme } from 'next-themes'; // Importar ThemeProvider y hook

// Define cartoon button styles
const baseCartoonButtonStyle = "gap-1 rounded-xl border-2 border-neutral-800 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
const outlineCartoonButtonStyle = `${baseCartoonButtonStyle} bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-blue-500`;
const primaryCartoonButtonStyle = `${baseCartoonButtonStyle} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
const successCartoonButtonStyle = `${baseCartoonButtonStyle} bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 focus:ring-emerald-500`;

// Botón para alternar el tema
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "w-10 h-10 rounded-full border-2",
        isDark 
          ? "bg-gray-800 border-blue-400 text-blue-300 hover:bg-gray-700" 
          : "bg-white border-neutral-800 text-neutral-700 hover:bg-neutral-100"
      )}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

// Define props for AppHeader
interface AppHeaderProps {
  onOpenSaveDialog: () => void;
}

// Re-define AppHeader here or import if extracted
function AppHeader({ onOpenSaveDialog }: AppHeaderProps) {
  const {
    isSaving,
    currentFlowId,
    loadEnvironments,
    saveCurrentFlow,
    isRunning,
    runFlow
  } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);
  
  return (
    <>
      <header className={cn(
        "sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 shadow-md",
        isDark 
          ? "dark-cartoon-header" 
          : "bg-white border-b-2 border-neutral-800"
      )}>
        {/* Left side: Flow & Env Managers */}
        <div className="flex items-center gap-3">
          <SignedIn>
            <FlowManager />
            <EnvironmentManager />
          </SignedIn>
        </div>

        {/* Right side: Actions & User */}
        <div className="flex items-center gap-3">
          <SignedIn>
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Save Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                isDark 
                  ? "dark-cartoon-button" 
                  : outlineCartoonButtonStyle,
                "flex items-center"
              )}
              onClick={() => saveCurrentFlow()}
              disabled={!currentFlowId || isSaving}
              title={!currentFlowId ? "Save the flow first using the Flows menu" : "Save (Ctrl+S)"}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1.5">Save</span>
            </Button>

            {/* Save As Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                isDark 
                  ? "dark-cartoon-button" 
                  : outlineCartoonButtonStyle,
                "flex items-center"
              )}
              onClick={onOpenSaveDialog}
              title="Save As..."
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline ml-1.5">Save As...</span>
            </Button>

            {/* Run Flow Button */}
            <Button
              variant="outline"
              size="sm"
              className={cn(
                isDark 
                  ? "bg-green-600 hover:bg-green-700 text-white border-2 border-green-800 rounded-xl" 
                  : successCartoonButtonStyle,
                "flex items-center"
              )}
              onClick={runFlow}
              disabled={isRunning}
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1.5">Run</span>
            </Button>

            {/* User Button with custom styling */}
        
              <UserButton afterSignOutUrl="/" />
           
          </SignedIn>
          <SignedOut>
            {/* Sign In Button */}
            <ThemeToggle />
            <SignInButton mode="modal">
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  isDark 
                    ? "dark-cartoon-button" 
                    : primaryCartoonButtonStyle
                )}
              >
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  useInitializeFlowStore();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={true}
    >
      <div className="flex h-screen flex-col overflow-hidden text-neutral-800 dark:text-white">
        <AppHeader onOpenSaveDialog={() => setIsSaveDialogOpen(true)} />
        <main className="flex-grow overflow-auto p-0 shadow-inner bg-white dark:bg-gray-900">
          {children}
        </main>
        <SignedIn>
          <SaveFlowDialog isOpen={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen} />
        </SignedIn>
      </div>
    </ThemeProvider>
  );
} 