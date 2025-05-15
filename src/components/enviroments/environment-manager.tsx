'use client';

import { useFlowStore } from '@/store';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { KeyValueEditor } from '@/components/shared/key-value-editor';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Button } from '@/components/ui/button';
import {
  Globe,
  PlusCircle,
  Trash2,
  Pencil,
  Save,
  Eye,
} from 'lucide-react';

import { type EnvironmentVariable } from '@/contracts/types/environment.types';

/* -------------------------------------------------------------------------- */
/*                               Cartoon styles                               */
/* -------------------------------------------------------------------------- */
const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  const shadow = dark
    ? 'shadow-[4px_4px_0_#172554]'
    : 'shadow-[4px_4px_0_#0f172a]';

  const btn = (
    tone: 'primary' | 'outline' | 'ghost' | 'destructive' = 'outline',
    size: 'sm' | 'icon' = 'sm',
  ) =>
    cn(
      'rounded-xl border-[2px] font-semibold transition-transform duration-150 hover:scale-[1.03] disabled:opacity-60 flex items-center gap-1.5',
      size === 'sm' && 'px-4 py-2 h-9 text-sm',
      size === 'icon' && 'h-8 w-8 p-0',
      shadow,
      tone === 'primary' &&
        (dark
          ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
          : 'bg-blue-500 hover:bg-blue-600 border-slate-900 text-white'),
      tone === 'outline' &&
        (dark
          ? 'bg-[#1e293b] hover:bg-[#334155] text-blue-100 border-blue-500'
          : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-900'),
      tone === 'ghost' &&
        (dark
          ? 'text-blue-300 hover:bg-blue-900/40 border-transparent'
          : 'text-blue-600 hover:bg-blue-100 border-transparent'),
      tone === 'destructive' &&
        (dark
          ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white'
          : 'bg-red-500 hover:bg-red-600 border-slate-900 text-white'),
    );

  const input = cn(
    'w-full h-10 px-3 rounded-lg border-[2px] shadow-inner text-sm focus:ring-2',
    dark
      ? 'bg-neutral-700 border-blue-500 text-blue-100 placeholder:text-blue-300 focus:ring-blue-400'
      : 'bg-white border-slate-900 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500',
  );

  const panel = (
    outer = false,
  ) =>
    cn(
      outer ? 'border-[3px]' : 'border-[2px]',
      outer ? shadow : '',
      dark
        ? outer
          ? 'bg-[#0f172a] border-blue-600 text-blue-200'
          : 'bg-[#1e293b] border-blue-500/40'
        : outer
        ? 'bg-white border-slate-900 text-slate-800'
        : 'bg-white border-slate-300',
    );

  return { dark, btn, input, panel };
};

/* -------------------------------------------------------------------------- */
/*                           EnvironmentManager                               */
/* -------------------------------------------------------------------------- */
const EnvironmentManager = () => {
  /* store */
  const {
    environments,
    selectedEnvironmentId,
    loadEnvironments,
    saveEnvironment,
    deleteEnvironment,
    selectEnvironment,
    getActiveEnvironment,
    userId,
    isSaving,
    editingEnvironment,
    setEditingEnvironment,
  } = useFlowStore();

  /* cartoon hook */
  const C = useCartoon();

  /* state */
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [viewVars, setViewVars] = useState(false);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [confirmDlg, setConfirmDlg] = useState(false);

  useEffect(() => {
    (async () => {
      await loadEnvironments();
    })();
  }, [loadEnvironments]);
  useEffect(() => setReady(true), []);

  const active = getActiveEnvironment();

  /* helpers */
  const newEnv = async () => {
    const temp = { name: 'New Environment', variables: [] as EnvironmentVariable[] };
    setEditingEnvironment({
      ...temp,
      id: 'tmp',
      user_id: userId || 'tmp',
      created_at: '',
      updated_at: '',
    });
    const saved = await saveEnvironment(temp);
    if (saved) {
      setEditingEnvironment(saved);
      selectEnvironment(saved.id);
    }
  };

  const saveEdit = async () => {
    if (editingEnvironment) {
      await saveEnvironment(editingEnvironment);
      setEditingEnvironment(null);
      setDrawer(false);
    }
  };

  const remove = async () => {
    if (toDelete) {
      await deleteEnvironment(toDelete);
      setToDelete(null);
      setConfirmDlg(false);
    }
  };

  if (!ready) {
    return (
      <Button className={cn(C.btn('outline'), 'animate-pulse')} disabled>
        <div className="w-4 h-4 rounded-full bg-gray-300 mr-2" />
        <div className="w-24 h-4 rounded bg-gray-300" />
      </Button>
    );
  }

  /* ------------------------------------------------------------------ */
  /*                               render                               */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* trigger */}
      <div className="flex items-center gap-2">
        <Button className={C.btn('outline')} onClick={() => setDrawer(true)}>
          <Globe className="h-4 w-4" />
          <span className="truncate max-w-[120px]">{active ? active.name : 'No Environment'}</span>
        </Button>
        {active && (
          <Button className={C.btn('ghost', 'icon')} onClick={() => setViewVars(true)} title="View variables">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* drawer manage */}
      <Drawer open={drawer} onOpenChange={setDrawer}>
        <DrawerContent className={C.panel(true)}>
          <div className="max-w-4xl mx-auto w-full">
            <DrawerHeader className="p-6 pb-4 border-b-[3px] border-blue-600/40">
              <DrawerTitle className="text-xl font-bold">Manage Environments</DrawerTitle>
              <DrawerDescription className="text-sm opacity-80">
                Create, edit or select an environment.
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* list */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Your Environments</h3>
                  <Button className={C.btn('primary', 'sm')} onClick={newEnv}>
                    <PlusCircle className="h-4 w-4" /> New
                  </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {environments.length === 0 ? (
                    <div className={cn(C.panel(), 'col-span-2 p-4 text-center italic')}>
                      No environments
                    </div>
                  ) : (
                    environments.map(e => (
                      <div
                        key={e.id}
                        className={cn(
                          C.panel(),
                          'p-3 flex items-center justify-between',
                          selectedEnvironmentId === e.id && (C.dark ? 'bg-blue-900/40 border-blue-500' : 'bg-blue-50 border-blue-400'),
                        )}
                      >
                        <div>
                          <p className="font-medium truncate">{e.name}</p>
                          <p className="text-xs opacity-70">{e.variables.length} vars</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className={C.btn('ghost', 'icon')}
                            onClick={() => { selectEnvironment(e.id); setEditingEnvironment({ ...e }); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className={C.btn('ghost', 'icon')}
                            onClick={() => { setToDelete(e.id); setConfirmDlg(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* editor */}
              {editingEnvironment && (
                <div className="space-y-4 border-t-[2px] pt-6">
                  <div>
                    <label className="font-semibold block mb-1">Name</label>
                    <input
                      className={C.input}
                      value={editingEnvironment.name}
                      onChange={e => setEditingEnvironment({ ...editingEnvironment, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Variables</label>
                    <KeyValueEditor
                      entries={editingEnvironment.variables}
                      onChange={v => setEditingEnvironment({ ...editingEnvironment, variables: v })}
                      keyPlaceholder="VAR_NAME"
                      valuePlaceholder="value or secret"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button className={C.btn('outline')} onClick={() => setEditingEnvironment(null)}>
                      Cancel
                    </Button>
                    <Button className={C.btn('primary')} onClick={saveEdit} disabled={isSaving}>
                      <Save className="h-4 w-4" /> Save
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DrawerFooter className="p-4 border-t-[3px] border-blue-600/40 flex justify-end">
              <Button className={C.btn('outline')} onClick={() => setDrawer(false)}>
                Close
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* drawer variables */}
      <Drawer open={viewVars} onOpenChange={setViewVars}>
        <DrawerContent className={C.panel(true)}>
          <div className="max-w-4xl mx-auto w-full">
            <DrawerHeader className="p-6 pb-4 border-b-[3px] border-blue-600/40">
              <DrawerTitle className="text-xl font-bold">Variables – {active?.name}</DrawerTitle>
              <DrawerDescription className="text-sm opacity-80">
                Use as <code>{'{{VAR_NAME}}'}</code>
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {!active || active.variables.length === 0 ? (
                <div className={cn(C.panel(), 'p-4 text-center italic')}>No variables</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {active.variables.map(v => (
                    <div
                      key={v.id}
                      className={cn(
                        C.panel(),
                        'p-3 break-all',
                        !v.enabled && 'opacity-60',
                      )}
                    >
                      <p className="font-mono text-sm font-semibold truncate">{v.key}</p>
                      <p className="font-mono text-xs mt-1 line-clamp-2">{v.value}</p>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded inline-block mt-2',
                        v.enabled
                          ? C.dark
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-green-100 text-green-700'
                          : C.dark
                          ? 'bg-neutral-800 text-neutral-400'
                          : 'bg-neutral-100 text-neutral-500',
                      )}>
                        {v.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DrawerFooter className="p-4 border-t-[3px] border-blue-600/40 flex justify-end gap-3">
              <Button className={C.btn('outline')} onClick={() => setViewVars(false)}>
                Close
              </Button>
              <Button
                className={C.btn('primary')}
                onClick={() => {
                  if (active) {
                    setEditingEnvironment({ ...active });
                    setViewVars(false);
                    setDrawer(true);
                  }
                }}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* confirm delete */}
      <AlertDialog open={confirmDlg} onOpenChange={setConfirmDlg}>
        <AlertDialogContent className={cn(C.panel(true), 'sm:max-w-md')}>
          <AlertDialogHeader className="p-6 pb-4 border-b-[3px] border-red-500/40">
            <AlertDialogTitle className="text-lg font-bold flex gap-2 items-center">
              <Trash2 className="h-5 w-5" /> Delete Environment
            </AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-6 pt-4 flex justify-end gap-3">
            <AlertDialogCancel className={C.btn('outline')} onClick={() => setToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className={C.btn('destructive')} onClick={remove}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EnvironmentManager;
  