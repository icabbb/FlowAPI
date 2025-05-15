'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index'; // Assuming this path is correct
import { cn } from '@/lib/utils'; // Assuming this path is correct
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button'; // Assuming this path is correct
import { Input } from '@/components/ui/input'; // Assuming this path is correct
import { Label } from '@/components/ui/label'; // Assuming this path is correct
import { Checkbox } from '@/components/ui/checkbox'; // Assuming this path is correct
import { Trash2, Plus, GitBranch } from 'lucide-react';

export interface ConditionRule {
  id: string;
  expression: string;
  outputHandleId: string;
  enabled: boolean;
}

export interface ConditionalNodeData {
  label?: string;
  conditions?: ConditionRule[];
  defaultOutputHandleId?: string;
  [key: string]: any;
}

const defaultConditionalData: ConditionalNodeData = {
  label: 'If Condition',
  conditions: [
    { id: crypto.randomUUID(), expression: 'true', outputHandleId: 'true', enabled: true }
  ],
  defaultOutputHandleId: 'default',
};

interface ConditionalNodeSettingsProps {
  node: Node<ConditionalNodeData>;
}

export function ConditionalNodeSettings({ node }: ConditionalNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [label, setLabel] = useState(node.data?.label ?? defaultConditionalData.label);
  const [conditions, setConditions] = useState<ConditionRule[]>(node.data?.conditions ?? defaultConditionalData.conditions!);
  const [defaultHandleId, setDefaultHandleId] = useState(node.data?.defaultOutputHandleId ?? defaultConditionalData.defaultOutputHandleId);

  useEffect(() => {
    setLabel(node.data?.label ?? defaultConditionalData.label);
    setConditions(node.data?.conditions ?? defaultConditionalData.conditions!);
    setDefaultHandleId(node.data?.defaultOutputHandleId ?? defaultConditionalData.defaultOutputHandleId);
  }, [node.id, node.data]);

  const update = (data: Partial<ConditionalNodeData>) => updateNodeData(node.id, data);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value);
  const handleLabelBlur = () => update({ label });

  const handleDefaultHandleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => setDefaultHandleId(e.target.value);
  const handleDefaultHandleIdBlur = () => update({ defaultOutputHandleId: defaultHandleId });

  const updateConditions = (newConditions: ConditionRule[]) => {
    setConditions(newConditions);
    update({ conditions: newConditions });
  };

  const handleConditionChange = (id: string, field: keyof Omit<ConditionRule, 'id' | 'enabled'>, value: string) => {
    updateConditions(conditions.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const toggleCondition = (id: string) => {
    updateConditions(conditions.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const deleteCondition = (id: string) => {
    updateConditions(conditions.filter(c => c.id !== id));
  };

  const addCondition = () => {
    updateConditions([...conditions, { id: crypto.randomUUID(), expression: '', outputHandleId: '', enabled: true }]);
  };

  const commonInputClasses = "h-10 border-2";
  const darkThemeInputClasses = "bg-neutral-800 border-pink-500 text-white placeholder:text-neutral-400";
  const lightThemeInputClasses = "bg-white border-neutral-800 text-neutral-800 placeholder:text-neutral-500";

  const commonConditionInputClasses = "text-xs font-mono border-2";
  const darkThemeConditionInputClasses = "bg-neutral-700 text-white border-pink-500 placeholder:text-neutral-400";
  const lightThemeConditionInputClasses = "bg-white text-neutral-800 border-neutral-300 placeholder:text-neutral-500";


  return (
    <div className="space-y-6 font-sans p-1"> {/* Increased main spacing, added slight padding for scrollbar room */}
      <div>
        <Label 
          htmlFor="node-label" 
          className={cn(
            "text-sm font-semibold", 
            isDark ? 'text-pink-200' : 'text-neutral-700 border-2 border-pink-500' // This light mode style with pink border is specific and kept
          )}
        >
          Node Label
        </Label>
        <Input
          id="node-label"
          type="text"
          placeholder="e.g., User Status Check"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          className={cn(commonInputClasses, isDark ? darkThemeInputClasses : lightThemeInputClasses)}
        />
      </div>

      <div className={cn(
        "space-y-4 p-4 rounded-lg border-2 shadow-sm", 
        isDark ? 'bg-neutral-800/70 border-pink-500' : 'bg-white border-neutral-800'
      )}>
        <h3 className={cn(
          "text-base font-semibold flex items-center gap-2", // Slightly larger text
          isDark ? 'text-pink-200' : 'text-neutral-800'
        )}>
          <GitBranch className="h-4 w-4" aria-hidden="true" />
          Conditions (Evaluated Top-Down)
        </h3>

        <div className="space-y-3"> {/* Container for condition items */}
          {conditions.map((c, i) => (
            <div 
              key={c.id} 
              className={cn(
                "p-3 rounded-md border relative flex gap-3 items-start",
                isDark 
                  ? 'bg-neutral-700/50 border-neutral-600' 
                  : 'bg-neutral-50 border-neutral-200'
              )}
            >
              <span 
                className={cn(
                  "absolute -top-2.5 -left-2.5 z-10 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center border", 
                  isDark 
                    ? 'bg-pink-600 text-pink-100 border-pink-400' 
                    : 'bg-pink-100 text-pink-700 border-pink-400'
                )}
              >
                {i + 1}
              </span>
              <Checkbox 
                id={`condition-enabled-${c.id}`} 
                checked={c.enabled} 
                onCheckedChange={() => toggleCondition(c.id)}
                aria-label={`Enable condition ${i + 1}`}
                className="mt-1 flex-shrink-0"
              />
              <div className="flex-grow grid gap-2.5">
                <div>
                  <Label htmlFor={`condition-expression-${c.id}`} className="sr-only">Expression for condition {i + 1}</Label>
                  <Input
                    id={`condition-expression-${c.id}`}
                    placeholder="Expression (e.g., data.temperature > 30)"  
                    value={c.expression}
                    onChange={(e) => handleConditionChange(c.id, 'expression', e.target.value)}
                    className={cn(commonConditionInputClasses, isDark ? darkThemeConditionInputClasses : lightThemeConditionInputClasses, "h-9")} // slightly smaller height for nested input
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Label 
                    htmlFor={`condition-handle-${c.id}`} 
                    className={cn("text-xs flex-shrink-0", isDark ? 'text-neutral-300' : 'text-neutral-600')}
                  >
                    then use handle:
                  </Label>
                  <Input
                    id={`condition-handle-${c.id}`}
                    placeholder="Handle ID"
                    value={c.outputHandleId}
                    onChange={(e) => handleConditionChange(c.id, 'outputHandleId', e.target.value)}
                    className={cn(commonConditionInputClasses, isDark ? darkThemeConditionInputClasses : lightThemeConditionInputClasses, "flex-1 h-9")} // slightly smaller height
                  />
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => deleteCondition(c.id)}
                className={cn(
                  "flex-shrink-0 self-center rounded-full", // Rounded for softer look
                  isDark ? "text-neutral-400 hover:text-red-400 hover:bg-red-900/30" : "text-neutral-500 hover:text-red-500 hover:bg-red-100/50"
                )}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Delete condition {i + 1}</span>
              </Button>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          onClick={addCondition} 
          className={cn(
            "w-full mt-4 py-2 flex items-center justify-center gap-2", // Adjusted padding
            isDark 
              ? "border-pink-500 text-pink-200 hover:bg-pink-500/10 active:bg-pink-500/20" 
              : "border-neutral-400 text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200"
          )}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add Condition
        </Button>
      </div>

      <div>
        <Label 
          htmlFor="default-handle-id" 
          className={cn("text-sm font-semibold", isDark ? 'text-pink-200' : 'text-neutral-700')}
        >
          Default Output Handle ID
        </Label>
        <Input
          id="default-handle-id"
          placeholder="e.g., fallbackOutput"
          value={defaultHandleId}
          onChange={handleDefaultHandleIdChange}
          onBlur={handleDefaultHandleIdBlur}
          className={cn(commonInputClasses, "font-mono", isDark ? darkThemeInputClasses : lightThemeInputClasses)}
        />
        <p className={cn("text-xs mt-1.5", isDark ? 'text-pink-100/80' : 'text-neutral-500')}>
          The ID of the output handle to use if no conditions are met.
        </p>
      </div>
    </div>
  );
}