'use client';;
import { useState, useRef, useEffect, useMemo } from 'react';
import { useFlowStore } from '@/store/flow-store';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  Folder,
  FolderOpen,
  Trash2,
  Download,
  Upload,
  PlusCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { SavedFlow } from '@/services/storage-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { useTheme } from 'next-themes';

// Format date for display
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    // Use a slightly more concise format
    return format(date, 'MMM d, yy HH:mm');
  } catch (e) {
    return 'Invalid date';
  }
};

// Cartoon style definitions
const baseCartoonButtonStyle = "gap-1 rounded-xl border-2 border-neutral-800 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
const primaryCartoonButtonStyle = `${baseCartoonButtonStyle} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
const outlineCartoonButtonStyle = `${baseCartoonButtonStyle} bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-blue-500`;
const destructiveCartoonButtonStyle = `${baseCartoonButtonStyle} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`;
const iconButtonCartoonStyle = "h-8 w-8 rounded-lg border-2 border-neutral-800 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center";
const ghostButtonCartoonStyle = "h-8 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 flex items-center justify-center px-2";

// Dark theme button styles
const darkCartoonButtonStyle = "gap-1 rounded-xl border-2 border-blue-500 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-60";
const darkPrimaryCartoonButtonStyle = `${darkCartoonButtonStyle} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400`;
const darkOutlineCartoonButtonStyle = `${darkCartoonButtonStyle} bg-neutral-800 hover:bg-neutral-700 text-blue-300 hover:text-blue-200 focus:ring-blue-400`;
const darkDestructiveCartoonButtonStyle = `${darkCartoonButtonStyle} bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 border-red-500`;
const darkIconButtonCartoonStyle = "h-8 w-8 rounded-lg border-2 border-blue-500 text-blue-400 hover:bg-neutral-800 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-neutral-900 focus:ring-blue-400 shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center";
const darkGhostButtonCartoonStyle = "h-8 rounded-lg text-blue-400 hover:bg-neutral-800 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 flex items-center justify-center px-2";

export function FlowManager() {
  const { 
    savedFlows, 
    loadSavedFlows, 
    saveCurrentFlow, 
    loadFlow, 
    deleteFlow, 
    createNewFlow, 
    exportCurrentFlow,
    importFlow,
    currentFlowId,
    currentFlowName,
    currentFlowDescription,
    currentFlowCollection,
    setCurrentFlowMetadata,
    isSaving,
    isLoading,
  } = useFlowStore();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null); // null represents "All Flows"
  
  // Local state for save form
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveCollection, setSaveCollection] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Initialize load flows on mount
  useEffect(() => {
    loadSavedFlows();
  }, [loadSavedFlows]);
  
  // Update the form when the drawer opens or currentFlow changes
  useEffect(() => {
    if (isDrawerOpen) {
      setSaveName(currentFlowName || '');
      setSaveDescription(currentFlowDescription || '');
      setSaveCollection(currentFlowCollection || '');
      setIsCreatingCollection(false);
    }
    loadSavedFlows();
  }, [currentFlowName, currentFlowDescription, currentFlowCollection, isDrawerOpen, loadSavedFlows]);

  // Extract unique collection names for dropdown/grouping
  const existingCollections = useMemo(() => {
    const collections = new Set<string>();
    savedFlows.forEach(flow => {
      if (flow.collections) {
        collections.add(flow.collections);
      }
    });
    return Array.from(collections).sort(); // Sort alphabetically
  }, [savedFlows]);

  // Group flows by collection for display
  const groupedFlows = useMemo(() => {
    const groups: Record<string, SavedFlow[]> = {uncategorized: []};
    existingCollections.forEach(col => groups[col] = []);

    savedFlows.forEach(flow => {
      if (flow.collections && groups[flow.collections]) {
        groups[flow.collections].push(flow);
      } else {
        groups.uncategorized.push(flow);
      }
    });
    return groups;
  }, [savedFlows, existingCollections]);

  // Filter flows based on selected collection for the right panel
  const displayedFlows = useMemo(() => {
    if (selectedCollection === null) {
      // Show all flows if "All" is selected
      return savedFlows;
    }
    // Show uncategorized flows
    if (selectedCollection === '__UNCATEGORIZED__') {
        return groupedFlows.uncategorized || [];
    }
    // Show flows from a specific collection
    return groupedFlows[selectedCollection] || [];
  }, [selectedCollection, savedFlows, groupedFlows]);

  // Handler for saving the current flow
  const handleSaveFlow = async () => {
    await saveCurrentFlow(saveName, saveDescription, saveCollection || null);
    setIsSaveDialogOpen(false);
  };
  
  // Handler for importing a flow from file
  const handleImportFlow = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await importFlow(file);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Error importing flow:', error);
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handler for creating a new flow
  const handleCreateNewFlow = () => {
    createNewFlow();
    setIsDrawerOpen(false);
  };
  
  // Handler for loading a flow
  const handleLoadFlow = (flowId: string) => {
    loadFlow(flowId);
    setIsDrawerOpen(false);
  };
  
  // Handler for deleting a flow
  const handleDeleteFlow = (flowId: string) => {
    deleteFlow(flowId);
    setFlowToDelete(null);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const confirmDeleteFlow = async () => {
    if (flowToDelete) {
      try {
        await deleteFlow(flowToDelete);
        console.log("Flow deleted successfully:", flowToDelete);
        setFlowToDelete(null); // Close dialog
      } catch (error) {
        console.error("Error deleting flow:", error);
        // Add user feedback
      }
    }
  };

  return (
    <>
      {/* Main Drawer Trigger: Dark or Light Cartoon style */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              isDark 
                ? darkOutlineCartoonButtonStyle
                : outlineCartoonButtonStyle, 
              "h-9 py-1.5 gap-1.5"
            )}
          >
            <Folder className={cn("h-4 w-4", isDark ? "text-blue-400" : "")} /> 
            <span className={isDark ? "text-blue-300" : ""}>Flows</span>
          </Button>
        </DrawerTrigger>
        
        {/* Drawer Content: Dark or Light Cartoon style with appropriate background */}
        <DrawerContent className={cn(
          "border-t-2 shadow-lg",
          isDark 
            ? "bg-neutral-900 text-blue-200 border-blue-500" 
            : "bg-white text-neutral-800 border-neutral-800"
        )}>
          {/* Consistent padding, max-width, use vh for height */}
          <div className="mx-auto w-full max-w-6xl p-6 flex flex-col h-[85vh]">
            {/* Drawer Header: Dark or Light Cartoon style */}
            <DrawerHeader className="p-0 mb-4 flex-shrink-0">
              <DrawerTitle className={cn(
                "text-lg font-bold flex items-center gap-2",
                isDark ? "text-blue-200" : "text-neutral-800"
              )}>
                <FolderOpen className={cn(
                  "h-5 w-5", 
                  isDark ? "text-blue-400" : "text-blue-600"
                )} /> 
                Manage Flows
              </DrawerTitle>
              <DrawerDescription className={cn(
                "mt-1",
                isDark ? "text-blue-400" : "text-neutral-600"
              )}>
                Save, load, import, and export your data flows.
              </DrawerDescription>
            </DrawerHeader>
            
            {/* Main Content Area: Flex row for two columns */}
            <div className="flex-grow flex gap-6 overflow-hidden">

              {/* Left Column: Collections List & Actions */}
              <div className="w-1/4 lg:w-1/5 flex flex-col gap-3 flex-shrink-0 border-r-2 border-neutral-200 pr-5">
                {/* Cartoon style header */}
                <h3 className={cn(
                  "text-sm font-bold px-1 mb-1",
                  isDark ? "text-blue-400" : "text-neutral-600"
                )}>COLLECTIONS</h3>
                {/* Create New Flow Button: Dark or Light Cartoon style */}
                <Button
                    size="sm"
                    onClick={handleCreateNewFlow}
                    className={cn(
                      isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle, 
                      "w-full justify-center gap-1.5 h-10"
                    )}
                >
                    <PlusCircle className="h-4 w-4" /> Create New Flow
                </Button>
                {/* Scrollable Collection List with dark or light cartoon styling */} 
                <div className="flex-grow overflow-y-auto space-y-1.5 -mr-3 pr-3">
                   {/* "All Flows" Item: Dark or Light Cartoon style */}
                   <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setSelectedCollection(null)}
                       className={cn(
                          "w-full h-9 justify-start gap-2 rounded-lg text-sm font-medium",
                          isDark
                            ? "text-blue-300 hover:bg-neutral-800" 
                            : "text-neutral-700 hover:bg-neutral-100",
                          isDark && selectedCollection === null 
                            ? 'bg-blue-900/40 text-blue-200 font-semibold border-2 border-blue-500/50' 
                            : !isDark && selectedCollection === null 
                              ? 'bg-blue-100 text-blue-800 font-semibold border-2 border-blue-300' 
                              : ''
                       )}
                   >
                       <FolderOpen className={cn(
                         "h-4 w-4", 
                         isDark ? "text-blue-400" : "text-blue-600"
                       )}/> All Flows
                   </Button>
                   {/* Uncategorized Item: Dark or Light Cartoon style */}
                   <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setSelectedCollection('__UNCATEGORIZED__')}
                       className={cn(
                          "w-full h-9 justify-start gap-2 rounded-lg text-sm font-medium",
                          isDark
                            ? "text-blue-400/70 hover:bg-neutral-800" 
                            : "text-neutral-600 hover:bg-neutral-100",
                          isDark && selectedCollection === '__UNCATEGORIZED__' 
                            ? 'bg-neutral-800 text-blue-300 font-semibold border-2 border-neutral-700' 
                            : !isDark && selectedCollection === '__UNCATEGORIZED__' 
                              ? 'bg-neutral-100 text-neutral-800 font-semibold border-2 border-neutral-300'
                              : ''
                       )}
                   >
                      <Folder className={cn(
                        "h-4 w-4",
                        isDark ? "text-blue-400/70" : "text-neutral-500"
                      )}/> <span className="italic">Uncategorized</span>
                   </Button>
                   <div className={cn(
                     "my-2 border-t-2",
                     isDark ? "border-neutral-700" : "border-neutral-200"
                   )}></div> {/* Dark or Light Cartoon style separator */}
                   {/* Dynamic Collection Items: Dark or Light Cartoon style */}
                   {existingCollections.map(col => (
                      <Button
                         key={col}
                         variant="ghost"
                         size="sm"
                         onClick={() => setSelectedCollection(col)}
                         className={cn(
                            "w-full h-9 justify-start gap-2 rounded-lg text-sm font-medium",
                            isDark
                              ? "text-blue-300 hover:bg-neutral-800" 
                              : "text-neutral-700 hover:bg-neutral-100",
                            isDark && selectedCollection === col 
                              ? 'bg-cyan-900/40 text-cyan-200 font-semibold border-2 border-cyan-700/50' 
                              : !isDark && selectedCollection === col 
                                ? 'bg-cyan-100 text-cyan-800 font-semibold border-2 border-cyan-300' 
                                : ''
                         )}
                      >
                         <Folder className={cn(
                           "h-4 w-4 flex-shrink-0",
                           isDark ? "text-cyan-400" : "text-cyan-600"
                         )}/> <span className="truncate flex-1 text-left">{col}</span>
                      </Button>
                   ))}
                </div>
                 {/* Import/Export: Dark or Light Cartoon style */}
                 <div className={cn(
                   "mt-auto flex flex-col gap-2 pt-3 pb-2 border-t-2",
                   isDark ? "border-neutral-700" : "border-neutral-200"
                 )}>
                     <Button
                        size="sm"
                        variant="outline"
                        onClick={exportCurrentFlow}
                        className={cn(
                          isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle, 
                          "w-full justify-center gap-1.5 h-9"
                        )}
                      >
                        <Download className={isDark ? "h-4 w-4 text-blue-400" : "h-4 w-4"} /> 
                        <span className={isDark ? "text-blue-300" : ""}>Export Current</span>
                      </Button>
                     <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsImportDialogOpen(true)}
                        className={cn(
                          isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle, 
                          "w-full justify-center gap-1.5 h-9"
                        )}
                      >
                        <Upload className={isDark ? "h-4 w-4 text-blue-400" : "h-4 w-4"} /> 
                        <span className={isDark ? "text-blue-300" : ""}>Import Flow</span>
                      </Button>
                 </div>
              </div>

              {/* Right Column: Filtered Flows List */}
              <div className="flex-grow flex flex-col overflow-hidden">
                 {/* Header for the right panel: Dark or Light Cartoon style */}
                 <div className="flex items-center justify-between mb-4 flex-shrink-0">
                   <h3 className={cn(
                     "text-base font-bold truncate",
                     isDark ? "text-blue-200" : "text-neutral-800"
                   )}>
                     {selectedCollection === null ? 'All Flows' : selectedCollection === '__UNCATEGORIZED__' ? 'Uncategorized' : selectedCollection}
                   </h3>
                   {/* Quick Save Button: Dark or Light Cartoon style */}
                   <Button
                        size="sm"
                        onClick={() => setIsSaveDialogOpen(true)}
                        className={cn(
                          isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle, 
                          "gap-1.5 h-9"
                        )}
                        disabled={isSaving}
                        title="Save Current Flow"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save Current
                    </Button>
                 </div>

                 {/* Scrollable Flow Table: Dark or Light Cartoon style */}
                 <div className={cn(
                   "flex-grow overflow-y-auto rounded-xl shadow-md mb-2 border-2",
                   isDark 
                     ? "bg-neutral-900 border-blue-500/50" 
                     : "bg-white border-neutral-800"
                 )}>
                    {displayedFlows.length > 0 ? (
                      <Table>
                         {/* Sticky Header: Dark or Light Cartoon style */}
                         <TableHeader className={cn(
                           "sticky top-0 z-10",
                           isDark ? "bg-neutral-800" : "bg-neutral-100"
                         )}>
                            <TableRow className={cn(
                              "hover:bg-transparent border-b-2",
                              isDark ? "border-neutral-700" : "border-neutral-300"
                            )}>
                              {/* Dark or Light Cartoon style header cells */}
                              <TableHead className={cn(
                                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider",
                                isDark ? "text-blue-400" : "text-neutral-600"
                              )}>Name</TableHead>
                              <TableHead className={cn(
                                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider hidden md:table-cell",
                                isDark ? "text-blue-400" : "text-neutral-600"
                              )}>Description</TableHead>
                              <TableHead className={cn(
                                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider hidden sm:table-cell",
                                isDark ? "text-blue-400" : "text-neutral-600"
                              )}>Modified</TableHead>
                              <TableHead className={cn(
                                "px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-right",
                                isDark ? "text-blue-400" : "text-neutral-600"
                              )}>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className={cn(
                            "divide-y-2",
                            isDark ? "divide-neutral-800" : "divide-neutral-200"
                          )}>
                            {displayedFlows.map((flow) => (
                              <TableRow key={flow.id} className={cn(
                                isDark 
                                  ? currentFlowId === flow.id 
                                    ? "bg-blue-900/30 hover:bg-blue-900/40" 
                                    : "hover:bg-neutral-800/50"
                                  : currentFlowId === flow.id 
                                    ? "bg-blue-50 hover:bg-blue-100" 
                                    : "hover:bg-neutral-50"
                              )}>
                                <TableCell className={cn(
                                  "px-4 py-3 font-medium w-1/3",
                                  isDark ? "text-blue-200" : "text-neutral-800"
                                )}>
                                  <div className="flex items-center gap-2">
                                    <span className="truncate" title={flow.name}>{flow.name}</span>
                                    {currentFlowId === flow.id && (
                                      <Badge className={cn(
                                        "ml-auto text-xs rounded-full px-2 py-0.5 whitespace-nowrap font-semibold",
                                        isDark
                                          ? "bg-blue-900/80 text-blue-200 border-2 border-blue-700" 
                                          : "bg-blue-100 text-blue-800 border-2 border-blue-300"
                                      )}>
                                        Current
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className={cn(
                                  "px-4 py-3 text-sm hidden md:table-cell max-w-xs truncate",
                                  isDark ? "text-blue-300" : "text-neutral-600"
                                )}>
                                  {flow.description || <span className={cn(
                                    "italic",
                                    isDark ? "text-blue-400/60" : "text-neutral-400"
                                  )}>No description</span>}
                                </TableCell>
                                <TableCell className={cn(
                                  "px-4 py-3 text-sm hidden sm:table-cell whitespace-nowrap",
                                  isDark ? "text-blue-300" : "text-neutral-600"
                                )}>
                                  {formatDate(flow.updated_at)}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-right">
                                    {/* Action buttons: Dark or Light Cartoon style */}
                                    <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleLoadFlow(flow.id)}
                                      className={cn(
                                        isDark 
                                          ? darkIconButtonCartoonStyle + " hover:bg-blue-900/50 hover:text-blue-200 text-blue-400" 
                                          : iconButtonCartoonStyle + " hover:bg-blue-50 hover:text-blue-800 text-blue-600"
                                      )}
                                      title="Load flow"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Dialog open={flowToDelete === flow.id} onOpenChange={(open) => !open && setFlowToDelete(null)}>
                                      <DialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setFlowToDelete(flow.id)}
                                          className={cn(
                                            isDark 
                                              ? darkIconButtonCartoonStyle + " hover:bg-red-900/50 hover:text-red-300 text-red-400 hover:border-red-500" 
                                              : iconButtonCartoonStyle + " hover:bg-red-50 hover:text-red-800 text-red-600"
                                          )}
                                          title="Delete flow"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className={cn(
                                        "p-6 shadow-xl rounded-xl",
                                        isDark 
                                          ? "bg-neutral-900 border-2 border-red-500 text-red-200" 
                                          : "bg-white border-2 border-neutral-800 text-neutral-800"
                                      )}>
                                        <DialogHeader className="pb-4">
                                          <DialogTitle className={cn(
                                            "text-lg font-bold",
                                            isDark ? "text-red-200" : "text-neutral-800"
                                          )}>Are you sure?</DialogTitle>
                                          <DialogDescription className={cn(
                                            "text-sm mt-1",
                                            isDark ? "text-red-300" : "text-neutral-600"
                                          )}>
                                            This will permanently delete the flow "<span className={cn(
                                              "font-semibold",
                                              isDark ? "text-red-200" : "text-neutral-800"
                                            )}>{flow.name}</span>".
                                            This action cannot be undone.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter className={cn(
                                          "pt-4 gap-2 border-t-2",
                                          isDark ? "border-red-500/50" : "border-neutral-300"
                                        )}>
                                          <Button
                                            variant="outline"
                                            onClick={() => setFlowToDelete(null)}
                                            className={isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle}
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={confirmDeleteFlow}
                                            className={isDark ? darkDestructiveCartoonButtonStyle : destructiveCartoonButtonStyle}
                                          >
                                            Delete Permanently
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                    </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                      </Table>
                    ) : (
                      /* Empty State for the selected collection: Dark or Light Cartoon style */
                      <div className={cn(
                        "flex items-center justify-center h-full text-center p-6",
                        isDark ? "text-blue-400" : "text-neutral-500"
                      )}>
                        <p className="text-sm">No flows found in this collection.</p>
                      </div>
                    )}
                 </div>
              </div>
            </div>

            {/* Footer: Dark or Light Cartoon style */}
            <DrawerFooter className={cn(
              "pt-4 mt-auto border-t-2 flex-shrink-0",
              isDark ? "border-blue-500/50" : "border-neutral-200"
            )}>
              <DrawerClose asChild>
                <Button 
                  variant="outline" 
                  className={isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle}
                >
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Save Flow Dialog: Dark or Light Cartoon style */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className={cn(
          "p-6 sm:max-w-lg shadow-xl rounded-xl",
          isDark 
            ? "bg-neutral-900 border-2 border-blue-500 text-blue-200" 
            : "bg-white border-2 border-neutral-800 text-neutral-800"
        )}>
          <DialogHeader className={cn(
            "pb-4 mb-2 border-b-2",
            isDark ? "border-blue-500/50" : "border-neutral-300"
          )}>
            <DialogTitle className={cn(
              "text-base font-bold",
              isDark ? "text-blue-200" : "text-neutral-800"
            )}>Save Flow</DialogTitle>
            <DialogDescription className={cn(
              "text-sm mt-1",
              isDark ? "text-blue-400" : "text-neutral-600"
            )}>
              Assign a name, collection, and optional description.
            </DialogDescription>
          </DialogHeader>
          
          {/* Adjusted spacing with Dark or Light cartoon styling */}
          <div className="space-y-4 py-2">
            {/* Name field: Dark or Light Cartoon style */}
            <div className="space-y-1.5">
              <Label htmlFor="flow-name" className={cn(
                "text-sm font-semibold",
                isDark ? "text-blue-300" : "text-neutral-700"
              )}>Name</Label>
              <Input
                id="flow-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., User Authentication Flow"
                className={cn(
                  "rounded-lg focus:ring-2 h-10",
                  isDark 
                    ? "bg-neutral-800 border-2 border-blue-500/50 text-blue-200 focus:ring-blue-400 focus:border-blue-400"
                    : "bg-white border-2 border-neutral-800 text-neutral-800 focus:ring-blue-500 focus:border-blue-500"
                )}
              />
            </div>

            {/* Collection field: Dark or Light Cartoon style */}
            <div className="space-y-1.5">
              <Label htmlFor="flow-collection" className={cn(
                "text-sm font-semibold",
                isDark ? "text-blue-300" : "text-neutral-700"
              )}>Collection</Label>
              {isCreatingCollection ? (
                 <div className="flex items-center gap-2">
                   <Input
                    id="flow-collection-new"
                    value={saveCollection}
                    onChange={(e) => setSaveCollection(e.target.value)}
                    placeholder="New collection name"
                    className={cn(
                      "flex-grow rounded-lg focus:ring-2 h-10",
                      isDark 
                        ? "bg-neutral-800 border-2 border-blue-500/50 text-blue-200 focus:ring-blue-400 focus:border-blue-400"
                        : "bg-white border-2 border-neutral-800 text-neutral-800 focus:ring-blue-500 focus:border-blue-500"
                    )}
                  />
                  {/* Cancel button: Dark or Light Cartoon style */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCreatingCollection(false)} 
                    className={cn(
                      "text-xs h-9 px-2 rounded-lg",
                      isDark 
                        ? "text-blue-400 hover:bg-neutral-800 hover:text-blue-300" 
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                    )}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Select
                  value={saveCollection || "__NONE__"}
                  onValueChange={(value) => {
                    if (value === '__CREATE_NEW__') {
                      setIsCreatingCollection(true);
                      setSaveCollection('');
                    } else {
                      setSaveCollection(value === '__NONE__' ? '' : value);
                    }
                  }}
                >
                  {/* Trigger: Dark or Light Cartoon style */}
                  <SelectTrigger id="flow-collection" className={cn(
                    "rounded-lg h-10 focus:ring-2",
                    isDark 
                      ? "bg-neutral-800 border-2 border-blue-500/50 text-blue-200 focus:ring-blue-400 focus:border-blue-400"
                      : "bg-white border-2 border-neutral-800 text-neutral-800 focus:ring-blue-500 focus:border-blue-500"
                  )}>
                    <SelectValue placeholder="Select or create collection..." />
                  </SelectTrigger>
                  {/* Content/items: Dark or Light Cartoon style */}
                  <SelectContent className={cn(
                    "rounded-lg shadow-xl",
                    isDark 
                      ? "bg-neutral-800 border-2 border-blue-500 text-blue-200" 
                      : "bg-white border-2 border-neutral-800 text-neutral-800"
                  )}>
                    <SelectItem value="__NONE__" className={cn(
                      "italic cursor-pointer",
                      isDark ? "text-blue-400 hover:bg-neutral-700" : "text-neutral-500 hover:bg-neutral-100"
                    )}>No Collection</SelectItem>
                    <SelectSeparator className={isDark ? "bg-blue-500/30" : "bg-neutral-300"} />
                    {existingCollections.map(col => (
                      <SelectItem 
                        key={col} 
                        value={col} 
                        className={cn(
                          "cursor-pointer",
                          isDark ? "hover:bg-neutral-700" : "hover:bg-neutral-100"
                        )}
                      >
                        {col}
                      </SelectItem>
                    ))}
                    <SelectSeparator className={isDark ? "bg-blue-500/30" : "bg-neutral-300"}/>
                    <SelectItem 
                      value="__CREATE_NEW__" 
                      className={cn(
                        "cursor-pointer flex items-center gap-1.5",
                        isDark ? "text-blue-400 hover:bg-neutral-700" : "text-blue-600 hover:bg-neutral-100"
                      )}
                    >
                      <PlusCircle className="h-4 w-4"/> Create New...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Description field: Dark or Light Cartoon style */}
            <div className="space-y-1.5">
              <Label htmlFor="flow-description" className={cn(
                "text-sm font-semibold",
                isDark ? "text-blue-300" : "text-neutral-700"
              )}>
                Description <span className={isDark ? "text-blue-400/70" : "text-neutral-500"}>(Optional)</span>
              </Label>
              <Textarea
                id="flow-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Describe what this flow does..."
                className={cn(
                  "rounded-lg focus:ring-2 min-h-[70px] text-sm",
                  isDark 
                    ? "bg-neutral-800 border-2 border-blue-500/50 text-blue-200 focus:ring-blue-400 focus:border-blue-400"
                    : "bg-white border-2 border-neutral-800 text-neutral-800 focus:ring-blue-500 focus:border-blue-500"
                )}
              />
            </div>
          </div>
          
          {/* Footer buttons: Dark or Light Cartoon style */}
          <DialogFooter className={cn(
            "pt-5 mt-3 gap-2 border-t-2",
            isDark ? "border-blue-500/50" : "border-neutral-300"
          )}>
             <DialogClose asChild>
                <Button 
                  variant="outline" 
                  className={isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle}
                >
                  Cancel
                </Button>
            </DialogClose>
            <Button
              onClick={handleSaveFlow}
              disabled={!saveName.trim() || isSaving}
              className={isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Flow'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Flow Dialog: Dark or Light Cartoon style */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className={cn(
          "p-6 sm:max-w-lg shadow-xl rounded-xl",
          isDark 
            ? "bg-neutral-900 border-2 border-blue-500 text-blue-200" 
            : "bg-white border-2 border-neutral-800 text-neutral-800"
        )}>
          <DialogHeader className={cn(
            "pb-4 mb-2 border-b-2",
            isDark ? "border-blue-500/50" : "border-neutral-300"
          )}>
            <DialogTitle className={cn(
              "text-base font-bold",
              isDark ? "text-blue-200" : "text-neutral-800"
            )}>Import Flow</DialogTitle>
            <DialogDescription className={cn(
              "text-sm mt-1",
              isDark ? "text-blue-400" : "text-neutral-600"
            )}>
              Select a `.json` file exported from this application.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="flow-import" className={cn(
              "text-sm font-semibold mb-1.5 block",
              isDark ? "text-blue-300" : "text-neutral-700"
            )}>Flow File (.json)</Label>
            {/* File input: Dark or Light Cartoon style */}
            <Input
              ref={fileInputRef}
              id="flow-import"
              type="file"
              accept=".json,application/json"
              onChange={handleImportFlow}
              className={cn(
                "rounded-lg focus:ring-2 cursor-pointer",
                isDark 
                  ? "bg-neutral-800 border-2 border-blue-500/50 text-blue-300 focus:ring-blue-400 focus:border-blue-400 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-r-2 file:border-r-blue-500/50 file:border-y-0 file:border-l-0 file:text-sm file:font-medium file:bg-neutral-700 file:text-blue-300 hover:file:bg-neutral-600"
                  : "bg-white border-2 border-neutral-800 text-neutral-700 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-r-2 file:border-r-neutral-800 file:border-y-0 file:border-l-0 file:text-sm file:font-medium file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200"
              )}
            />
          </div>
          
          <DialogFooter className={cn(
            "pt-5 mt-3 gap-2 border-t-2",
            isDark ? "border-blue-500/50" : "border-neutral-300"
          )}>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className={isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle}
              >
                Cancel
              </Button>
            </DialogClose>
            {/* Import happens on change, no primary action needed here */}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}