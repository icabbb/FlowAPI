'use client';;
import { useState, useEffect, useCallback } from 'react';
import { useFlowStore } from '@/store/flow-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyValueEditor, type KeyValueEntry } from '@/components/shared/key-value-editor';
import {
  Globe,
  ChevronDown,
  Settings,
  PlusCircle,
  Trash2,
  Check,
  Pencil,
  Lock,
  Shield,
  Loader2,
  Save,
} from 'lucide-react';
import { Environment } from '@/services/storage-service'; // Import Environment type
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // Import cn
import { useTheme } from 'next-themes'; // Import useTheme hook

// Define cartoon button styles (Consistent with other components)
const baseCartoonButtonStyle = "gap-1 rounded-xl border-2 border-neutral-800 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
const primaryCartoonButtonStyle = `${baseCartoonButtonStyle} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
const outlineCartoonButtonStyle = `${baseCartoonButtonStyle} bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-blue-500`;
const destructiveCartoonButtonStyle = `${baseCartoonButtonStyle} bg-red-500 hover:bg-red-600 text-white focus:ring-red-500`;
const iconButtonCartoonStyle = "h-9 w-9 rounded-lg border-2 border-neutral-800 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center";

// Dark theme button styles
const darkCartoonButtonStyle = "gap-1 rounded-xl border-2 border-blue-500 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-60";
const darkPrimaryCartoonButtonStyle = `${darkCartoonButtonStyle} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-400`;
const darkOutlineCartoonButtonStyle = `${darkCartoonButtonStyle} bg-neutral-800 hover:bg-neutral-700 text-blue-300 hover:text-blue-200 focus:ring-blue-400`;
const darkDestructiveCartoonButtonStyle = `${darkCartoonButtonStyle} bg-red-600 hover:bg-red-700 text-white focus:ring-red-400 border-red-500`;
const darkIconButtonCartoonStyle = "h-9 w-9 rounded-lg border-2 border-blue-500 text-blue-400 hover:bg-neutral-800 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-neutral-900 focus:ring-blue-400 shadow-md transition-all duration-200 disabled:opacity-50 flex items-center justify-center";

export function EnvironmentManager() {
  const { 
    environments,
    selectedEnvironmentId,
    loadEnvironments,
    saveEnvironment,
    deleteEnvironment,
    selectEnvironment,
    getActiveEnvironment,
    userId,
    isSaving
  } = useFlowStore();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [envToDelete, setEnvToDelete] = useState<string | null>(null);

  // Load environments on mount
  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  const activeEnvironment = getActiveEnvironment();

  // Handlers for managing environments
  const handleCreateNew = async () => {
    setEditingEnvironment(null); // Clear previous edit state first
    const newEnvData = { name: 'New Environment', variables: [] };
    // Show a temporary state while saving is in progress
    setEditingEnvironment({ 
      ...newEnvData, 
      id: 'new-temp-id', 
      created_at: '', 
      updated_at: '', 
      user_id: userId || 'temp-user'
    }); 
    setIsManageDialogOpen(true);
    
    try {
        const saved = await saveEnvironment(newEnvData);
        if (saved) {
          setEditingEnvironment(saved); // Update with actual saved data
          selectEnvironment(saved.id); // Auto-select the newly created env
        } else {
          // Handle error case - maybe close dialog or show error
          setIsManageDialogOpen(false);
          setEditingEnvironment(null);
        }
    } catch (error) {
        console.error("Error creating environment:", error);
        setIsManageDialogOpen(false);
        setEditingEnvironment(null);
    }
  };

  const handleEdit = (env: Environment) => {
    setEditingEnvironment({ ...env }); // Edit a copy
    setIsManageDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingEnvironment) {
      try {
          await saveEnvironment(editingEnvironment);
          setEditingEnvironment(null);
          setIsManageDialogOpen(false);
          // No explicit loadEnvironments needed if store updates correctly after save
      } catch (error) {
          console.error("Error saving environment:", error);
          // Optionally show an error message to the user
      }
    }
  };

  const handleDelete = async (envId: string) => {
    try {
        await deleteEnvironment(envId);
        setEnvToDelete(null); // Close confirmation dialog
        // If the deleted env was the one being edited, close the edit dialog
        if (editingEnvironment?.id === envId) {
          setIsManageDialogOpen(false);
          setEditingEnvironment(null);
        }
         // No explicit loadEnvironments needed if store updates correctly after delete
    } catch (error) {
        console.error("Error deleting environment:", error);
         // Optionally show an error message to the user
    }

  };

  const handleVariablesChange = useCallback((updatedVariables: KeyValueEntry[]) => {
    if (editingEnvironment) {
      setEditingEnvironment(prev => prev ? { ...prev, variables: updatedVariables } : null);
    }
  }, [editingEnvironment]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingEnvironment) {
      setEditingEnvironment(prev => prev ? { ...prev, name: e.target.value } : null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Dropdown Trigger: Dark or Light Cartoon Style Button */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              isDark 
                ? darkOutlineCartoonButtonStyle
                : outlineCartoonButtonStyle, 
              "px-3 py-2 h-10"
            )}
          >
            <Globe className={cn("h-4 w-4 mr-1.5", isDark ? "text-blue-400" : "")} />
            <span className={cn("truncate max-w-[100px]", isDark ? "text-blue-300" : "")}>
              {activeEnvironment ? activeEnvironment.name : 'No Environment'}
            </span>
            <ChevronDown className={cn("h-4 w-4 opacity-70 ml-auto", isDark ? "text-blue-400" : "")} />
          </Button>
        </DropdownMenuTrigger>
        {/* Dropdown Content: Dark or Light Cartoon Style */}
        <DropdownMenuContent 
          className={cn(
            "w-56 rounded-xl shadow-lg mt-1",
            isDark 
              ? "bg-neutral-900 border-2 border-blue-500 text-blue-300" 
              : "bg-white border-2 border-neutral-800 text-neutral-800"
          )}
        >
          <DropdownMenuLabel className={cn(
            "text-xs px-2.5 py-2 font-semibold",
            isDark ? "text-blue-400" : "text-neutral-500"
          )}>
            Select Environment
          </DropdownMenuLabel>
          <DropdownMenuSeparator className={cn(
            "-mx-1 my-1 h-[2px]",
            isDark ? "bg-blue-500/30" : "bg-neutral-800/20"
          )}/>
          {environments.length === 0 && (
            <DropdownMenuItem disabled className={cn(
              "text-sm italic px-2.5 py-1.5",
              isDark ? "text-blue-400/60" : "text-neutral-400"
            )}>
              No environments created
            </DropdownMenuItem>
          )}
          {/* No Environment Option: Dark or Light Cartoon Style Item */}
          <DropdownMenuItem 
             key="no-env" 
             onSelect={() => selectEnvironment(null)}
             className={cn(
               "text-sm cursor-pointer px-2.5 py-1.5 rounded-lg flex items-center mx-1",
               isDark
                 ? "focus:bg-blue-900/40 focus:text-blue-200"
                 : "focus:bg-blue-100 focus:text-blue-700"
             )}
             disabled={selectedEnvironmentId === null}
          >
            {selectedEnvironmentId === null && (
              <Check className={cn(
                "h-4 w-4 mr-2", 
                isDark ? "text-blue-400" : "text-blue-500"
              )} />
            )} 
            <span className={cn(
              selectedEnvironmentId === null 
                ? "font-semibold" 
                : "pl-6",
              isDark 
                ? selectedEnvironmentId === null ? "text-blue-200" : "text-blue-400" 
                : selectedEnvironmentId === null ? "text-neutral-900" : "text-neutral-700"
            )}>
              No Environment
            </span>
          </DropdownMenuItem>
          {/* Environment List: Dark or Light Cartoon Style Item */}
          {environments.map((env) => (
            <DropdownMenuItem 
              key={env.id} 
              onSelect={() => selectEnvironment(env.id)}
              className={cn(
                "text-sm cursor-pointer px-2.5 py-1.5 rounded-lg flex items-center mx-1",
                isDark
                  ? "focus:bg-blue-900/40 focus:text-blue-200"
                  : "focus:bg-blue-100 focus:text-blue-700"
              )}
              disabled={selectedEnvironmentId === env.id}
            >
             {selectedEnvironmentId === env.id && (
               <Check className={cn(
                 "h-4 w-4 mr-2", 
                 isDark ? "text-blue-400" : "text-blue-500"
               )} />
             )}
              <span className={cn(
                selectedEnvironmentId === env.id 
                  ? "font-semibold" 
                  : "pl-6",
                isDark 
                  ? selectedEnvironmentId === env.id ? "text-blue-200" : "text-blue-400" 
                  : selectedEnvironmentId === env.id ? "text-neutral-900" : "text-neutral-700"
              )}>
                {env.name}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className={cn(
            "-mx-1 my-1 h-[2px]",
            isDark ? "bg-blue-500/30" : "bg-neutral-800/20"
          )}/>
          {/* Manage Environments Trigger: Dark or Light Cartoon Style Item */}
          <DropdownMenuItem 
            onSelect={() => setIsManageDialogOpen(true)} 
            className={cn(
              "text-sm cursor-pointer px-2.5 py-1.5 rounded-lg flex items-center gap-2 mx-1",
              isDark
                ? "focus:bg-blue-900/40 focus:text-blue-200"
                : "focus:bg-blue-100 focus:text-blue-700"
            )}
          >
            <Settings className={isDark ? "h-4 w-4 text-blue-400" : "h-4 w-4"} />
            <span className={isDark ? "text-blue-300" : ""}>Manage Environments</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Manage Environments Dialog: Dark or Light Cartoon Style */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        {/* Dialog Content: Dark or Light Cartoon Style - increased width/height */}
        <DialogContent className={cn(
          "p-0 sm:max-w-4xl h-[85vh] flex flex-col shadow-xl rounded-2xl",
          isDark 
            ? "bg-neutral-900 border-2 border-blue-500 text-blue-200" 
            : "bg-white border-2 border-neutral-800 text-neutral-800"
        )}>
          {/* Dialog Header: Dark or Light Cartoon Style */} 
          <DialogHeader className={cn(
            "p-6 pb-4 flex-shrink-0 border-b-2",
            isDark ? "border-blue-500/50" : "border-neutral-800"
          )}>
            <DialogTitle className={cn(
              "text-xl font-bold",
              isDark ? "text-blue-200" : "text-neutral-800"
            )}>
              Manage Environments
            </DialogTitle>
            <DialogDescription className={cn(
              "text-sm mt-1",
              isDark ? "text-blue-400" : "text-neutral-600"
            )}>
              Create, edit, or delete environments. 
              <span className={cn(
                "inline-flex items-center gap-1 ml-1 font-medium",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}>
                 <Shield className="h-3.5 w-3.5" /> Variables are encrypted.
              </span>
            </DialogDescription>
          </DialogHeader>
          
          {/* Main dialog content area */}
          <div className="flex-grow overflow-hidden flex">
            {/* Environment List Pane (Left) - Dark or Light Cartoon Style */}
            <div className={cn(
              "w-1/3 p-4 flex flex-col gap-2 border-r-2",
              isDark ? "border-blue-500/50" : "border-neutral-800"
            )}>
              {/* Create New Button: Dark or Light Cartoon Style */}
              <Button 
                size="sm" 
                onClick={handleCreateNew}
                className={cn(
                  isDark 
                    ? darkPrimaryCartoonButtonStyle.replace('blue-600', 'cyan-600').replace('blue-700', 'cyan-700').replace('blue-400', 'cyan-400')
                    : baseCartoonButtonStyle + " bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-500",
                  "w-full justify-center py-2.5"
                )}
              >
                <PlusCircle className="h-4 w-4 mr-1.5" /> Create New
              </Button>
              {/* Scrollable List: Dark or Light Cartoon Style */} 
              <div className="flex-grow overflow-y-auto -mr-2 pr-2 space-y-1.5">
                {environments.map((env) => (
                  <Button 
                    key={env.id}
                    variant="ghost" // Use ghost for list items
                    size="sm"
                    onClick={() => handleEdit(env)}
                    className={cn(
                      "w-full justify-start gap-2 font-medium rounded-lg h-9 px-3", // Base list item style
                      isDark
                        ? "focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-neutral-900 text-blue-300 hover:bg-neutral-800 hover:text-blue-200"
                        : "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                      isDark && editingEnvironment?.id === env.id 
                        ? 'bg-blue-900/40 text-blue-200' 
                        : !isDark && editingEnvironment?.id === env.id 
                          ? 'bg-blue-100 text-blue-700' 
                          : '' // Active item style
                    )}
                  >
                    <span className="truncate">{env.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Editing Pane (Right) */} 
            <div className={cn(
              "w-2/3 flex flex-col overflow-hidden p-6",
              isDark ? "bg-neutral-900" : ""
            )}>
              {editingEnvironment ? (
                <div className="flex flex-col h-full">
                  {/* Environment Name Input & Delete Button */} 
                  <div className={cn(
                    "flex items-center justify-between mb-5 pb-3 border-b-2 flex-shrink-0",
                    isDark ? "border-blue-500/50" : "border-neutral-800"
                  )}>
                    {/* Input: Dark or Light Cartoon Style */}
                    <Input 
                      value={editingEnvironment.name}
                      onChange={handleNameChange}
                      placeholder="Environment Name"
                      className={cn(
                        "flex-grow text-lg font-semibold rounded-lg p-2 focus:outline-none shadow-sm h-10",
                        isDark 
                          ? "bg-neutral-800 border-2 border-blue-500/50 text-blue-200 focus:border-blue-400"
                          : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
                      )}
                    />
                    {/* Delete Button Trigger: Dark or Light Cartoon Style Icon Button */}
                    <Dialog open={envToDelete === editingEnvironment.id} onOpenChange={(open) => !open && setEnvToDelete(null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="icon"
                            className={cn(
                              isDark ? darkIconButtonCartoonStyle : iconButtonCartoonStyle,
                              "ml-3 flex-shrink-0",
                              isDark 
                                ? "hover:bg-red-900/40 hover:text-red-400 hover:border-red-500 focus:ring-red-400"
                                : "hover:bg-red-100 hover:text-red-600 focus:ring-red-500"
                            )}
                            onClick={() => setEnvToDelete(editingEnvironment.id)}
                            title="Delete Environment"
                            disabled={editingEnvironment.id === 'new-temp-id'} // Disable delete for unsaved new env
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {/* Delete Confirmation Dialog: Dark or Light Cartoon Style */} 
                        <DialogContent className={cn(
                          "p-0 shadow-xl sm:max-w-md rounded-2xl",
                          isDark 
                            ? "bg-neutral-900 border-2 border-red-500 text-red-200" 
                            : "bg-white border-2 border-neutral-800 text-neutral-800"
                        )}>
                          <DialogHeader className={cn(
                            "p-6 pb-4 border-b-2",
                            isDark ? "border-red-500/50" : "border-neutral-800"
                          )}>
                            <DialogTitle className={cn(
                              "text-xl font-bold",
                              isDark ? "text-red-200" : "text-neutral-800"
                            )}>
                              Delete Environment?
                            </DialogTitle>
                            <DialogDescription className={cn(
                              "text-sm mt-1",
                              isDark ? "text-red-300" : "text-neutral-600"
                            )}>
                              Are you sure you want to delete "<span className={cn(
                                "font-semibold",
                                isDark ? "text-red-200" : "text-neutral-900"
                              )}>{editingEnvironment.name}</span>"? 
                              This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter className={cn(
                            "p-6 pt-4 flex justify-end gap-3",
                            isDark ? "border-t-2 border-red-500/50" : ""
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
                              onClick={() => handleDelete(editingEnvironment.id)} 
                              className={isDark ? darkDestructiveCartoonButtonStyle : destructiveCartoonButtonStyle}
                            >
                              Delete Permanently
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                  </div>
                  
                  {/* Variables Section */} 
                  <div className="flex-grow overflow-y-auto mb-4 -mr-3 pr-3">
                    {/* Title and Tooltip: Dark or Light Cartoon Style */} 
                    <div className="flex items-center mb-3">
                      <h3 className={cn(
                        "text-sm font-semibold uppercase tracking-wider",
                        isDark ? "text-blue-400" : "text-neutral-500"
                      )}>
                        Variables
                      </h3>
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "ml-2 cursor-help",
                              isDark ? "text-emerald-400" : "text-emerald-500"
                            )}>
                              <Lock className="h-4 w-4" />
                            </span>
                          </TooltipTrigger>
                          {/* Tooltip Content: Dark or Light Cartoon Style */}
                          <TooltipContent className={cn(
                            "max-w-xs p-3 text-xs shadow-lg z-50 font-medium rounded-xl",
                            isDark 
                              ? "bg-neutral-800 text-blue-200 border-2 border-blue-500"
                              : "bg-white text-neutral-700 border-2 border-neutral-800"
                          )}>
                            <p>
                              Variable values are automatically encrypted before storage and decrypted when used. 
                              Your secrets are safe!
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {/* KeyValueEditor uses cartoon style internally */} 
                    <KeyValueEditor
                      entries={editingEnvironment.variables}
                      onChange={handleVariablesChange}
                      keyPlaceholder="VARIABLE_NAME"
                      valuePlaceholder="Value (secret or plain text)"
                    />
                  </div>
                  
                  {/* Action Buttons Footer: Dark or Light Cartoon Style */} 
                  <div className={cn(
                    "flex justify-end gap-3 mt-auto pt-4 border-t-2 flex-shrink-0",
                    isDark ? "border-blue-500/50" : "border-neutral-800"
                  )}>
                    <Button 
                      variant="outline" 
                      onClick={() => { setIsManageDialogOpen(false); setEditingEnvironment(null); }} 
                      className={isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle}
                    >
                      Close
                    </Button>
                    <Button 
                      onClick={handleSaveEdit} 
                      className={isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle}
                      disabled={isSaving || editingEnvironment.id === 'new-temp-id'} // Disable save if already saving or it's the temp new env
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin"/> : <Save className="h-4 w-4 mr-1.5"/>}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Empty State: Dark or Light Cartoon Style */ 
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Pencil className={cn(
                    "h-12 w-12 mb-4",
                    isDark ? "text-blue-500/50" : "text-neutral-400"
                  )} />
                  <p className={cn(
                    "text-lg font-semibold",
                    isDark ? "text-blue-300" : "text-neutral-700"
                  )}>
                    Select an environment to edit
                  </p>
                  <p className={cn(
                    "text-sm mt-1 mb-4",
                    isDark ? "text-blue-400" : "text-neutral-500"
                  )}>
                    or create a new one to get started.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={handleCreateNew} 
                    className={cn(
                      isDark 
                        ? darkPrimaryCartoonButtonStyle.replace('blue-600', 'cyan-600').replace('blue-700', 'cyan-700').replace('blue-400', 'cyan-400')
                        : baseCartoonButtonStyle + " bg-cyan-500 hover:bg-cyan-600 text-white focus:ring-cyan-500",
                      "py-2.5"
                    )}
                  >
                     <PlusCircle className="h-4 w-4 mr-1.5" /> Create New Environment
                  </Button>
                </div>
              )}
            </div>
          </div>
          
        </DialogContent>
      </Dialog>
    </>
  );
} 