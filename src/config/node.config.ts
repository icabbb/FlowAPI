// src/config/node-config.ts
import {
    Globe,
    Braces,
    ListFilter,
    Timer,
    Download,
    Repeat,
    GitBranch,
    Shuffle,
    DatabaseZap,
} from 'lucide-react';

  export type NodeVariant =
    | 'blue'
    | 'lime'
    | 'yellow'
    | 'orange'
    | 'purple'
    | 'red'
    | 'pink'
    | 'cyan'
    | 'green'
    | 'gray';

  interface NodeVisualConfig {
    label: string;
    variant: NodeVariant;
    icon: React.ElementType;
  }

  export const nodeConfigMap: Record<string, NodeVisualConfig> = {
    HttpRequestNode: {
      label: 'HTTP Request',
      variant: 'blue',
      icon: Globe,
    },
    JsonNode: {
      label: 'JSON Viewer',
      variant: 'lime',
      icon: Braces,
    },
    SelectFieldsNode: {
      label: 'Select Fields',
      variant: 'red',
      icon: ListFilter,
    },
    DelayNode: {
      label: 'Delay',
      variant: 'orange',
      icon: Timer,
    },
    ExportNode: {
      label: 'Export',
      variant: 'purple',
      icon: Download,
    },
    LoopNode: {
      label: 'Loop',
      variant: 'green',
      icon: Repeat,
    },
    ConditionalNode: {
      label: 'Conditional',
      variant: 'pink',
      icon: GitBranch,
    },
    TransformNode: {
      label: 'Transform',
      variant: 'cyan',
      icon: Shuffle,
    },
    VariableSetNode: {
        label: 'Set Variable',
        icon: DatabaseZap,
        variant: 'yellow'
      }
  };
