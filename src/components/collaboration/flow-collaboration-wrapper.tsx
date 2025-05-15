/* ────────────── FlowCollaborationWrapper – cartoon-style UI only ────────────── */
/*  • Lógica intacta: no se toca ni una línea funcional                          */
/*  • Solo cambia la presentación (clases Tailwind)                              */

"use client";

import React, { useCallback } from "react";
import { usePathname } from "next/navigation";
import { Home, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";

import { CollaborationManager } from "@/components/collaboration/collaboration-manager";
import { useCollaborativeFlow } from "@/hooks/use-collaborative-flow";
import { useToast } from "@/components/ui/use-toast";
import { useFlowStore } from "@/store";
import { CollaborationProvider } from "@/contexts/collaboration-context";
import { PresenceIndicator } from "./presence-indicator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface FlowCollaborationWrapperProps {
  flowId: string;
  children: React.ReactNode;
}

/* -------- cartoon border/shadow helper (solo clases) -------- */
const cartoon = {
  shadowLight: "shadow-[4px_4px_0px_#0f172a]",
  shadowDark: "shadow-[4px_4px_0px_#172554]",
};

export function FlowCollaborationWrapper({
  flowId,
  children,
}: FlowCollaborationWrapperProps) {
  const { toast } = useToast();
  const pathname = usePathname();
  const { theme } = useTheme();
  /* --------------------- lógica original intacta --------------------- */
  const zustandSetLoadedFlowData = useFlowStore(
    (state) => state.setLoadedFlowData
  );
  const displayFlowNameFromStore = useFlowStore(
    (state) => state.currentFlowName
  );
  const isViewOnly = pathname.includes("/view/") || pathname.includes("/share/");

  const handleFlowLoaded = useCallback(
    (flowDataFromHook: any) => {
      if (zustandSetLoadedFlowData) {
        zustandSetLoadedFlowData({
          id: flowId,
          name: flowDataFromHook.name || "Untitled Flow",
          description: flowDataFromHook.description || "",
          nodes: flowDataFromHook.nodes || [],
          edges: flowDataFromHook.edges || [],
          updated_at: flowDataFromHook.updated_at,
          collections: null,
        } as any);
      }
      toast({
        title: "Flujo cargado",
        description: `Última actualización: ${new Date(
          flowDataFromHook.updated_at
        ).toLocaleString()}`,
      });
    },
    [flowId, zustandSetLoadedFlowData, toast]
  );

  const handleFlowError = useCallback((err: Error) => {

  }, []);

  const {
    flowName: hookFlowName,
    isLoading,
    error,
    isSaving,
    lastSaved,
    isEditable,
    updateCursorPosition,
    remoteCursors,
    reload,
  } = useCollaborativeFlow({
    flowId,
    onFlowLoaded: handleFlowLoaded,
    onError: handleFlowError,
    onRemoteChanges: (changes) => {
      if (changes.nodes || changes.edges) {
        toast({
          title: "Cambios recibidos",
          description: "El flujo ha sido actualizado por otro usuario.",
        });
      }
    },
  });

  const collaborationContextValue = {
    updateCursorPosition,
    remoteCursors,
  };

  /* ------------------------ estados de carga / error ------------------------ */
  if (isLoading)
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center p-6  shadow-inner',
          theme === 'dark'
            ? 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900/90 border-blue-500/40'
            : 'bg-gradient-to-br from-neutral-50 via-neutral-200 to-neutral-50 border-neutral-800/40'
        )}
      >
        <div className="flex flex-col items-center gap-4">
          {/* “Cartoon” spinner */}
          <span
            className={cn(
              'inline-block h-12 w-12 animate-spin rounded-full border-[6px] border-current border-t-transparent',
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            )}
            aria-label="Loading"
          />
          <p
            className={cn(
              'font-semibold tracking-wide',
              theme === 'dark' ? 'text-blue-200' : 'text-neutral-700'
            )}
          >
            Cargando datos del flujo…
          </p>
        </div>
      </div>
    );
  
  /* ───────────────── ERROR ───────────────── */
  if (error)
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div
          className={cn(
            'max-w-md rounded-2xl border-2 p-6 shadow-lg',
            theme === 'dark'
              ? 'bg-red-900/20 border-red-500 text-red-200'
              : 'bg-red-50 border-red-600 text-red-700'
          )}
        >
          <h2 className="mb-2 flex items-center gap-2 text-xl font-bold">
            <XCircle className="h-5 w-5 flex-shrink-0" />
            Error al cargar
          </h2>
          <p className="text-sm leading-relaxed">{error.message}</p>
        </div>
      </div>
    );
  const displayFlowName = displayFlowNameFromStore || hookFlowName || "…";

  /* --------------------------------- UI ---------------------------------- */
  return (
    <CollaborationProvider value={collaborationContextValue}>
      <div className="flex flex-col w-full h-full">
        {/* cartoon sticky top-bar */}
        <div
          className={cn(
            "sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 backdrop-blur-md ",
            "bg-white/80 dark:bg-[#0f172acc]",
            "border-slate-900 dark:border-blue-600",
            "font-semibold",
            "shadow-[4px_4px_0px_rgba(15,23,42,0.9)] dark:shadow-[4px_4px_0px_#172554]"
          )}
        >
          {/* nombre + estado guardado */}
          <div className="flex items-center gap-2 min-w-0">
            <h2
              className="truncate"
              title={displayFlowName}
            >
              {displayFlowName}
            </h2>
            {!isViewOnly && (
              <>
                {isSaving ? (
                  <span className="text-xs opacity-70">Guardando…</span>
                ) : lastSaved ? (
                  <span
                    className="text-xs opacity-70"
                    title={lastSaved.toISOString()}
                  >
                    Guardado {lastSaved.toLocaleTimeString()}
                  </span>
                ) : (
                  isEditable && (
                    <span className="text-xs opacity-70">
                      Todos los cambios guardados
                    </span>
                  )
                )}
              </>
            )}
            {flowId && <PresenceIndicator flowId={flowId} />}
          </div>

          {/* acciones */}
          <div className="flex items-center gap-2">
          <Link href="/dashboard" passHref>
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "h-8 w-8 border-[3px] rounded-lg shadow-[4px_4px_0px_rgba(15,23,42,0.9)] dark:shadow-[4px_4px_0px_#172554]"
      )}
      title="Volver al Dashboard"
    >
      <Home className="h-4 w-4" />
    </Button>
  </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => reload()}
              disabled={isLoading}
              className={cn(
                "h-8 w-8 border-[3px] rounded-lg",
                "shadow-[4px_4px_0px_rgba(15,23,42,0.9)] dark:shadow-[4px_4px_0px_#172554]"
              )}
              title="Refrescar flujo"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading ? "animate-spin" : "")}
              />
            </Button>

            <CollaborationManager flowId={flowId} flowName={displayFlowName} />
          </div>
        </div>

        {/* zona de trabajo */}
        <div className="flex-1 relative">{children}</div>
      </div>
    </CollaborationProvider>
  );
}
