'use client';;
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFlowStore } from '@/store';

import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose,
} from '@/components/ui/drawer';
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
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import {
    Save,
    Folder,
    FolderOpen,
    Trash2,
    Download,
    Upload,
    PlusCircle,
    Loader2,
    Square,
    BookOpenCheck,
    TestTube,
    BrainCircuit,
    Search,
    ArrowUpDown,
    Share2,
} from 'lucide-react';

import { cn, generateSlug } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useTheme } from 'next-themes';

import {
    NODE_TEST_WORKFLOW,
    TUTORIAL_WORKFLOW,
    workflowTemplates,
} from '@/config/workflow-templates';
import { SavedFlow } from '@/contracts/types';
import { ShareFlowDialog } from './share-flow-dialog';

/* -------------------------------------------------------------------------- */
/*                                   types                                    */
/* -------------------------------------------------------------------------- */
type FlowItem = SavedFlow & { isTemplate?: boolean };
type SortOption = 'name_asc' | 'name_desc' | 'date_asc' | 'date_desc';

/* -------------------------------------------------------------------------- */
/*                           helpers (sin cambios)                            */
/* -------------------------------------------------------------------------- */
const formatDate = (str: string) => {
  try {
    const d = new Date(str);
    const now = new Date();
    if (now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(d, { addSuffix: true });
    }
    return format(d, 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
};

/* -------------------------------------------------------------------------- */
/*                      hook de estilos "cartoon" (UI)                        */
/* -------------------------------------------------------------------------- */
const useCartoon = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const shadow = dark
    ? 'shadow-[4px_4px_0_#172554]'
    : 'shadow-[4px_4px_0_#0f172a]';

  /* botones --------------------------------------------------------------- */
  const btn = (
    variant: 'primary' | 'outline' | 'destructive' = 'primary',
    size: 'sm' | 'icon' = 'sm',
  ) =>
    cn(
      'rounded-xl border px-4 py-2 text-sm font-semibold transition-transform duration-150 hover:scale-[1.03] disabled:opacity-60 flex items-center gap-1.5',
      size === 'sm' && 'h-9',
      size === 'icon' && 'h-8 w-8 p-0',
      shadow,
      variant === 'primary' &&
        (dark
          ? 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
          : 'bg-blue-500 hover:bg-blue-600 border-slate-900 text-white'),
      variant === 'outline' &&
        (dark
          ? 'bg-[#1e293b] hover:bg-[#334155] border-blue-500 text-blue-100'
          : 'bg-white hover:bg-slate-100 border-slate-900 text-slate-800'),
      variant === 'destructive' &&
        (dark
          ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white'
          : 'bg-red-500 hover:bg-red-600 border-slate-900 text-white'),
    );

  /* inputs ---------------------------------------------------------------- */
  const input = cn(
    'rounded-lg border-[2px] h-10 text-sm shadow-inner focus:ring-2',
    dark
      ? 'bg-neutral-800 border-blue-500/50 text-blue-200 placeholder:text-blue-400 focus:ring-blue-400'
      : 'bg-white border-slate-900 text-slate-800 placeholder:text-slate-400 focus:ring-blue-500',
  );
  const textarea = cn(input, 'min-h-[70px]');

  /* layout ---------------------------------------------------------------- */
  const side = cn(
    'md:w-64 flex flex-col gap-2 flex-shrink-0 p-4 md:p-0 md:pr-4 pb-4 md:pb-0 border-b-2 md:border-b-0 md:border-r-[2px]',
    dark ? 'border-blue-500/40' : 'border-slate-300',
  );
  const sideItem = (active = false) =>
    cn(
      'w-full h-9 rounded-lg text-sm flex items-center gap-2 px-3 py-1.5 transition-colors',
      dark
        ? 'hover:bg-neutral-800/60 text-blue-300'
        : 'hover:bg-slate-100 text-slate-700',
      active &&
        (dark
          ? 'bg-blue-900/60 text-blue-100 border-l-4 border-blue-500 pl-[calc(0.75rem-4px)]'
          : 'bg-blue-100 text-blue-800 border-l-4 border-blue-500 pl-[calc(0.75rem-4px)]'),
    );

  /* tarjeta flujo --------------------------------------------------------- */
  const card = (current = false, loading = false) =>
    cn(
      'rounded-xl border-[2px] p-4 flex flex-col transition-transform duration-150 hover:scale-[1.02] outline-none',
      dark
        ? 'bg-[#1e293b]/60 border-blue-500/40 hover:border-blue-500/80'
        : 'bg-white border-slate-300 hover:border-slate-500',
      current &&
        (dark
          ? 'border-blue-500 bg-blue-900/20'
          : 'border-blue-600 bg-blue-50/50'),
      loading && 'opacity-70 cursor-default',
      !loading && 'cursor-pointer',
    );

  /* dialog / dropdown ----------------------------------------------------- */
  const dlg = (danger = false) =>
    cn(
      'p-0 sm:max-w-lg rounded-xl border-[3px] shadow-xl',
      shadow,
      danger
        ? dark
          ? 'bg-neutral-900 border-red-500 text-red-200'
          : 'bg-white border-slate-900 text-slate-800'
        : dark
        ? 'bg-neutral-900 border-blue-500 text-blue-200'
        : 'bg-white border-slate-900 text-slate-800',
    );
  const dropdown = cn(
    'rounded-xl border-[2px] p-1.5 shadow-md min-w-[220px] z-50',
    dark ? 'bg-[#1e293b] border-blue-500' : 'bg-white border-slate-900',
  );

  return { dark, shadow, btn, input, textarea, side, sideItem, card, dlg, dropdown };
};

/* -------------------------------------------------------------------------- */
/*                         FlowCard (UI only)                                 */
/* -------------------------------------------------------------------------- */
interface FlowCardProps {
  flow: FlowItem;
  current: boolean;
  styles: ReturnType<typeof useCartoon>;
  load: (f: FlowItem) => void;
  del: (f: FlowItem) => void;
  loading: boolean;
}
const FlowCard: React.FC<FlowCardProps> = ({ flow, current, styles, load, del, loading }) => {
  return (
    <div
      className={styles.card(current, loading)}
      role="button"
      tabIndex={loading ? -1 : 0}
      onClick={() => !loading && load(flow)}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && !loading) load(flow);
      }}
    >
      {/* delete */}
      {!flow.isTemplate && (
        <Button
          size="icon"
          variant="ghost"
          onClick={e => {
            e.stopPropagation();
            del(flow);
          }}
          disabled={loading || current}
          className="absolute top-2 right-2 opacity-60 hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      {/* header */}
      <div className="flex items-start gap-2 mb-2">
        {flow.isTemplate ? (
          <BrainCircuit className="h-5 w-5 text-purple-500" />
        ) : (
          <Folder className="h-5 w-5 text-cyan-500" />
        )}
        <span className="font-semibold truncate flex-1">{flow.name}</span>
      </div>

      {/* description */}
      <p className="text-xs mb-3 min-h-[30px]">
        {flow.description
          ? flow.description.length > 100
            ? `${flow.description.slice(0, 97)}…`
            : flow.description
          : (
            <span className={styles.dark ? 'text-blue-400/60 italic' : 'text-slate-400 italic'}>
              No description
            </span>
          )}
      </p>

      <div className={cn('text-xs pt-2 border-t', styles.dark ? 'border-blue-500/20 text-blue-400/80' : 'border-slate-200 text-slate-500')}>
        Modified: {formatDate(flow.updated_at)}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                             FlowManager                                    */
/* -------------------------------------------------------------------------- */
export default function FlowManager() {
  /* store --------------------------------------------------------------- */
  const {
    savedFlows,
    loadSavedFlows,
    saveCurrentFlow,
    loadFlow,
    deleteFlow,
    createNewFlow,
    exportCurrentFlow,
    importFlow,
    currentFlowId,
    currentFlowName,
    currentFlowDescription,
    currentFlowCollection,
    currentFlowSlug,
    isSaving,
    isLoading,
    loadWorkflow,
  } = useFlowStore();

  /* state --------------------------------------------------------------- */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('date_desc');
  const [importDlg, setImportDlg] = useState(false);
  const [saveDlg, setSaveDlg] = useState(false);
  const [shareDlg, setShareDlg] = useState(false);
  const [deleteDlg, setDeleteDlg] = useState<FlowItem | null>(null);
  const [view, setView] = useState<string | null>(null);

  /* save dialog fields */
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [coll, setColl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [newColl, setNewColl] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const styles = useCartoon();

  /* effects ------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      await loadSavedFlows();
    })();
  }, [loadSavedFlows]);

  useEffect(() => {
    if (saveDlg) {
      setName(currentFlowName || '');
      setDesc(currentFlowDescription || '');
      setColl(currentFlowCollection || '');
      setCustomSlug(currentFlowSlug || '');
      setNewColl(false);
    }
  }, [saveDlg, currentFlowName, currentFlowDescription, currentFlowCollection, currentFlowSlug]);

  /* collections list ---------------------------------------------------- */
  const collections = useMemo(() => {
    const set = new Set<string>();
    savedFlows.forEach(f => f.collections && set.add(f.collections));
    return [...set].sort();
  }, [savedFlows]);

  /* virtual template entries ------------------------------------------- */
  const templates = useMemo<FlowItem[]>(
    () =>
      workflowTemplates.map((t, i) => ({
        id: `tpl-${i}`,
        name: t.name,
        description: t.description,
        updated_at: new Date(Date.now() - i * 60000).toISOString(),
        collections: 'Templates',
        isTemplate: true,
        user_id: '__TEMPLATE__',
        created_at: '',
        nodes: t.nodes,
        edges: t.edges,
      })),
    [],
  );

  /* list with filters --------------------------------------------------- */
  const list = useMemo<FlowItem[]>(() => {
    let arr: FlowItem[] = [...savedFlows];
    if (view === 'Templates') arr = templates;
    else if (view === '__UNCATEGORIZED__') arr = arr.filter(f => !f.collections && !f.isTemplate);
    else if (view) arr = arr.filter(f => f.collections === view && !f.isTemplate);
    else arr = [...templates, ...arr];

    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(
        f =>
          f.name.toLowerCase().includes(s) ||
          f.description?.toLowerCase().includes(s) ||
          f.collections?.toLowerCase().includes(s),
      );
    }

    arr.sort((a, b) => {
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'date_asc':
          return +new Date(a.updated_at) - +new Date(b.updated_at);
        default:
          return +new Date(b.updated_at) - +new Date(a.updated_at);
      }
    });
    return arr;
  }, [savedFlows, templates, view, search, sort]);

  /* handlers ------------------------------------------------------------ */
  const handleSaveFlow = async () => {
    if (!name.trim()) return;
    await saveCurrentFlow(name, desc, coll || null, undefined, undefined, customSlug.trim());
    setSaveDlg(false);
    loadSavedFlows();
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.json')) {
      e.target.value = '';
      return;
    }
    await importFlow(f);
    setImportDlg(false);
    loadSavedFlows();
    e.target.value = '';
  };

  const loadItem = (f: FlowItem) => {
    if (isLoading) return;
    if (f.isTemplate) {
      const tpl = workflowTemplates.find(t => t.name === f.name);
      if (tpl) {
        loadWorkflow(tpl);
      }
    } else {
      loadFlow(f.id);
    }
    setDrawerOpen(false);
  };

  const deleteItem = (f: FlowItem) => {
    if (f.isTemplate || f.id === currentFlowId) return;
    setDeleteDlg(f);
  };

  const confirmDelete = async () => {
    if (deleteDlg && !deleteDlg.isTemplate) {
      await deleteFlow(deleteDlg.id);
      setDeleteDlg(null);
      loadSavedFlows();
    }
  };

  /* -------------------------------------------------------------------- */
  /*                               RENDER                                 */
  /* -------------------------------------------------------------------- */
  return (
    <>
      {/* drawer trigger */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button size="sm" className={styles.btn('outline')}>
            <FolderOpen className="h-4 w-4" /> Manage Flows
          </Button>
        </DrawerTrigger>

        {/* drawer content */}
        <DrawerContent
          className={cn(
            'border-t-[3px] mt-20 shadow-lg',
            styles.shadow,
            styles.dark ? 'bg-[#0f172a] border-blue-600 text-blue-200' : 'bg-gray-50 border-slate-900 text-slate-800',
          )}
        >
          <div className="mx-auto w-full max-w-7xl p-5 flex flex-col h-[85vh]">

            {/* header */}
            <DrawerHeader className="p-0 mb-4">
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                Flow Manager
                {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              </DrawerTitle>
              <DrawerDescription className={styles.dark ? 'text-blue-400/80' : 'text-slate-600'}>
                Browse, load, save and manage your flows.
              </DrawerDescription>
            </DrawerHeader>

            {/* layout */}
            <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">

              {/* sidebar */}
              <aside className={styles.side}>
                <h3 className="text-xs font-bold mt-3 mb-1 uppercase tracking-wider">Actions</h3>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className={styles.btn('primary')}>
                      <PlusCircle className="h-4 w-4" /> Create Flow
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className={styles.dropdown} sideOffset={6} align="start">
                    <DropdownMenuLabel>New</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => { createNewFlow(); setDrawerOpen(false); }}>
                      <Square className="h-4 w-4 text-gray-400" /> Blank Flow
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Template</DropdownMenuLabel>
                    {workflowTemplates.map(t => (
                      <DropdownMenuItem key={t.name} onClick={() => { loadWorkflow(t); setDrawerOpen(false); }}>
                        {t.name === TUTORIAL_WORKFLOW.name ? (
                          <BookOpenCheck className="h-4 w-4 text-blue-500" />
                        ) : t.name === NODE_TEST_WORKFLOW.name ? (
                          <TestTube className="h-4 w-4 text-purple-500" />
                        ) : (
                          <BrainCircuit className="h-4 w-4 text-emerald-500" />
                        )}
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button className={styles.btn('outline')} onClick={exportCurrentFlow}>
                  <Download className="h-4 w-4" /> Export Current
                </Button>
                <Button className={styles.btn('outline')} onClick={() => setImportDlg(true)}>
                  <Upload className="h-4 w-4" /> Import Flow
                </Button>
                <Button className={styles.btn('outline')} disabled={!currentFlowId} onClick={() => setShareDlg(true)}>
                  <Share2 className="h-4 w-4" /> Share Current
                </Button>

                {/* browse */}
                <h3 className="text-xs font-bold mt-4 mb-1 uppercase tracking-wider">Browse</h3>
                <Button className={styles.sideItem(view === null)} variant="ghost" size="sm" onClick={() => setView(null)}>
                  <FolderOpen className="h-4 w-4 text-blue-500" /> All
                </Button>
                <Button className={styles.sideItem(view === 'Templates')} variant="ghost" size="sm" onClick={() => setView('Templates')}>
                  <BrainCircuit className="h-4 w-4 text-purple-500" /> Templates
                </Button>
                <Button className={styles.sideItem(view === '__UNCATEGORIZED__')} variant="ghost" size="sm" onClick={() => setView('__UNCATEGORIZED__')}>
                  <Folder className="h-4 w-4 text-gray-400" /> <span className="italic">Uncategorized</span>
                </Button>
                {collections.length > 0 && <hr className={cn('my-2', styles.dark ? 'border-blue-500/40' : 'border-slate-300')} />}
                {collections.map(c => (
                  <Button key={c} className={styles.sideItem(view === c)} variant="ghost" size="sm" onClick={() => setView(c)}>
                    <Folder className="h-4 w-4 text-cyan-500" /> {c}
                  </Button>
                ))}
              </aside>

              {/* main */}
              <main className="flex-grow flex flex-col overflow-hidden">
                {/* toolbar */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <div className="relative flex-grow max-w-xs">
                    <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4', styles.dark ? 'text-blue-400/70' : 'text-slate-400')} />
                    <Input
                      placeholder="Search…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className={cn(styles.input, 'pl-9 h-9 text-xs')}
                    />
                  </div>
                  <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
                    <SelectTrigger className={cn(styles.input, 'h-9 text-xs flex gap-1.5 items-center')}>
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-70" />
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className={styles.dropdown}>
                      <SelectItem value="date_desc">Modified: Newest</SelectItem>
                      <SelectItem value="date_asc">Modified: Oldest</SelectItem>
                      <SelectItem value="name_asc">Name: A-Z</SelectItem>
                      <SelectItem value="name_desc">Name: Z-A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button className={styles.btn('outline')} disabled={!currentFlowId} onClick={() => setShareDlg(true)}>
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                  <Button className={styles.btn('primary')} onClick={() => setSaveDlg(true)} disabled={isSaving || isLoading}>
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                </div>

                {/* grid */}
                <div className="flex-grow overflow-y-auto p-1">
                  {list.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {list.map(f => (
                        <FlowCard
                          key={f.id}
                          flow={f}
                          current={currentFlowId === f.id && !f.isTemplate}
                          styles={styles}
                          load={loadItem}
                          del={deleteItem}
                          loading={isLoading}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className={cn('flex flex-col items-center justify-center h-full text-center p-10', styles.dark ? 'text-blue-400/70' : 'text-slate-500')}>
                      <Search className="h-12 w-12 mb-4 opacity-50" />
                      <p>No flows match your criteria</p>
                    </div>
                  )}
                </div>
              </main>
            </div>

            {/* footer */}
            <DrawerFooter className={cn('border-t-[3px] pt-4 flex justify-end', styles.dark ? 'border-blue-600' : 'border-slate-900')}>
              <DrawerClose asChild>
                <Button className={styles.btn('outline')}>Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/*-------------------------------- save dialog --------------------------------*/}
      <Dialog open={saveDlg} onOpenChange={setSaveDlg}>
        <DialogContent className={styles.dlg()}>
          <DialogHeader className="p-5 border-b-[2px]">
            <DialogTitle>Save Current Flow</DialogTitle>
            <DialogDescription>Assign a name and (optional) collection.</DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" className={styles.input} value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Collection</Label>
              {newColl ? (
                <div className="flex gap-2">
                  <Input className={styles.input} value={coll} onChange={e => setColl(e.target.value)} placeholder="New collection…" />
                  <Button size="sm" variant="ghost" onClick={() => setNewColl(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select value={coll || '__NONE__'} onValueChange={v => {
                  if (v === '__CREATE_NEW__') { setNewColl(true); setColl(''); }
                  else setColl(v === '__NONE__' ? '' : v);
                }}>
                  <SelectTrigger className={styles.input}>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className={styles.dropdown}>
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

            <div className="space-y-1.5">
              <Label htmlFor="customSlug">Custom Slug (Optional)</Label>
              <Input 
                id="customSlug" 
                className={styles.input} 
                value={customSlug} 
                onChange={(e) => setCustomSlug(generateSlug(e.target.value))} 
                placeholder="e.g., my-awesome-flow" 
              />
              {customSlug && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Preview: {typeof window !== 'undefined' ? window.location.origin : ''}/flow/{customSlug}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" className={styles.textarea} value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
          </div>

          <DialogFooter className="p-4 border-t-[2px] flex justify-end gap-2">
            <DialogClose asChild>
              <Button className={styles.btn('outline')}>Cancel</Button>
            </DialogClose>
            <Button className={styles.btn('primary')} onClick={handleSaveFlow} disabled={!name.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving…' : currentFlowId ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*-------------------------------- import dialog --------------------------------*/}
      <Dialog open={importDlg} onOpenChange={setImportDlg}>
        <DialogContent className={styles.dlg()}>
          <DialogHeader className="p-5 border-b-[2px]">
            <DialogTitle>Import Flow</DialogTitle>
            <DialogDescription>Select a previously exported .json file.</DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            <Input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={importFile}
              className={cn(styles.input, 'cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:rounded-l-md file:border-0 file:border-r-[2px] file:h-full')}
            />
          </div>

          <DialogFooter className="p-4 border-t-[2px] flex justify-end">
            <DialogClose asChild>
              <Button className={styles.btn('outline')}>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*-------------------------------- delete dialog --------------------------------*/}
      <Dialog open={!!deleteDlg} onOpenChange={() => setDeleteDlg(null)}>
        <DialogContent className={styles.dlg(true)}>
          <DialogHeader className="p-5 border-b-[2px]">
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Delete "<strong>{deleteDlg?.name}</strong>" permanently?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="p-4 border-t-[2px] flex justify-end gap-2">
            <DialogClose asChild>
              <Button className={styles.btn('outline')}>Cancel</Button>
            </DialogClose>
            <Button className={styles.btn('destructive')} onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*-------------------------------- share dialog --------------------------------*/}
      <ShareFlowDialog isOpen={shareDlg} onOpenChange={setShareDlg} />
    </>
  );
}
