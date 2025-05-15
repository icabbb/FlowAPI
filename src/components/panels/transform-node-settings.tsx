'use client';

import { useState, useEffect, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus, ArrowRight } from 'lucide-react';

// Re-define or import interfaces from transform-node.tsx
// Export the interface
export interface MappingRule {
  id: string;
  inputPath: string;
  outputPath: string;
  enabled: boolean;
}

// Export the interface
export interface TransformNodeData {
  label?: string;
  mappingRules?: MappingRule[];
  [key: string]: any;
}

const defaultNodeData: TransformNodeData = {
  label: 'Transform Data',
  mappingRules: [],
};

interface TransformNodeSettingsProps {
  node: Node<TransformNodeData>;
}

// Helper to get button styles based on theme
const getCartoonButtonStyles = (isDark: boolean) => {
  const base = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60",
    isDark ? "border-purple-500 focus:ring-offset-neutral-900" : "border-neutral-800"
  );
  const outline = cn(
    base,
    isDark 
      ? "bg-neutral-800 hover:bg-neutral-700 text-purple-300 focus:ring-purple-500" 
      : "bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-purple-500"
  );
  const icon = cn(
    "h-9 w-9 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center",
    isDark 
      ? "border-purple-500 text-purple-300 hover:bg-neutral-700 focus:ring-purple-500 focus:ring-offset-neutral-900" 
      : "border-neutral-800 text-neutral-600 hover:bg-neutral-100 focus:ring-purple-500"
  );
  return { outline, icon };
};

export function TransformNodeSettings({ node }: TransformNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeId = node.id;
  const { outline: outlineButtonStyle, icon: iconButtonStyle } = getCartoonButtonStyles(isDark);

  // State for form fields
  const [label, setLabel] = useState(node.data?.label ?? defaultNodeData.label);
  const [mappingRules, setMappingRules] = useState<MappingRule[]>(node.data?.mappingRules ?? defaultNodeData.mappingRules ?? []);

  // Sync state when the selected node changes
  useEffect(() => {
    setLabel(node.data?.label ?? defaultNodeData.label);
    setMappingRules(node.data?.mappingRules ?? defaultNodeData.mappingRules ?? []);
  }, [node.id, node.data?.label, node.data?.mappingRules]);

  // --- Callbacks for updating store on blur/change --- 
  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (node.data?.label !== label) {
      updateNodeData(nodeId, { label: label });
    }
  }, [nodeId, label, node.data?.label, updateNodeData]);

  // Notify parent about rule changes
  const notifyRuleChange = (updatedRules: MappingRule[]) => {
    setMappingRules(updatedRules);
    updateNodeData(nodeId, { mappingRules: updatedRules });
  };

  // --- Rule Manipulation Callbacks ---
  const handleRuleChange = (id: string, field: 'inputPath' | 'outputPath', value: string) => {
    const updated = mappingRules.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    );
    notifyRuleChange(updated);
  };

  const handleToggleRule = (id: string) => {
    const updated = mappingRules.map(rule => 
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
    );
    notifyRuleChange(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = mappingRules.filter(rule => rule.id !== id);
    notifyRuleChange(updated);
  };

  const handleAddRule = () => {
    const newRule: MappingRule = {
      id: crypto.randomUUID(),
      inputPath: '',
      outputPath: '',
      enabled: true,
    };
    notifyRuleChange([...mappingRules, newRule]);
  };

  // --- Render Logic --- 
  return (
    <div className="space-y-5 font-sans">
      {/* Label Setting */}
      <div>
        <Label 
          htmlFor="label" 
          className={cn(
            "text-sm font-semibold mb-1.5 block",
            isDark ? "text-purple-200" : "text-neutral-700"
          )}
        >
          Label
        </Label>
        <Input
          id="label"
          name="label"
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onMouseDown={(e) => e.stopPropagation()} 
          className={cn(
            "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm border-2",
            "allow-text-selection",
            isDark 
              ? "bg-neutral-800 border-purple-500/70 text-white focus:border-purple-400"
              : "bg-white border-neutral-800 text-neutral-800 focus:border-purple-500"
          )}
        />
      </div>

      {/* Mapping Rules Section */}
      <div className={cn(
        "space-y-3 p-4 rounded-lg shadow-sm border-2",
        isDark 
          ? "bg-neutral-800 border-blue-500"
          : "bg-white border-neutral-800"
      )}>
        <h3 className={cn(
          "text-sm font-semibold",
          isDark ? "text-blue-200" : "text-neutral-800"
        )}>
          Mapping Rules
        </h3>
        <p className={cn(
          "text-xs",
          isDark ? "text-blue-100/70" : "text-neutral-600"
        )}>
          Define how to map input data fields to the output structure.
        </p>
        
        {/* List of Rules */}
        <div className="space-y-3">
          {mappingRules.map((rule) => (
            <div 
              key={rule.id} 
              className={cn(
                "flex items-center gap-2.5 p-2 rounded border",
                isDark 
                  ? "border-blue-500/30"
                  : "border-neutral-200"
              )}
            >
              <Checkbox
                id={`enabled-${rule.id}`}
                checked={rule.enabled}
                onCheckedChange={() => handleToggleRule(rule.id)}
                className={cn(
                  "nodrag h-5 w-5 rounded border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm",
                  isDark 
                    ? "border-blue-500 bg-neutral-800 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-700 data-[state=checked]:text-white focus:ring-blue-500 focus:ring-offset-neutral-900" 
                    : "border-neutral-800 bg-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-700 data-[state=checked]:text-white focus:ring-blue-500"
                )}
              />
              <div className="flex-grow grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="Input Path (e.g., $.user.id)"
                  value={rule.inputPath}
                  onChange={(e) => handleRuleChange(rule.id, 'inputPath', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    "h-9 px-3 text-xs font-mono rounded-md shadow-sm border-2 allow-text-selection",
                    isDark 
                      ? "bg-neutral-700 border-blue-500/50 text-white focus:border-blue-400 placeholder:text-blue-200/50"
                      : "bg-white border-neutral-300 text-neutral-800 focus:border-blue-500"
                  )}
                />
                <ArrowRight className={cn("h-4 w-4 flex-shrink-0", isDark ? "text-blue-400" : "text-neutral-500")} />
                <Input
                  type="text"
                  placeholder="Output Path (e.g., userId)"
                  value={rule.outputPath}
                  onChange={(e) => handleRuleChange(rule.id, 'outputPath', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={cn(
                    "h-9 px-3 text-xs font-mono rounded-md shadow-sm border-2 allow-text-selection",
                    isDark 
                      ? "bg-neutral-700 border-blue-500/50 text-white focus:border-blue-400 placeholder:text-blue-200/50"
                      : "bg-white border-neutral-300 text-neutral-800 focus:border-blue-500"
                  )}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRule(rule.id)}
                className={cn(
                  iconButtonStyle, 
                  "flex-shrink-0 nodrag h-8 w-8", // Make slightly smaller
                  isDark 
                    ? "hover:bg-red-900/50 hover:text-red-300 hover:border-red-500 focus:ring-red-500" 
                    : "hover:bg-red-100 hover:text-red-600 focus:ring-red-500"
                )}
                title="Delete rule"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Rule Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          className={cn(outlineButtonStyle, "mt-3 nodrag w-full justify-center py-2")}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Mapping Rule
        </Button>
      </div>
    </div>
  );
} 