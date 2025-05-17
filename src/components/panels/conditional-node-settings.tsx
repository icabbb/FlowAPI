'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

  // --- handlers
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
    updateConditions([
      ...conditions,
      { id: crypto.randomUUID(), expression: '', outputHandleId: '', enabled: true }
    ]);
  };

  // --- Cartoon border: blue in dark, neutral-200 in light
  const cartoonBorder = isDark ? 'border-blue-400' : 'border-neutral-300';

  return (
    <div className="space-y-7 font-sans px-1 pb-2 pt-2">
      {/* Node Label */}
      <div>
        <Label htmlFor="node-label" className={cn("text-sm font-bold mb-1 block", isDark ? 'text-blue-100' : 'text-neutral-700')}>
          Node Label
        </Label>
        <Input
          id="node-label"
          type="text"
          placeholder="e.g., User Status Check"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          className={cn(
            "h-10 border-2 rounded-xl px-4 shadow text-sm allow-text-selection",
            isDark ? "bg-[#0f172acc] text-white" : "bg-white text-neutral-800",
            cartoonBorder
          )}
        />
      </div>

      {/* Conditions */}
      <div className={cn(
        "rounded-2xl border-2 shadow-cartoon px-0 pb-4 pt-2",
        isDark ? 'bg-[#1c2540] border-blue-400' : 'bg-white border-neutral-300'
      )}>
        <div className="flex items-center gap-2 px-5 pt-3 pb-2">
          <GitBranch className="h-4 w-4" aria-hidden="true" />
          <span className="font-bold text-base">Conditions</span>
          <span className="ml-2 text-xs opacity-60">(Top-Down order)</span>
        </div>

        {/* --- Condition list --- */}
        <div className="space-y-4 px-3">
          {conditions.map((c, i) => (
            <div
              key={c.id}
              className={cn(
                "relative rounded-xl border-2 px-3 py-3 flex flex-col gap-2 bg-opacity-95 shadow-sm",
                isDark ? "bg-[#23315d] border-blue-300" : "bg-blue-50 border-blue-200"
              )}
            >
              {/* Step badge */}
              <span
                className={cn(
                  "absolute -top-3 left-3 h-6 w-6 rounded-full border-2 font-bold text-xs flex items-center justify-center shadow z-10",
                  isDark ? "bg-blue-700 text-blue-100 border-blue-400" : "bg-blue-100 text-blue-700 border-blue-400"
                )}
              >
                {i + 1}
              </span>
              <div className="flex gap-2 items-center">
                <Checkbox
                  id={`condition-enabled-${c.id}`}
                  checked={c.enabled}
                  onCheckedChange={() => toggleCondition(c.id)}
                  aria-label={`Enable condition ${i + 1}`}
                  className="border-blue-400 scale-110"
                />
                <Input
                  id={`condition-expression-${c.id}`}
                  placeholder="e.g. {{status}} == 200"
                  value={c.expression}
                  onChange={(e) => handleConditionChange(c.id, 'expression', e.target.value)}
                  className={cn(
                    "border-2 rounded-xl px-3 py-1 font-mono text-xs shadow w-full",
                    isDark ? "bg-[#19223a] border-blue-400 text-white" : "bg-white border-blue-200 text-neutral-900",
                    "focus:border-blue-400"
                  )}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteCondition(c.id)}
                  className={cn(
                    "rounded-full ml-2",
                    isDark
                      ? "text-blue-200 hover:text-red-400 hover:bg-red-900/30"
                      : "text-blue-700 hover:text-red-500 hover:bg-red-100/50"
                  )}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="flex gap-2 items-center pl-8">
                <span className={cn("text-xs font-bold", isDark ? "text-blue-200" : "text-blue-700")}>
                  then use handle:
                </span>
                <Input
                  id={`condition-handle-${c.id}`}
                  placeholder="Handle ID"
                  value={c.outputHandleId}
                  onChange={(e) => handleConditionChange(c.id, 'outputHandleId', e.target.value)}
                  className={cn(
                    "border-2 rounded-xl px-3 py-1 font-mono text-xs shadow w-full max-w-[150px]",
                    isDark ? "bg-[#19223a] border-blue-400 text-white" : "bg-white border-blue-200 text-neutral-900",
                    "focus:border-blue-400"
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 px-4">
          <Button
            variant="outline"
            onClick={addCondition}
            className={cn(
              "w-full py-2 flex items-center justify-center gap-2 rounded-xl border-2 shadow-cartoon font-bold",
              isDark
                ? "border-blue-400 text-blue-100 hover:bg-blue-600/10"
                : "border-blue-300 text-blue-700 hover:bg-blue-100"
            )}
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Condition
          </Button>
        </div>
      </div>

      {/* Default Handle */}
      <div>
        <Label
          htmlFor="default-handle-id"
          className={cn("text-sm font-bold mb-1 block", isDark ? 'text-blue-100' : 'text-neutral-700')}
        >
          Default Output Handle ID
        </Label>
        <Input
          id="default-handle-id"
          placeholder="e.g., fallbackOutput"
          value={defaultHandleId}
          onChange={handleDefaultHandleIdChange}
          onBlur={handleDefaultHandleIdBlur}
          className={cn(
            "h-10 border-2 rounded-xl px-4 shadow font-mono text-sm allow-text-selection",
            isDark ? "bg-[#0f172acc] text-white" : "bg-white text-neutral-800",
            cartoonBorder
          )}
        />
        <p className={cn("text-xs mt-1.5", isDark ? 'text-blue-100/80' : 'text-neutral-500')}>
          The ID of the output handle to use if no conditions are met.
        </p>
      </div>
    </div>
  );
}
