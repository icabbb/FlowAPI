'use client';

import { useState, useEffect, useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useFlowStore } from '@/store/index';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Textarea } from '@/components/ui/textarea'; // Use Textarea for value
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

// Interface matching the VariableSetNode data
interface VariableSetNodeData {
  label?: string;
  variableName?: string;
  variableValue?: string;
  target?: 'flowContext' | 'selectedEnvironment'; // Added: Target destination
  markAsSecret?: boolean; // Added: Flag to mark value as secret if target is environment
  [key: string]: any;
}

const defaultNodeData: VariableSetNodeData = {
  label: 'Set Variable',
  variableName: 'myVariable',
  variableValue: '',
  target: 'flowContext', // Default to flow context
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

  // State for form fields
  const [label, setLabel] = useState(node.data?.label ?? defaultNodeData.label);
  const [variableName, setVariableName] = useState(node.data?.variableName ?? defaultNodeData.variableName);
  const [variableValue, setVariableValue] = useState(node.data?.variableValue ?? defaultNodeData.variableValue);
  const [target, setTarget] = useState(node.data?.target ?? defaultNodeData.target ?? 'flowContext');
  const [markAsSecret, setMarkAsSecret] = useState(node.data?.markAsSecret ?? defaultNodeData.markAsSecret ?? false);

  // Sync state when the selected node changes
  useEffect(() => {
    setLabel(node.data?.label ?? defaultNodeData.label);
    setVariableName(node.data?.variableName ?? defaultNodeData.variableName);
    setVariableValue(node.data?.variableValue ?? defaultNodeData.variableValue);
    setTarget(node.data?.target ?? defaultNodeData.target ?? 'flowContext');
    setMarkAsSecret(node.data?.markAsSecret ?? defaultNodeData.markAsSecret ?? false);
  }, [node.id, node.data?.label, node.data?.variableName, node.data?.variableValue, node.data?.target, node.data?.markAsSecret]);

  // --- Callbacks for updating store on blur/change --- 
  const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(event.target.value);
  }, []);

  const handleLabelBlur = useCallback(() => {
    if (node.data?.label !== label) {
      updateNodeData(nodeId, { label: label });
    }
  }, [nodeId, label, node.data?.label, updateNodeData]);

  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setVariableName(event.target.value);
  }, []);

  const handleNameBlur = useCallback(() => {
    if (node.data?.variableName !== variableName) {
      updateNodeData(nodeId, { variableName: variableName });
    }
  }, [nodeId, variableName, node.data?.variableName, updateNodeData]);

  const handleValueChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVariableValue(event.target.value);
  }, []);

  const handleValueBlur = useCallback(() => {
    if (node.data?.variableValue !== variableValue) {
      updateNodeData(nodeId, { variableValue: variableValue });
    }
  }, [nodeId, variableValue, node.data?.variableValue, updateNodeData]);

  const handleTargetChange = useCallback((value: 'flowContext' | 'selectedEnvironment') => {
    setTarget(value);
    updateNodeData(nodeId, { target: value });
    // Reset markAsSecret if switching back to flowContext where it doesn't apply
    if (value === 'flowContext') {
      setMarkAsSecret(false);
      updateNodeData(nodeId, { markAsSecret: false });
    }
  }, [nodeId, updateNodeData]);

  const handleMarkAsSecretChange = useCallback((checked: boolean | string) => {
    const isChecked = checked === true;
    setMarkAsSecret(isChecked);
    updateNodeData(nodeId, { markAsSecret: isChecked });
  }, [nodeId, updateNodeData]);


  // --- Input Style Helpers ---
  const getInputClass = (isTextarea = false) => cn(
    "w-full rounded-lg focus:outline-none text-sm shadow-sm border-2",
    !isTextarea && "h-10 px-3",
    isTextarea && "min-h-24 p-3",
    "allow-text-selection nodrag", // Added nodrag
    isDark 
      ? "bg-neutral-800 border-indigo-500/70 text-white focus:border-indigo-400 placeholder:text-neutral-400/50"
      : "bg-white border-neutral-800 text-neutral-800 focus:border-indigo-500"
  );

  const getLabelClass = () => cn(
    "text-sm font-semibold mb-1.5 block",
    isDark ? "text-indigo-200" : "text-neutral-700"
  );
  
  const getSelectTriggerClass = () => cn(
      "w-full rounded-lg focus:outline-none h-10 px-3 text-sm shadow-sm border-2 nodrag",
      isDark 
        ? "bg-neutral-800 border-indigo-500/70 text-white focus:border-indigo-400 [&>span]:text-white"
        : "bg-white border-neutral-800 text-neutral-800 focus:border-indigo-500"
  );
  
  const getSelectContentClass = () => cn(
      "rounded-lg shadow-md border-2",
      isDark 
        ? "bg-neutral-800 border-indigo-500/70 text-indigo-100"
        : "bg-white border-neutral-800 text-neutral-800"
  );
  
  const getSelectItemClass = () => cn(
      "cursor-pointer rounded-md px-2 py-1.5 text-sm outline-none focus:bg-accent data-[highlighted]:bg-accent data-[state=checked]:font-semibold",
      isDark
        ? "focus:bg-indigo-700/50 data-[highlighted]:bg-indigo-700/50"
        : "focus:bg-indigo-100 data-[highlighted]:bg-indigo-100"
  );
  
  const getCheckboxClass = () => cn(
      "nodrag h-4 w-4 rounded border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shadow-sm",
      isDark 
        ? "border-indigo-500 bg-neutral-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-700 data-[state=checked]:text-white focus-visible:ring-indigo-400 focus-visible:ring-offset-neutral-800"
        : "border-neutral-800 bg-white data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-700 data-[state=checked]:text-white focus-visible:ring-indigo-500 focus-visible:ring-offset-white"
  );

  // --- Render Logic --- 
  return (
    <div className="space-y-5 font-sans">
      {/* Label Setting */}
      <div>
        <Label htmlFor="label" className={getLabelClass()}>
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
          className={getInputClass()} // Use helper
        />
      </div>

      {/* --- Target Setting --- */}
      <div>
        <Label htmlFor="target-select" className={getLabelClass()}>
          Save Variable To
        </Label>
        <Select value={target} onValueChange={handleTargetChange}>
          <SelectTrigger id="target-select" className={getSelectTriggerClass()}>
            <SelectValue placeholder="Select target..." />
          </SelectTrigger>
          <SelectContent className={getSelectContentClass()}>
            <SelectItem value="flowContext" className={getSelectItemClass()}>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                <span>Flow Context (Temporary)</span>
              </div>
            </SelectItem>
            <SelectItem value="selectedEnvironment" className={getSelectItemClass()}>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500 dark:text-amber-300"/>
                <span>Selected Environment (Persistent)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className={cn(
          "text-xs mt-1.5",
          isDark ? "text-indigo-100/70" : "text-neutral-500"
        )}>
          {target === 'flowContext' 
           ? "Variable exists only for this flow run."
           : "Variable is saved persistently in the currently selected environment."}
        </p>
      </div>
      {/* --- End Target Setting --- */}

      {/* Variable Name Setting */}
      <div>
        <Label htmlFor="variableName" className={getLabelClass()}>
          Variable Name
        </Label>
        <Input
          id="variableName"
          name="variableName"
          type="text"
          placeholder="e.g., userId, authToken"
          value={variableName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(getInputClass(), "font-mono")} // Use helper
        />
         <p className={cn(
          "text-xs mt-1.5",
          isDark ? "text-indigo-100/70" : "text-neutral-500"
        )}>
          {target === 'flowContext'
           ? "Access using {{context.variableName}}."
           : "Access using {{env.variableName}}."}
        </p>
      </div>

      {/* Variable Value Setting */}
      <div>
        <Label htmlFor="variableValue" className={getLabelClass()}>
          Value to Set
        </Label>
        <Textarea
          id="variableValue"
          value={variableValue}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
          onMouseDown={(e) => e.stopPropagation()} // Added nodrag here too
          placeholder="Enter static value or use references like {{env.API_KEY}} or {{prevNodeId::$.data.id}}"
          className={getInputClass(true)} // Use helper for textarea
        />
         <p className={cn(
          "text-xs mt-1.5",
          isDark ? "text-indigo-100/70" : "text-neutral-500"
        )}>
          This value will be stored after resolving any references.
        </p>
      </div>
      
      {/* --- Mark as Secret Checkbox (Conditional) --- */}
      {target === 'selectedEnvironment' && (
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
                id="markAsSecret"
                checked={markAsSecret}
                onCheckedChange={handleMarkAsSecretChange}
                className={getCheckboxClass()} // Use helper
            />
            <Label 
                htmlFor="markAsSecret" 
                className={cn(
                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
                    isDark ? "text-indigo-200" : "text-neutral-700"
                 )}
            >
                Store value as secret (encrypted)
            </Label>
          </div>
      )}
      {/* --- End Mark as Secret --- */}
    </div>
  );
} 