'use client';;
import React from 'react';
import { cn } from "@/lib/utils";
import { Workflow, Braces, ListFilter } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from 'next-themes';

interface NodeTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  onDragStart: (event: React.DragEvent) => void;
  isDark: boolean;
}

const NodeTooltip = ({ children, content, className, onDragStart, isDark }: NodeTooltipProps) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <div 
          className={className}
          onDragStart={onDragStart}
          draggable
        >
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent 
        className={cn(
          "max-w-xs rounded-xl p-3 text-xs shadow-lg z-50 font-medium border-2",
          isDark 
            ? "bg-neutral-800 border-blue-500 text-blue-100"
            : "bg-white text-neutral-700 border-neutral-800"
        )}
        side="right"
        sideOffset={5}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function Sidebar() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const draggableItemStyle = cn(
    "p-3 border-2 rounded-xl cursor-grab text-sm nodrag transition-all duration-200 flex items-center gap-2 font-medium shadow-sm",
    isDark 
      ? "border-blue-500 bg-neutral-800 text-blue-100 hover:bg-neutral-700 hover:shadow-md"
      : "border-neutral-800 bg-white text-neutral-800 hover:bg-neutral-100 hover:shadow-md"
  );

  return (
    <aside className={cn(
      "h-full flex flex-col p-0 shadow-sm",
      isDark 
        ? "dark-cartoon-sidebar"
        : "bg-gradient-to-b from-white to-neutral-50 border-r border-neutral-200"
    )}>
      <div className={cn(
        "flex-shrink-0 px-4 py-3 border-b-2",
        isDark ? "border-blue-500" : "border-neutral-200"
      )}>
        <h2 className={cn(
          "text-base font-semibold",
          isDark ? "text-white" : "text-neutral-800"
        )}>Nodes</h2>
      </div>
      <div className="flex-grow overflow-y-auto flex flex-col space-y-3 p-4">
        <NodeTooltip 
          className={draggableItemStyle}
          onDragStart={(event) => onDragStart(event, 'httpRequest')}
          isDark={isDark}
          content={
            <div>
              <p className={cn("font-semibold mb-1", isDark ? "text-white" : "text-neutral-900")}>HTTP Request</p>
              <p className={isDark ? "text-blue-100/80" : "text-neutral-600"}>Makes HTTP requests. Configure methods, headers, etc.</p>
              <p className={cn("mt-1 font-medium", isDark ? "text-blue-300" : "text-blue-600")}>Drag this node to the canvas.</p>
            </div>
          }
        >
          <Workflow className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-blue-300" : "text-blue-600")} />
          <span>HTTP Request</span>
        </NodeTooltip>

        <NodeTooltip 
          className={draggableItemStyle}
          onDragStart={(event) => onDragStart(event, 'jsonNode')}
          isDark={isDark}
          content={
            <div>
              <p className={cn("font-semibold mb-1", isDark ? "text-white" : "text-neutral-900")}>JSON Output</p>
              <p className={isDark ? "text-blue-100/80" : "text-neutral-600"}>Displays JSON data. Useful for inspecting outputs.</p>
              <p className={cn("mt-1 font-medium", isDark ? "text-lime-300" : "text-lime-600")}>Drag to visualize data.</p>
            </div>
          }
        >
          <Braces className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-lime-300" : "text-lime-600")} />
          <span>JSON Output</span>
        </NodeTooltip>

        <NodeTooltip 
          className={draggableItemStyle}
          onDragStart={(event) => onDragStart(event, 'selectFields')}
          isDark={isDark}
          content={
            <div>
              <p className={cn("font-semibold mb-1", isDark ? "text-white" : "text-neutral-900")}>Select Fields</p>
              <p className={isDark ? "text-blue-100/80" : "text-neutral-600"}>Extract specific fields from JSON using JSONPath.</p>
              <p className={cn("mt-1 font-medium", isDark ? "text-amber-300" : "text-amber-600")}>Drag to filter data.</p>
            </div>
          }
        >
          <ListFilter className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-amber-300" : "text-amber-600")} />
          <span>Select Fields</span>
        </NodeTooltip>
      </div>
    </aside>
  );
} 