'use client';

import { useCallback } from 'react';
import { useFlowStore } from '@/store/index';
import { Node } from '@xyflow/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { type ExportNodeData } from '@/contracts/types/nodes.types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  FileJson,
  FileText,
  FileBadge,
  FileType,
} from 'lucide-react';

const SwitchComponent = ({ id, checked, onCheckedChange, className }: { id: string; checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string }) => (
  <button 
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`${checked ? 'bg-purple-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full ${className}`}
  >
    <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`} />
  </button>
);

const SeparatorComponent = ({ className }: { className?: string }) => (
  <div className={`h-px w-full my-2 ${className}`} />
);

interface ExportNodeSettingsProps {
  node: Node<ExportNodeData>;
}

export function ExportNodeSettings({ node }: ExportNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const nodeData = {
    label: 'Export',
    exportFormat: 'csv',
    fileName: 'exported-data',
    includeTimestamp: true,
    flatten: true,
    customSeparator: ',',
    ...node.data,
  };

  const handleChange = useCallback((field: keyof ExportNodeData, value: any) => {
    updateNodeData(node.id, { [field]: value });
  }, [updateNodeData, node.id]);

  return (
    <div className="p-5 space-y-5">
      <div>
        <Label htmlFor="label" className={cn("text-sm font-medium mb-2 block", isDark ? "text-neutral-200" : "text-neutral-800 border-2 border-purple-500")}>Node Label</Label>
        <Input
          id="label"
          className={cn("w-full rounded-lg border-2 shadow-sm", isDark ? "bg-neutral-800 border-purple-500 text-white" : "bg-white border-neutral-800")}
          value={nodeData.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="Export"
        />
      </div>

      <SeparatorComponent className={isDark ? "bg-purple-500/20" : "bg-neutral-300"} />

      <div>
        <Label htmlFor="exportFormat" className={cn("text-sm font-medium mb-2 block", isDark ? "text-neutral-200" : "text-neutral-800")}>Export Format</Label>
        <Select value={nodeData.exportFormat} onValueChange={(value) => handleChange('exportFormat', value)}>
          <SelectTrigger id="exportFormat" className={cn("w-full rounded-lg border-2 shadow-sm", isDark ? "bg-neutral-800 border-purple-500 text-white" : "bg-white border-neutral-800")}> <SelectValue placeholder="Select format" /> </SelectTrigger>
          <SelectContent className={isDark ? "bg-neutral-800 border-purple-500" : "bg-white border-neutral-800"}>
            <SelectItem value="csv"><div className="flex items-center gap-2"><Table className="h-4 w-4" /> CSV</div></SelectItem>
            <SelectItem value="json"><div className="flex items-center gap-2"><FileJson className="h-4 w-4" /> JSON</div></SelectItem>
            <SelectItem value="txt"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> TXT</div></SelectItem>
            <SelectItem value="html"><div className="flex items-center gap-2"><FileBadge className="h-4 w-4" /> HTML</div></SelectItem>
            <SelectItem value="markdown"><div className="flex items-center gap-2"><FileType className="h-4 w-4" /> Markdown</div></SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="fileName" className={cn("text-sm font-medium mb-2 block", isDark ? "text-neutral-200" : "text-neutral-800")}>File Name</Label>
        <Input
          id="fileName"
          className={cn("w-full rounded-lg border-2 shadow-sm", isDark ? "bg-neutral-800 border-purple-500 text-white" : "bg-white border-neutral-800")}
          value={nodeData.fileName || ''}
          onChange={(e) => handleChange('fileName', e.target.value)}
          placeholder="exported-data"
        />
        <p className={cn("text-xs mt-1", isDark ? "text-neutral-400" : "text-neutral-500")}>Without file extension</p>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="includeTimestamp" className={cn("text-sm font-medium", isDark ? "text-neutral-200" : "text-neutral-800")}>Add timestamp to filename</Label>
        <SwitchComponent id="includeTimestamp" checked={nodeData.includeTimestamp || false} onCheckedChange={(checked) => handleChange('includeTimestamp', checked)} className={isDark ? "bg-purple-500" : "bg-purple-600"} />
      </div>

      {nodeData.exportFormat === 'csv' && (
        <>
          <SeparatorComponent className={isDark ? "bg-purple-500/20" : "bg-neutral-300"} />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="flatten" className={cn("text-sm font-medium", isDark ? "text-neutral-200" : "text-neutral-800")}>Flatten nested structures</Label>
              <p className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>Convert nested objects to dot notation</p>
            </div>
            <SwitchComponent id="flatten" checked={nodeData.flatten || false} onCheckedChange={(checked) => handleChange('flatten', checked)} className={isDark ? "bg-purple-500" : "bg-purple-600"} />
          </div>

          <div>
            <Label htmlFor="customSeparator" className={cn("text-sm font-medium mb-2 block", isDark ? "text-neutral-200" : "text-neutral-800")}>CSV Separator</Label>
            <Select value={nodeData.customSeparator || ','} onValueChange={(value) => handleChange('customSeparator', value)}>
              <SelectTrigger id="customSeparator" className={cn("w-full rounded-lg border-2 shadow-sm", isDark ? "bg-neutral-800 border-purple-500 text-white" : "bg-white border-neutral-800")}> <SelectValue placeholder="Select separator" /> </SelectTrigger>
              <SelectContent className={isDark ? "bg-neutral-800 border-purple-500" : "bg-white border-neutral-800"}>
                <SelectItem value="," className={isDark ? "text-white" : undefined}>Comma (,)</SelectItem>
                <SelectItem value=";" className={isDark ? "text-white" : undefined}>Semicolon (;)</SelectItem>
                <SelectItem value="\t" className={isDark ? "text-white" : undefined}>Tab</SelectItem>
                <SelectItem value="|" className={isDark ? "text-white" : undefined}>Pipe (|)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
