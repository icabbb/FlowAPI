'use client';;
import React, { useState, useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Workflow, Braces, ListFilter, Search as SearchIconLucide, FileOutput } from 'lucide-react'; // Renombrado SearchIcon
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from 'next-themes';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Types ---
interface NodeInfo {
    type: string;
    label: string;
    icon: React.ElementType;
    description: string;
    category: 'Input/Output' | 'Data Manipulation' | 'Logic & Flow' | 'Other';
    colorClass: { dark: string; light: string };
}

// --- Node Definitions ---
const availableNodes: NodeInfo[] = [
    { type: 'httpRequest', label: 'HTTP Request', icon: Workflow, description: 'Makes HTTP requests. Configure methods, headers, etc.', category: 'Input/Output', colorClass: { dark: 'text-blue-300', light: 'text-blue-600' } },
    { type: 'jsonNode', label: 'JSON Output', icon: Braces, description: 'Displays JSON data. Useful for inspecting outputs.', category: 'Input/Output', colorClass: { dark: 'text-lime-300', light: 'text-lime-600' } },
    { type: 'selectFields', label: 'Select Fields', icon: ListFilter, description: 'Extract specific fields from JSON using JSONPath.', category: 'Data Manipulation', colorClass: { dark: 'text-amber-300', light: 'text-amber-600' } },
    // ... (resto de tus nodos)
    { type: 'exportNode', label: 'Export Data', icon: FileOutput, description: 'Exports data to various formats like CSV, JSON, TXT, etc.', category: 'Input/Output', colorClass: { dark: 'text-cyan-300', light: 'text-cyan-600' } },
];

// --- Style Hook for Sidebar ---
const useNodeSidebarStyles = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Modificado: Sin ancho fijo, sin border-r, sin sombra principal.
    // Tomará el 100% del contenedor padre (DesktopSidebar o MobileSidebar).
    const sidebarContainerClass = cn(
        "h-full w-full flex flex-col", // p-0 eliminado, el padding lo maneja el padre o los elementos internos.
        // El fondo puede ser transparente si el padre ya lo tiene, o específico aquí.
        isDark
            ? "bg-transparent" // o bg-neutral-900 si quieres un fondo distinto al padre
            : "bg-transparent" // o bg-gradient-to-b from-white to-neutral-50
    );

    const headerClass = cn(
        "flex-shrink-0 px-1 py-3 border-b-2", // Reducido px para espacios más ajustados
        isDark ? "border-blue-500/50" : "border-neutral-700/80"
    );

    const headerTitleClass = cn(
        "text-base font-semibold",
        isDark ? "text-blue-100" : "text-neutral-800"
    );

    const searchInputContainerClass = cn(
      "flex-shrink-0 px-1 pt-3 pb-2" // Reducido px
    );

    const searchInputClass = cn(
        "h-9 text-xs rounded-lg border-2 shadow-inner w-full",
        isDark
            ? "bg-neutral-800 border-blue-500/50 text-blue-200 placeholder:text-blue-400/60 focus:ring-blue-400 focus:border-blue-400"
            : "bg-white border-neutral-800 text-neutral-800 placeholder:text-neutral-400 focus:ring-blue-500 focus:border-blue-500"
    );

    const listScrollAreaClass = cn(
        "flex-grow"
    );
    const listContentClass = cn(
        "flex flex-col space-y-1 p-1" // Reducido p
    );

    const categoryHeaderClass = cn(
        "text-xs font-bold uppercase tracking-wider px-2 pt-3 pb-1 sticky top-0 backdrop-blur-sm z-10",
        isDark ? "text-blue-300/80 bg-neutral-900/80" : "text-neutral-500 bg-neutral-50/80" // Asegúrate que el bg sea compatible con el padre
    );

    const draggableItemClass = (isDragging = false) => cn(
        "p-2.5 border rounded-lg cursor-grab text-sm nodrag transition-all duration-150 flex items-center gap-2 font-medium shadow-sm outline-none", // Ajustado padding y border
        "focus-visible:ring-2 focus-visible:ring-offset-2",
        isDark
            ? "border-blue-500/40 bg-neutral-800/80 text-blue-100 hover:bg-neutral-700/90 hover:shadow-md hover:scale-[1.02] focus-visible:ring-blue-500 focus-visible:ring-offset-neutral-900"
            : "border-neutral-700/60 bg-white/80 text-neutral-800 hover:bg-neutral-100/90 hover:shadow-md hover:scale-[1.02] focus-visible:ring-blue-500 focus-visible:ring-offset-white",
        isDragging && "opacity-50 scale-[0.98] cursor-grabbing shadow-lg"
    );

    const nodeIconClass = cn(
        "h-4 w-4 flex-shrink-0" // Ligeramente más pequeño
    );

    const tooltipContentClass = cn(
        "max-w-xs rounded-lg p-2.5 text-xs shadow-lg z-50 font-medium border",
        isDark
            ? "bg-neutral-800 border-blue-500/70 text-blue-100"
            : "bg-white text-neutral-700 border-neutral-700/80"
    );

    return {
        isDark,
        sidebarContainerClass,
        headerClass,
        headerTitleClass,
        searchInputContainerClass,
        searchInputClass,
        listScrollAreaClass,
        listContentClass,
        categoryHeaderClass,
        draggableItemClass,
        nodeIconClass,
        tooltipContentClass,
    };
};

interface NodeTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: (event: React.DragEvent) => void;
  isDragging: boolean;
  styles: ReturnType<typeof useNodeSidebarStyles>;
}

const NodeTooltip = ({ children, content, className, onDragStart, onDragEnd, isDragging, styles }: NodeTooltipProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(className, styles.draggableItemClass(isDragging))}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          draggable
          aria-grabbed={isDragging ? 'true' : 'false'}
          aria-label={`Draggable node: ${
            React.isValidElement<{ title?: string }>(content) && typeof content.props.title === 'string'
              ? content.props.title || 'Node'
              : 'Node'
          }`}
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent
        className={styles.tooltipContentClass}
        side="right"
        align="start"
        sideOffset={6}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// Exporta este componente para usarlo en tu layout
export function NodeListSidebar() {
  const styles = useNodeSidebarStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [draggingNodeType, setDraggingNodeType] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return availableNodes;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return availableNodes.filter(node =>
      node.label.toLowerCase().includes(lowerSearchTerm) ||
      node.description.toLowerCase().includes(lowerSearchTerm) ||
      node.category.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm]);

  const groupedNodes = useMemo(() => {
      return filteredNodes.reduce((acc, node) => {
          const category = node.category;
          if (!acc[category]) {
              acc[category] = [];
          }
          acc[category].push(node);
          return acc;
      }, {} as Record<NodeInfo['category'], NodeInfo[]>);
  }, [filteredNodes]);

  const categoryOrder: NodeInfo['category'][] = ['Input/Output', 'Data Manipulation', 'Logic & Flow', 'Other'];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingNodeType(nodeType);
    document.body.classList.add('dragging-node');
  };

  const onDragEnd = () => {
      setDraggingNodeType(null);
      document.body.classList.remove('dragging-node');
  };

  if (!isMounted) {
    return null; // Evita mismatch de hidratación con useTheme
  }

  return (
    // <aside> o <div> está bien. Se ajustará al espacio del padre.
    <div className={styles.sidebarContainerClass}>
      {/* Header */}
      <div className={styles.headerClass}>
        <h2 className={styles.headerTitleClass}>Nodes</h2>
      </div>

      {/* Search Input */}
      <div className={styles.searchInputContainerClass}>
          <div className="relative">
              <SearchIconLucide className={cn( // Usar el alias
                  "absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
                  styles.isDark ? "text-blue-400/70" : "text-neutral-400"
              )} />
              <Input
                  type="search"
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(styles.searchInputClass, "pl-7")} // Ajustado pl
                  aria-label="Search nodes"
              />
          </div>
      </div>

      {/* Node List */}
      <ScrollArea className={styles.listScrollAreaClass}>
        <div className={styles.listContentClass}>
          {categoryOrder.map(category => (
            groupedNodes[category] && groupedNodes[category].length > 0 && (
              <React.Fragment key={category}>
                <h3 className={styles.categoryHeaderClass}>{category}</h3>
                {groupedNodes[category].map((node) => {
                  const NodeIcon = node.icon;
                  const isDragging = draggingNodeType === node.type;
                  const colorClass = styles.isDark ? node.colorClass.dark : node.colorClass.light;

                  return (
                    <NodeTooltip
                      key={node.type}
                      onDragStart={(event) => onDragStart(event, node.type)}
                      onDragEnd={onDragEnd}
                      isDragging={isDragging}
                      styles={styles}
                      content={
                        <div title={node.label}>
                          <p className={cn("font-semibold mb-0.5", styles.isDark ? "text-white" : "text-neutral-900")}>{node.label}</p>
                          <p className={cn("text-xs", styles.isDark ? "text-blue-100/80" : "text-neutral-600")}>{node.description}</p>
                          <p className={cn("mt-1 text-xs font-medium", colorClass)}>Drag this node to the canvas.</p>
                        </div>
                      }
                    >
                      <NodeIcon className={cn(styles.nodeIconClass, colorClass)} aria-hidden="true" />
                      <span className="text-xs">{node.label}</span> {/* Texto más pequeño */}
                    </NodeTooltip>
                  );
                })}
              </React.Fragment>
            )
          ))}
          {filteredNodes.length === 0 && searchTerm && (
            <div className="p-4 text-center text-sm">
              <p className={styles.isDark ? "text-blue-300/70" : "text-neutral-500"}>No nodes found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default NodeListSidebar; // Exportación por defecto