'use client';

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';

// Re-define or import shared button styles function
const getCartoonButtonStyles = (isDark: boolean) => {
  const baseCartoonButtonStyle = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60",
    isDark ? "border-blue-500" : "border-neutral-800"
  );
  const outlineCartoonButtonStyle = cn(
    baseCartoonButtonStyle,
    isDark 
      ? "bg-neutral-800 hover:bg-neutral-700 text-blue-300 focus:ring-blue-500 focus:ring-offset-neutral-900" 
      : "bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-blue-500"
  );
  const iconButtonCartoonStyle = cn(
    "h-9 w-9 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center",
    isDark 
      ? "border-blue-500 text-blue-300 hover:bg-neutral-700 hover:text-blue-200 focus:ring-blue-500 focus:ring-offset-neutral-900" 
      : "border-neutral-800 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:ring-blue-500"
  );
  return { outlineCartoonButtonStyle, iconButtonCartoonStyle };
};

// Interface for a single JSONPath entry
export interface PathEntry {
  id: string;
  path: string;
  enabled: boolean;
}

// Props for the PathListEditor component
interface PathListEditorProps {
  title: string;
  entries: PathEntry[];
  onChange: (entries: PathEntry[]) => void;
  pathPlaceholder?: string;
}

export function PathListEditor({
  title,
  entries,
  onChange,
  pathPlaceholder = "JSONPath Expression (e.g., $.data[*].id)",
}: PathListEditorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { outlineCartoonButtonStyle, iconButtonCartoonStyle } = getCartoonButtonStyles(isDark);

  const [localEntries, setLocalEntries] = useState<PathEntry[]>([]);

  // Sync local state when props change from outside
  useEffect(() => {
    setLocalEntries(entries || []);
  }, [entries]);

  // Notify parent when local state changes
  const notifyChange = (updatedEntries: PathEntry[]) => {
    setLocalEntries(updatedEntries);
    onChange(updatedEntries);
  };

  // Toggle the enabled state of an entry
  const handleToggle = (id: string) => {
    const updated = localEntries.map(entry =>
      entry.id === id ? { ...entry, enabled: !entry.enabled } : entry
    );
    notifyChange(updated);
  };

  // Handle changes in the path input field
  const handlePathChange = (id: string, newPath: string) => {
    const updated = localEntries.map(entry =>
      entry.id === id ? { ...entry, path: newPath } : entry
    );
     // Only update if path actually changed
    if (JSON.stringify(updated) !== JSON.stringify(localEntries)) {
       notifyChange(updated);
    }
  };

  // Delete an entry
  const handleDeleteEntry = (id: string) => {
    const updated = localEntries.filter(entry => entry.id !== id);
    notifyChange(updated);
  };

  // Add a new empty entry
  const handleAddEntry = () => {
    const newEntry: PathEntry = {
      id: crypto.randomUUID(),
      path: '',
      enabled: true,
    };
    notifyChange([...localEntries, newEntry]);
  };

  return (
    <div className="space-y-2.5"> {/* Adjusted spacing */}
      {/* Apply dark mode to title if present */}
      {title && <h4 className={cn(
        "text-sm font-semibold mb-2",
        isDark ? "text-blue-200" : "text-neutral-700"
      )}>{title}</h4>}
      {localEntries.map((entry) => (
        <div key={entry.id} className="flex items-center gap-2.5"> {/* Adjusted gap */}
          {/* Checkbox: Cartoon Style with Dark Mode */}
          <Checkbox
            id={`enabled-${entry.id}`}
            checked={entry.enabled}
            onCheckedChange={() => handleToggle(entry.id)}
            className={cn(
              "nodrag h-5 w-5 rounded border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm",
              isDark 
                ? "border-blue-500 bg-neutral-800 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-700 data-[state=checked]:text-white focus:ring-blue-500 focus:ring-offset-neutral-900" 
                : "border-neutral-800 bg-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-700 data-[state=checked]:text-white focus:ring-blue-500"
            )}
          />
          {/* Input: Cartoon Style with Dark Mode */}
          <Input
            type="text"
            placeholder={pathPlaceholder}
            value={entry.path}
            onChange={(e) => handlePathChange(entry.id, e.target.value)}
            className={cn(
              "nodrag flex-grow rounded-lg focus:outline-none h-9 px-3 text-sm shadow-sm font-mono",
              isDark 
                ? "bg-neutral-800 border-2 border-blue-500 text-white focus:border-blue-400 placeholder:text-blue-200/50" 
                : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
            )}
          />
           {/* Delete Button: Cartoon Icon Style with Dark Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteEntry(entry.id)}
            className={cn(
              iconButtonCartoonStyle, 
              "flex-shrink-0 nodrag",
              isDark 
                ? "hover:bg-red-900/50 hover:text-red-300 hover:border-red-500 focus:ring-red-500" 
                : "hover:bg-red-100 hover:text-red-600 focus:ring-red-500"
            )}
            title="Delete path"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
       {/* Add Button: Cartoon Outline Style with Dark Mode */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddEntry}
        className={cn(outlineCartoonButtonStyle, "mt-3 nodrag w-full justify-center py-2")}
      >
        <Plus className="h-4 w-4 mr-1.5" />
        Add Path
      </Button>
    </div>
  );
} 