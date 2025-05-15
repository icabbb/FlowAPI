'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { SavedFlow } from '@/contracts/types/flow.types';
import {
    Info, Network,
    Database,
    FileText,
    Code2 as FunctionIcon,
    Workflow,
    MessageSquare,
    Terminal,
    Webhook,
    Globe,
    Variable,
    Hammer,
    Code,
    Building,
    Box,
    Circle,
    Filter,
    FolderGit2,
    Settings,
    ShieldAlert,
    LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';

interface SharedSidebarProps {
  flow: SavedFlow;
}

/**
 * Sidebar component for the shared flow view.
 * Displays flow information and available nodes.
 */
export default function SharedSidebar({ flow }: SharedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'nodes'>('info');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Helper function to generate tab button class
  const tabClass = (tab: 'info' | 'nodes') => {
    return cn(
      'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-xl border-b-0 transition-all duration-200',
      activeTab === tab
        ? isDark
          ? 'bg-blue-900/60 text-blue-200 border-2 border-blue-700'
          : 'bg-blue-100 text-blue-800 border-2 border-blue-300'
        : isDark
        ? 'text-blue-300 hover:bg-blue-950/40 hover:text-blue-200'
        : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
      isDark ? 'border-blue-800' : 'border-blue-200'
    );
  };

  // Get icon for node type
  const getNodeTypeIcon = (type: string) => {
    const iconClass = "h-3.5 w-3.5";
    const iconColors = isDark 
      ? "text-blue-400 group-hover:text-blue-300" 
      : "text-neutral-500 group-hover:text-neutral-700";

    switch (type.toLowerCase()) {
      case 'httpnode':
      case 'apifetchnode':
        return <Globe className={cn(iconClass, iconColors)} />;
      case 'jsonnode':
      case 'jsontransformnode':
        return <Code className={cn(iconClass, iconColors)} />;
      case 'databasenode':
        return <Database className={cn(iconClass, iconColors)} />;
      case 'textnode':
        return <FileText className={cn(iconClass, iconColors)} />;
      case 'functionnode':
      case 'javascriptnode':
        return <FunctionIcon className={cn(iconClass, iconColors)} />;
      case 'terminalnode':
      case 'commandnode':
        return <Terminal className={cn(iconClass, iconColors)} />;
      case 'variablesetnode':
      case 'variablegetnode':
        return <Variable className={cn(iconClass, iconColors)} />;
      case 'workflownode':
        return <Workflow className={cn(iconClass, iconColors)} />;
      case 'ainode':
      case 'openaichatnode':
        return <MessageSquare className={cn(iconClass, iconColors)} />;
      case 'webhooknode':
        return <Webhook className={cn(iconClass, iconColors)} />;
      case 'datanode':
        return <Database className={cn(iconClass, iconColors)} />;
      case 'utilitynode':
        return <Hammer className={cn(iconClass, iconColors)} />;
      case 'enterprisenode':
        return <Building className={cn(iconClass, iconColors)} />;
      case 'text':
        return <FileText className={cn(iconClass, iconColors)} />;
      case 'db':
        return <Database className={cn(iconClass, iconColors)} />;
      case 'llm':
        return <MessageSquare className={cn(iconClass, iconColors)} />;
      case 'code':
        return <Terminal className={cn(iconClass, iconColors)} />;
      case 'filter':
        return <Filter className={cn(iconClass, iconColors)} />;
      case 'settings':
        return <Settings className={cn(iconClass, iconColors)} />;
      case 'alert':
        return <ShieldAlert className={cn(iconClass, iconColors)} />;
      case 'grid':
        return <LayoutGrid className={cn(iconClass, iconColors)} />;
      case 'git':
        return <FolderGit2 className={cn(iconClass, iconColors)} />;
      default:
        return <Network className={cn(iconClass, iconColors)} />;
    }
  };

  // Group nodes by type
  const nodeTypeGroups = flow.nodes.reduce((groups, node) => {
    const type = node.type || 'unknown';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(node);
    return groups;
  }, {} as Record<string, any[]>);

  const getStatItem = (label: string, value: string | number) => (
    <div className={cn(
      "flex justify-between items-center py-2 px-3 rounded-lg border transition-colors",
      isDark 
        ? "bg-blue-950/30 border-blue-800 text-blue-200" 
        : "bg-blue-50 border-blue-200 text-blue-700"
    )}>
      <span className="text-sm font-medium">{label}</span>
      <span className={cn(
        "px-2 py-1 rounded-md text-xs font-bold",
        isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
      )}>{value}</span>
    </div>
  );

  return (
    <div className={cn(
      'flex flex-col h-full border-r overflow-hidden',
      isDark 
        ? 'dark-cartoon-sidebar bg-blue-950/30 border-blue-800 text-blue-200' 
        : 'bg-white border-blue-200 text-blue-800'
    )}>
      <div className={cn(
        'flex justify-between items-center p-3 border-b',
        isDark ? 'border-blue-800 bg-blue-900/40' : 'border-blue-200 bg-blue-50'
      )}>
        <h2 className={cn(
          'text-lg font-bold flex items-center',
          isDark ? 'text-blue-200' : 'text-blue-700'
        )}>
          Shared Flow
        </h2>
        <div className={cn(
          'flex items-center px-2 py-1 rounded-lg text-xs font-medium',
          isDark ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-600'
        )}>
          Read Only
        </div>
      </div>
      
      <div className={cn(
        'flex border-b',
        isDark ? 'border-blue-800' : 'border-blue-200'
      )}>
        <button 
          onClick={() => setActiveTab('info')}
          className={tabClass('info')}
        >
          <Info size={16} />
          Flow Info
        </button>
        <button
          onClick={() => setActiveTab('nodes')}
          className={tabClass('nodes')}
        >
          <Box size={16} />
          Nodes
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        {activeTab === 'info' ? (
          <div className="p-4 space-y-4">
            <div className={cn(
              "rounded-xl border p-4 space-y-3",
              isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"
            )}>
              <h3 className={cn(
                "text-base font-bold",
                isDark ? "text-blue-200" : "text-blue-700"
              )}>{flow.name || 'Untitled Flow'}</h3>
              
              <p className={cn(
                "text-sm",
                isDark ? "text-blue-300" : "text-blue-600"
              )}>{flow.description || 'No description provided.'}</p>
              
              <div className={cn(
                "text-xs",
                isDark ? "text-blue-400" : "text-blue-500"
              )}>
                Created: {flow.created_at ? format(new Date(flow.created_at), 'PPP') : 'Unknown'}
                <br />
                Last updated: {flow.updated_at ? format(new Date(flow.updated_at), 'PPP p') : 'Unknown'}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className={cn(
                "text-sm font-semibold",
                isDark ? "text-blue-300" : "text-blue-600"
              )}>Flow Statistics</h4>
              
              <div className="space-y-2">
                {getStatItem('Nodes', flow.nodes.length)}
                {getStatItem('Edges', flow.edges.length)}
                {getStatItem('Node Types', Object.keys(nodeTypeGroups).length)}
              </div>
            </div>
            
            <div className={cn(
              "rounded-xl border p-4 mt-4",
              isDark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200"
            )}>
              <p className={cn(
                "text-sm italic",
                isDark ? "text-blue-300" : "text-blue-600"
              )}>
                This is a read-only view of a shared flow. You can view the flow structure but cannot make changes.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(nodeTypeGroups).map(([type, nodes]) => (
              <div 
                key={type}
                className={cn(
                  "mb-3 rounded-xl overflow-hidden border",
                  isDark ? "border-blue-800" : "border-blue-200"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2",
                  isDark ? "bg-blue-900/40 text-blue-200" : "bg-blue-100 text-blue-700"
                )}>
                  {getNodeTypeIcon(type)}
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <span className={cn(
                    "ml-auto px-1.5 py-0.5 text-xs rounded-full",
                    isDark ? "bg-blue-800 text-blue-300" : "bg-blue-200 text-blue-700"
                  )}>{nodes.length}</span>
                </div>
                
                <div className={cn(
                  isDark ? "bg-blue-950/30" : "bg-blue-50/50"
                )}>
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-opacity-80 transition-colors",
                        isDark 
                          ? "hover:bg-blue-900/30 text-blue-300" 
                          : "hover:bg-blue-100 text-blue-600",
                        node.selected && (isDark 
                          ? "bg-blue-800/50 text-blue-200" 
                          : "bg-blue-200/70 text-blue-700")
                      )}
                    >
                      <Circle size={8} className={isDark ? "text-blue-400" : "text-blue-500"} />
                      <span className="truncate">{node.data?.label || node.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className={cn(
        "p-3 border-t",
        isDark ? "border-blue-800 bg-blue-900/20" : "border-blue-200 bg-blue-50"
      )}>
        <div className={cn(
          "rounded-lg border p-2 text-xs",
          isDark ? "border-blue-700 bg-blue-900/30 text-blue-300" : "border-blue-300 bg-blue-100/50 text-blue-600"
        )}>
          <p>Viewing in read-only mode</p>
        </div>
      </div>
    </div>
  );
} 