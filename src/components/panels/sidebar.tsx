'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Workflow,
  Braces,
  ListFilter,
  Timer,
  DatabaseZap,
  Shuffle,
  GitBranch,
  Search as SearchIcon,
  FileOutput,
} from 'lucide-react';
import { IoInfiniteOutline } from 'react-icons/io5';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

/* -------------------------------------------------------------------------- */
/*                                   types                                    */
/* -------------------------------------------------------------------------- */
interface NodeInfo {
  type: string;
  label: string;
  icon: React.ElementType;
  description: string;
  category: 'Input/Output' | 'Data Manipulation' | 'Logic & Flow' | 'Other';
  colorClass: { dark: string; light: string };
}

/* -------------------------------------------------------------------------- */
/*                             node definitions                               */
/* -------------------------------------------------------------------------- */
const availableNodes: NodeInfo[] = [
  {
    type: 'httpRequest',
    label: 'HTTP Request',
    icon: Workflow,
    description: 'Makes HTTP requests. Configure methods, headers, etc.',
    category: 'Input/Output',
    colorClass: { dark: 'text-blue-300', light: 'text-blue-600' },
  },
  {
    type: 'jsonNode',
    label: 'JSON Output',
    icon: Braces,
    description: 'Displays JSON data. Useful for inspecting outputs.',
    category: 'Input/Output',
    colorClass: { dark: 'text-lime-300', light: 'text-lime-600' },
  },
  {
    type: 'exportNode',
    label: 'Export Data',
    icon: FileOutput,
    description: 'Exports data to various formats like CSV, JSON, TXT, etc.',
    category: 'Input/Output',
    colorClass: { dark: 'text-cyan-300', light: 'text-cyan-600' },
  },
  {
    type: 'selectFields',
    label: 'Select Fields',
    icon: ListFilter,
    description: 'Extract specific fields from JSON using JSONPath.',
    category: 'Data Manipulation',
    colorClass: { dark: 'text-amber-300', light: 'text-amber-600' },
  },
  {
    type: 'variableSetNode',
    label: 'Set Variable',
    icon: DatabaseZap,
    description: "Saves or updates a variable in the flow's context.",
    category: 'Data Manipulation',
    colorClass: { dark: 'text-indigo-300', light: 'text-indigo-600' },
  },
  {
    type: 'transformNode',
    label: 'Transform Data',
    icon: Shuffle,
    description: 'Map, filter, or restructure JSON data using defined rules.',
    category: 'Data Manipulation',
    colorClass: { dark: 'text-purple-300', light: 'text-purple-600' },
  },
  {
    type: 'conditionalNode',
    label: 'If Condition',
    icon: GitBranch,
    description: 'Branches the flow based on evaluating conditions.',
    category: 'Logic & Flow',
    colorClass: { dark: 'text-teal-300', light: 'text-teal-600' },
  },
  {
    type: 'delayNode',
    label: 'Delay',
    icon: Timer,
    description: 'Pauses the flow execution for a specified time.',
    category: 'Logic & Flow',
    colorClass: { dark: 'text-yellow-300', light: 'text-yellow-600' },
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: IoInfiniteOutline,
    description: 'Iterates over items in an array from the input data.',
    category: 'Logic & Flow',
    colorClass: { dark: 'text-orange-300', light: 'text-orange-600' },
  },
];

/* -------------------------------------------------------------------------- */
/*                                style hook                                  */
/* -------------------------------------------------------------------------- */
const useNodeSidebarStyles = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  /* -- contenedor & cabecera -- */
  const sidebarContainerClass = cn(
    'h-full flex flex-col p-0 shadow-md border-r-2',
    isDark
      ? 'bg-[#0f172acc] border-blue-500/30'
      : 'bg-gradient-to-b from-white to-neutral-50 border-neutral-800'
  );
  const headerClass = cn(
    'flex-shrink-0 px-4 py-3 border-b-2',
    isDark ? 'border-blue-500/40' : 'border-neutral-800'
  );
  const headerTitleClass = cn(
    'text-base font-semibold',
    isDark ? 'text-blue-100' : 'text-neutral-800'
  );

  /* -- búsqueda -- */
  const searchInputClass = cn(
    'h-9 text-xs rounded-xl border-2 shadow-inner w-full',
    isDark
      ? 'bg-neutral-800 border-blue-500/50 text-blue-200 placeholder:text-blue-400/60 focus:ring-blue-400 focus:border-blue-400'
      : 'bg-white border-neutral-800 text-neutral-800 placeholder:text-neutral-400 focus:ring-blue-500 focus:border-blue-500'
  );

  /* -- scroll & listado -- */
  const listScrollAreaClass = 'flex-grow';
  const listContentClass = 'flex flex-col space-y-1 p-3';

  /* -- categoría -- */
  const categoryHeaderClass = cn(
    'text-xs font-bold uppercase tracking-wider px-2 pt-3 pb-1 sticky top-0 backdrop-blur-sm z-10',
    isDark ? 'text-blue-300/80' : 'text-neutral-500'
  );

  /* -- item estilo “cartoon button” -- */
  const draggableItemClass = (drag = false) =>
    cn(
      'nodrag select-none w-full gap-2.5 rounded-xl border-2 px-3 py-2 text-sm font-semibold shadow-sm transition-all duration-150 transform flex items-center',
      'focus-visible:ring-2 focus-visible:ring-offset-2',
      isDark
        ? 'border-blue-500/60 bg-[#0f172acc] text-blue-100 hover:bg-neutral-700 focus-visible:ring-blue-500 focus-visible:ring-offset-neutral-900'
        : 'border-neutral-800 bg-white text-neutral-800 hover:bg-neutral-100 focus-visible:ring-blue-500 focus-visible:ring-offset-white',
      'hover:scale-[1.03] active:scale-100',
      drag && 'opacity-50 scale-[0.98] cursor-grabbing shadow-lg'
    );

  const nodeIconClass = 'h-5 w-5 flex-shrink-0';

  const tooltipContentClass = cn(
    'max-w-xs rounded-xl p-3 text-xs shadow-lg border-2 font-medium z-50',
    isDark
      ? 'bg-[#0f172acc] border-blue-500 text-blue-100'
      : 'bg-white border-neutral-800 text-neutral-700'
  );

  return {
    isDark,
    sidebarContainerClass,
    headerClass,
    headerTitleClass,
    searchInputClass,
    listScrollAreaClass,
    listContentClass,
    categoryHeaderClass,
    draggableItemClass,
    nodeIconClass,
    tooltipContentClass,
  };
};

/* -------------------------------------------------------------------------- */
/*                             tooltip wrapper                                */
/* -------------------------------------------------------------------------- */
interface NodeTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging: boolean;
  styles: ReturnType<typeof useNodeSidebarStyles>;
}
const NodeTooltip = ({
  children,
  content,
  className,
  onDragStart,
  onDragEnd,
  isDragging,
  styles,
}: NodeTooltipProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(className, styles.draggableItemClass(isDragging))}
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          aria-grabbed={isDragging}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent
        className={styles.tooltipContentClass}
        side="right"
        sideOffset={8}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

/* -------------------------------------------------------------------------- */
/*                              main sidebar                                  */
/* -------------------------------------------------------------------------- */
export function Sidebar() {
  const styles = useNodeSidebarStyles();

  const [searchTerm, setSearchTerm] = useState('');
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* -- filtrado & agrupado -- */
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return availableNodes;
    const t = searchTerm.toLowerCase();
    return availableNodes.filter(
      (n) =>
        n.label.toLowerCase().includes(t) ||
        n.description.toLowerCase().includes(t) ||
        n.category.toLowerCase().includes(t)
    );
  }, [searchTerm]);

  const grouped = useMemo(() => {
    return filteredNodes.reduce<Record<NodeInfo['category'], NodeInfo[]>>(
      (acc, n) => {
        acc[n.category] = [...(acc[n.category] || []), n];
        return acc;
      },
      {} as any
    );
  }, [filteredNodes]);

  const order: NodeInfo['category'][] = [
    'Input/Output',
    'Data Manipulation',
    'Logic & Flow',
    'Other',
  ];

  /* -- drag handlers -- */
  const onDragStart = (e: React.DragEvent, type: string) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingType(type);
    document.body.classList.add('dragging-node');
  };
  const onDragEnd = () => {
    setDraggingType(null);
    document.body.classList.remove('dragging-node');
  };

  if (!mounted) return null;

  return (
    <aside className={styles.sidebarContainerClass}>
      {/* header */}
      <div className={styles.headerClass}>
        <h2 className={styles.headerTitleClass}>Nodes</h2>
      </div>

      {/* búsqueda */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <SearchIcon
            className={cn(
              'absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5',
              styles.isDark ? 'text-blue-400/70' : 'text-neutral-400'
            )}
          />
          <Input
            type="search"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(styles.searchInputClass, 'pl-8')}
            aria-label="Search nodes"
          />
        </div>
      </div>

      {/* listado con ScrollArea */}
      <ScrollArea className={styles.listScrollAreaClass}>
        <div className={styles.listContentClass}>
          {order.map(
            (cat) =>
              grouped[cat] &&
              grouped[cat].length > 0 && (
                <React.Fragment key={cat}>
                  <h3 className={styles.categoryHeaderClass}>{cat}</h3>
                  {grouped[cat].map((node) => {
                    const Icon = node.icon;
                    const dragging = draggingType === node.type;
                    const color = styles.isDark
                      ? node.colorClass.dark
                      : node.colorClass.light;

                    return (
                      <NodeTooltip
                        key={node.type}
                        onDragStart={(e) => onDragStart(e, node.type)}
                        onDragEnd={onDragEnd}
                        isDragging={dragging}
                        styles={styles}
                        content={
                          <div>
                            <p
                              className={cn(
                                'font-semibold mb-1',
                                styles.isDark
                                  ? 'text-white'
                                  : 'text-neutral-900'
                              )}
                            >
                              {node.label}
                            </p>
                            <p
                              className={
                                styles.isDark
                                  ? 'text-blue-100/80'
                                  : 'text-neutral-600'
                              }
                            >
                              {node.description}
                            </p>
                            <p
                              className={cn(
                                'mt-1.5 font-medium text-xs',
                                color
                              )}
                            >
                              Drag this node to the canvas
                            </p>
                          </div>
                        }
                      >
                        <Icon
                          className={cn(styles.nodeIconClass, color)}
                          aria-hidden="true"
                        />
                        <span>{node.label}</span>
                      </NodeTooltip>
                    );
                  })}
                </React.Fragment>
              )
          )}

          {/* vacío */}
          {filteredNodes.length === 0 && searchTerm && (
            <div className="p-4 text-center text-sm">
              <p
                className={
                  styles.isDark ? 'text-blue-300/70' : 'text-neutral-500'
                }
              >
                No nodes found matching “{searchTerm}”
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

export default Sidebar;
