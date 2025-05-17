'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Textarea } from '@/components/ui/textarea';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Globe } from 'lucide-react';

interface VariableSetNodeData {
  label?: string;
  variableName?: string;
  variableValue?: string;
  target?: 'flowContext' | 'selectedEnvironment';
  markAsSecret?: boolean;
  [key: string]: any;
}

const defaultNodeData: VariableSetNodeData = {
  label: 'Set Variable',
  variableName: 'myVariable',
  variableValue: '',
  target: 'flowContext',
  markAsSecret: false,
};

interface VariableSetSettingsProps {
  node: Node<VariableSetNodeData>;
}

export function VariableSetSettings({ node }: VariableSetSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const nodeId = node.id;

  const [label, setLabel] = useState(node.data?.label ?? defaultNodeData.label);
  const [variableName, setVariableName] = useState(node.data?.variableName ?? defaultNodeData.variableName);
  const [variableValue, setVariableValue] = useState(node.data?.variableValue ?? defaultNodeData.variableValue);
  const [target, setTarget] = useState(node.data?.target ?? defaultNodeData.target ?? 'flowContext');
  const [markAsSecret, setMarkAsSecret] = useState(node.data?.markAsSecret ?? defaultNodeData.markAsSecret ?? false);

  useEffect(() => {
    setLabel(node.data?.label ?? defaultNodeData.label);
    setVariableName(node.data?.variableName ?? defaultNodeData.variableName);
    setVariableValue(node.data?.variableValue ?? defaultNodeData.variableValue);
    setTarget(node.data?.target ?? defaultNodeData.target ?? 'flowContext');
    setMarkAsSecret(node.data?.markAsSecret ?? defaultNodeData.markAsSecret ?? false);
  }, [node.id, node.data]);

  // Handlers
  const handleLabelBlur = () => { if (node.data?.label !== label) updateNodeData(nodeId, { label }); };
  const handleNameBlur = () => { if (node.data?.variableName !== variableName) updateNodeData(nodeId, { variableName }); };
  const handleValueBlur = () => { if (node.data?.variableValue !== variableValue) updateNodeData(nodeId, { variableValue }); };

  const handleTargetChange = (value: 'flowContext' | 'selectedEnvironment') => {
    setTarget(value);
    updateNodeData(nodeId, { target: value });
    if (value === 'flowContext') {
      setMarkAsSecret(false);
      updateNodeData(nodeId, { markAsSecret: false });
    }
  };

  const handleMarkAsSecretChange = (checked: boolean | string) => {
    const isChecked = checked === true;
    setMarkAsSecret(isChecked);
    updateNodeData(nodeId, { markAsSecret: isChecked });
  };

  // Cartoon border neutral/blue style (igual que tus otros nodos)
  const cartoonBorder = isDark ? "border-blue-500" : "border-neutral-800";
  const cartoonSection = isDark
    ? "bg-[#19223a] border-blue-500"
    : "bg-white border-neutral-800";
  const cartoonLabel = isDark ? "text-blue-200" : "text-neutral-800";
  const cartoonHelp = isDark ? "text-blue-100/70" : "text-neutral-500";

  return (
    <div className="space-y-7 font-sans">
      {/* Node Label */}
      <div>
        <Label htmlFor="label" className={cn("text-sm font-bold mb-1.5 block", cartoonLabel)}>
          Node Label
        </Label>
        <Input
          id="label"
          name="label"
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={handleLabelBlur}
          onMouseDown={e => e.stopPropagation()}
          className={cn(
            "h-11 border-2 rounded-2xl px-4 shadow-cartoon text-base allow-text-selection",
            isDark ? "bg-[#0f172acc] text-white" : "bg-white text-neutral-800",
            cartoonBorder
          )}
        />
      </div>

      {/* Target */}
      <div>
        <Label htmlFor="target-select" className={cn("text-sm font-bold mb-1.5 block", cartoonLabel)}>
          Save Variable To
        </Label>
        <Select value={target} onValueChange={handleTargetChange}>
  <SelectTrigger
    id="target-select"
    className={cn(
      "h-11 border-2 rounded-2xl px-4 shadow-cartoon text-base font-bold max-w-72",
      isDark ? "bg-[#0f172acc] text-white" : "bg-white text-neutral-800",
      cartoonBorder
    )}
  >
    <SelectValue
      placeholder="Select target..."
      className="font-bold"
    />
  </SelectTrigger>
  <SelectContent className={cn("rounded-xl border-2 shadow-lg mt-1", cartoonSection)}>
    <SelectItem value="flowContext" className="cursor-pointer rounded-lg px-2 py-2 text-base font-bold flex items-center gap-2">
      <Globe className="h-4 w-4 text-blue-400" />
      Flow Context (Temporary)
    </SelectItem>
    <SelectItem value="selectedEnvironment" className="cursor-pointer rounded-lg px-2 py-2 text-base font-bold flex items-center gap-2">
      <Lock className="h-4 w-4 text-amber-400" />
      Selected Environment (Persistent)
    </SelectItem>
  </SelectContent>
</Select>

        <p className={cn("text-xs mt-1.5", cartoonHelp)}>
          {target === 'flowContext'
            ? "Variable exists only for this flow run."
            : "Variable is saved persistently in the selected environment."}
        </p>
      </div>

      {/* Variable Name */}
      <div>
        <Label htmlFor="variableName" className={cn("text-sm font-bold mb-1.5 block", cartoonLabel)}>
          Variable Name
        </Label>
        <Input
          id="variableName"
          name="variableName"
          type="text"
          placeholder="e.g., userId, authToken"
          value={variableName}
          onChange={e => setVariableName(e.target.value)}
          onBlur={handleNameBlur}
          onMouseDown={e => e.stopPropagation()}
          className={cn(
            "h-11 border-2 rounded-2xl px-4 shadow-cartoon font-mono text-base allow-text-selection",
            isDark ? "bg-[#0f172acc] text-white" : "bg-white text-neutral-800",
            cartoonBorder
          )}
        />
        <p className={cn("text-xs mt-1.5", cartoonHelp)}>
          {target === 'flowContext'
            ? "Access using {{context.variableName}}."
            : "Access using {{env.variableName}}."}
        </p>
      </div>

      {/* Variable Value */}
      <div>
        <Label htmlFor="variableValue" className={cn("text-sm font-bold mb-1.5 block", cartoonLabel)}>
          Value to Set
        </Label>
        <Textarea
          id="variableValue"
          value={variableValue}
          onChange={e => setVariableValue(e.target.value)}
          onBlur={handleValueBlur}
          onMouseDown={e => e.stopPropagation()}
          placeholder="Enter static value or use references like {{env.API_KEY}}"
          className={cn(
            "rounded-2xl border-2 px-4 py-2 shadow-cartoon text-base font-mono allow-text-selection min-h-24",
            isDark ? "bg-[#0f172acc] text-white" : "bg-white text-neutral-800",
            cartoonBorder
          )}
        />
        <p className={cn("text-xs mt-1.5", cartoonHelp)}>
          This value will be stored after resolving any references.
        </p>
      </div>

      {/* Mark as Secret */}
      {target === 'selectedEnvironment' && (
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="markAsSecret"
            checked={markAsSecret}
            onCheckedChange={handleMarkAsSecretChange}
            className={cn(
              "nodrag h-5 w-5 rounded border-2 shadow-cartoon",
              isDark
                ? "border-blue-400 bg-neutral-700 data-[state=checked]:bg-blue-600"
                : "border-neutral-800 bg-white data-[state=checked]:bg-blue-500"
            )}
          />
          <Label
            htmlFor="markAsSecret"
            className={cn(
              "text-sm font-medium cursor-pointer",
              cartoonLabel
            )}
          >
            Store value as secret (encrypted)
          </Label>
        </div>
      )}
    </div>
  );
}
