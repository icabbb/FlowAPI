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
  Share2,
} from 'lucide-react';

// Cartoon Switch (igual estilo, azul solo en dark)
const SwitchComponent = ({
  id,
  checked,
  onCheckedChange,
  className,
}: { id: string; checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-150 border-2",
      checked
        ? (className || "")
        : (className || ""),
      checked
        ? "bg-blue-500 border-blue-400"
        : "bg-gray-300 border-neutral-300"
    )}
  >
    <span className={cn(
      "inline-block h-4 w-4 transform rounded-full bg-white shadow transition",
      checked ? "translate-x-6" : "translate-x-1"
    )} />
  </button>
);

const SeparatorComponent = ({ className }: { className?: string }) => (
  <div className={cn("h-px w-full my-2", className)} />
);

interface ExportNodeSettingsProps {
  node: Node<ExportNodeData>;
}

export function ExportNodeSettings({ node }: ExportNodeSettingsProps) {
  const { updateNodeData } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cartoonCard = isDark
    ? "bg-[#192844] border-blue-400/80 shadow-[0_8px_30px_4px_rgba(8,45,126,0.13)]"
    : "bg-white border-neutral-300 shadow-[0_8px_24px_2px_rgba(80,80,80,0.09)]";

  const nodeData = {
    label: 'Export',
    exportFormat: 'csv',
    fileName: 'exported-data',
    includeTimestamp: true,
    flatten: true,
    customSeparator: ',',
    ...node.data,
  };

  const handleChange = useCallback(
    (field: keyof ExportNodeData, value: any) => {
      updateNodeData(node.id, { [field]: value });
    },
    [updateNodeData, node.id]
  );

  return (
    <div className={cn(
      "rounded-2xl border-2 p-6 flex flex-col gap-6 font-sans relative",
      cartoonCard
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Share2 className={cn("h-5 w-5 flex-shrink-0", isDark ? "text-blue-300" : "text-neutral-500")} />
        <span className={cn("text-lg font-bold", isDark ? "text-blue-100" : "text-neutral-800")}>
          Export Node
        </span>
      </div>

      {/* Node Label */}
      <div>
        <Label htmlFor="label" className={cn(
          "text-sm font-semibold mb-1.5 block",
          isDark ? "text-blue-200" : "text-neutral-800"
        )}>Node Label</Label>
        <Input
          id="label"
          className={cn(
            "w-full rounded-lg border-2 shadow-sm transition-all font-semibold",
            isDark ? "bg-[#15243a] border-blue-400/80 text-blue-100 focus:border-blue-300"
            : "bg-white border-neutral-300 text-neutral-900 focus:border-blue-400"
          )}
          value={nodeData.label || ''}
          onChange={e => handleChange('label', e.target.value)}
          placeholder="Export"
        />
      </div>

      <SeparatorComponent className={isDark ? "bg-blue-500/20" : "bg-neutral-200"} />

      {/* Export Format */}
      <div>
        <Label htmlFor="exportFormat" className={cn(
          "text-sm font-semibold mb-1.5 block",
          isDark ? "text-blue-200" : "text-neutral-800"
        )}>Export Format</Label>
        <Select value={nodeData.exportFormat} onValueChange={val => handleChange('exportFormat', val)}>
          <SelectTrigger id="exportFormat" className={cn(
            "w-full rounded-lg border-2 shadow-sm font-semibold",
            isDark ? "bg-[#15243a] border-blue-400/80 text-blue-100" : "bg-white border-neutral-300 text-neutral-900"
          )}>
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent className={isDark ? "bg-[#0f172acc] border-blue-400" : "bg-white border-neutral-300"}>
            <SelectItem value="csv"><div className="flex items-center gap-2"><Table className="h-4 w-4" /> CSV</div></SelectItem>
            <SelectItem value="json"><div className="flex items-center gap-2"><FileJson className="h-4 w-4" /> JSON</div></SelectItem>
            <SelectItem value="txt"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> TXT</div></SelectItem>
            <SelectItem value="html"><div className="flex items-center gap-2"><FileBadge className="h-4 w-4" /> HTML</div></SelectItem>
            <SelectItem value="markdown"><div className="flex items-center gap-2"><FileType className="h-4 w-4" /> Markdown</div></SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Name */}
      <div>
        <Label htmlFor="fileName" className={cn(
          "text-sm font-semibold mb-1.5 block",
          isDark ? "text-blue-200" : "text-neutral-800"
        )}>File Name</Label>
        <Input
          id="fileName"
          className={cn(
            "w-full rounded-lg border-2 shadow-sm font-semibold",
            isDark ? "bg-[#15243a] border-blue-400/80 text-blue-100 focus:border-blue-300"
            : "bg-white border-neutral-300 text-neutral-900 focus:border-blue-400"
          )}
          value={nodeData.fileName || ''}
          onChange={e => handleChange('fileName', e.target.value)}
          placeholder="exported-data"
        />
        <p className={cn("text-xs mt-1", isDark ? "text-neutral-400" : "text-neutral-500")}>Without file extension</p>
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-between">
        <Label htmlFor="includeTimestamp" className={cn(
          "text-sm font-semibold",
          isDark ? "text-blue-200" : "text-neutral-800"
        )}>Add timestamp to filename</Label>
        <SwitchComponent
          id="includeTimestamp"
          checked={nodeData.includeTimestamp || false}
          onCheckedChange={checked => handleChange('includeTimestamp', checked)}
          className={isDark ? "bg-blue-500" : "bg-gray-300"}
        />
      </div>

      {/* CSV-only settings */}
      {nodeData.exportFormat === 'csv' && (
        <>
          <SeparatorComponent className={isDark ? "bg-blue-500/20" : "bg-neutral-200"} />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="flatten" className={cn(
                "text-sm font-semibold",
                isDark ? "text-blue-200" : "text-neutral-800"
              )}>Flatten nested structures</Label>
              <p className={cn("text-xs", isDark ? "text-neutral-400" : "text-neutral-500")}>Convert nested objects to dot notation</p>
            </div>
            <SwitchComponent
              id="flatten"
              checked={nodeData.flatten || false}
              onCheckedChange={checked => handleChange('flatten', checked)}
              className={isDark ? "bg-blue-500" : "bg-gray-300"}
            />
          </div>

          <div>
            <Label htmlFor="customSeparator" className={cn(
              "text-sm font-semibold mb-1.5 block",
              isDark ? "text-blue-200" : "text-neutral-800"
            )}>CSV Separator</Label>
            <Select value={nodeData.customSeparator || ','} onValueChange={val => handleChange('customSeparator', val)}>
              <SelectTrigger id="customSeparator" className={cn(
                "w-full rounded-lg border-2 shadow-sm font-semibold",
                isDark ? "bg-[#15243a] border-blue-400/80 text-blue-100" : "bg-white border-neutral-300 text-neutral-900"
              )}>
                <SelectValue placeholder="Select separator" />
              </SelectTrigger>
              <SelectContent className={isDark ? "bg-[#0f172acc] border-blue-400" : "bg-white border-neutral-300"}>
                <SelectItem value=",">Comma (,)</SelectItem>
                <SelectItem value=";">Semicolon (;)</SelectItem>
                <SelectItem value="\t">Tab</SelectItem>
                <SelectItem value="|">Pipe (|)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
