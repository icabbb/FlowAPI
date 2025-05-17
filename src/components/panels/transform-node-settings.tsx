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

export interface MappingRule {
  id: string;
  inputPath: string;
  outputPath: string;
  enabled: boolean;
}

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

export function TransformNodeSettings({ node }: TransformNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeId = node.id;

  const [label, setLabel] = useState(node.data?.label ?? defaultNodeData.label);
  const [mappingRules, setMappingRules] = useState<MappingRule[]>(node.data?.mappingRules ?? defaultNodeData.mappingRules ?? []);

  useEffect(() => {
    setLabel(node.data?.label ?? defaultNodeData.label);
    setMappingRules(node.data?.mappingRules ?? defaultNodeData.mappingRules ?? []);
  }, [node.id, node.data?.label, node.data?.mappingRules]);

  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (node.data?.label !== label) {
      updateNodeData(nodeId, { label });
    }
  }, [nodeId, label, node.data?.label, updateNodeData]);

  const notifyRuleChange = (updatedRules: MappingRule[]) => {
    setMappingRules(updatedRules);
    updateNodeData(nodeId, { mappingRules: updatedRules });
  };

  const handleRuleChange = (id: string, field: 'inputPath' | 'outputPath', value: string) => {
    notifyRuleChange(
      mappingRules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule)
    );
  };

  const handleToggleRule = (id: string) => {
    notifyRuleChange(
      mappingRules.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)
    );
  };

  const handleDeleteRule = (id: string) => {
    notifyRuleChange(mappingRules.filter(rule => rule.id !== id));
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

  // Cartoon color palette
  const borderCard = isDark ? "border-blue-400" : "border-neutral-300";
  const labelText = isDark ? "text-blue-100" : "text-neutral-800";

  return (
    <div className="space-y-6 font-sans">
      {/* Label */}
      <div>
        <Label
          htmlFor="label"
          className={cn("text-sm font-semibold mb-1 block", labelText)}
        >
          Node Label
        </Label>
        <Input
          id="label"
          name="label"
          type="text"
          value={label}
          onChange={handleLabelChange}
          onBlur={handleLabelBlur}
          onMouseDown={e => e.stopPropagation()}
          className={cn(
            "w-full h-10 rounded-xl px-4 border-2 shadow-cartoon text-sm allow-text-selection focus:outline-none",
            isDark
              ? "bg-[#0f172acc] border-blue-400 text-white focus:border-blue-300"
              : "bg-white border-neutral-800 text-neutral-800 focus:border-blue-500"
          )}
        />
      </div>

      {/* Mapping Rules */}
      <div className={cn(
        "rounded-2xl border-2 shadow-cartoon p-4 space-y-4",
        isDark ? "bg-[#222d46] border-blue-400" : "bg-white border-neutral-300"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <ArrowRight className={cn("h-4 w-4", isDark ? "text-blue-400" : "text-blue-700")} />
          <span className={cn("text-base font-bold", labelText)}>Mapping Rules</span>
        </div>
        <p className={cn("text-xs mb-2", isDark ? "text-blue-100/70" : "text-neutral-600")}>
          Map input JSON paths to new output keys.
        </p>
        {/* Rules List */}
        <div className="space-y-3">
          {mappingRules.map((rule, i) => (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl border-2 shadow-sm",
                isDark ? "bg-blue-900/10 border-blue-300" : "bg-blue-50 border-blue-200"
              )}
            >
              <Checkbox
                id={`enabled-${rule.id}`}
                checked={rule.enabled}
                onCheckedChange={() => handleToggleRule(rule.id)}
                className={cn(
                  "nodrag h-5 w-5 rounded border-2 mt-1",
                  isDark
                    ? "border-blue-400 bg-neutral-800 data-[state=checked]:bg-blue-600"
                    : "border-blue-400 bg-white data-[state=checked]:bg-blue-500"
                )}
              />
              <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                <Input
                  type="text"
                  placeholder="Input Path (e.g., $.user.id)"
                  value={rule.inputPath}
                  onChange={e => handleRuleChange(rule.id, 'inputPath', e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  className={cn(
                    "h-9 w-full min-w-0 px-3 font-mono text-xs rounded-lg border-2 shadow-cartoon allow-text-selection",
                    isDark
                      ? "bg-neutral-800 border-blue-400 text-white focus:border-blue-300"
                      : "bg-white border-blue-400 text-neutral-900 focus:border-blue-500"
                  )}
                />
                <ArrowRight className={cn("h-4 w-4 mx-1", isDark ? "text-blue-400" : "text-blue-700")} />
                <Input
                  type="text"
                  placeholder="Output Path (e.g., userId)"
                  value={rule.outputPath}
                  onChange={e => handleRuleChange(rule.id, 'outputPath', e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  className={cn(
                    "h-9 w-full min-w-0 px-3 font-mono text-xs rounded-lg border-2 shadow-cartoon allow-text-selection",
                    isDark
                      ? "bg-neutral-800 border-blue-400 text-white focus:border-blue-300"
                      : "bg-white border-blue-400 text-neutral-900 focus:border-blue-500"
                  )}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteRule(rule.id)}
                className={cn(
                  "ml-2 rounded-full border-2 border-transparent hover:border-red-400 hover:bg-red-100/70 transition text-blue-200 hover:text-red-400",
                  !isDark && "text-blue-700 hover:text-red-500"
                )}
                title="Delete rule"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {/* Add Rule Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRule}
          className={cn(
            "w-full mt-3 py-2 flex items-center justify-center gap-2 rounded-xl border-2 shadow-cartoon font-bold",
            isDark
              ? "border-blue-400 text-blue-100 hover:bg-blue-600/10"
              : "border-neutral-300 text-blue-700 hover:bg-blue-100"
          )}
        >
          <Plus className="h-4 w-4" /> Add Mapping Rule
        </Button>
      </div>
    </div>
  );
}
