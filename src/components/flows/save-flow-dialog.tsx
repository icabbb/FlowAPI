'use client';

import { useState, useEffect } from 'react';
import { useFlowStore } from '@/store/flow-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

// Define cartoon button styles
const baseCartoonButtonStyle = "gap-1 rounded-xl border-2 border-neutral-800 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60";
const primaryCartoonButtonStyle = `${baseCartoonButtonStyle} bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500`;
const outlineCartoonButtonStyle = `${baseCartoonButtonStyle} bg-white hover:bg-neutral-100 text-neutral-800 focus:ring-blue-500`;

// Dark mode cartoon button styles
const darkBaseCartoonButtonStyle = "gap-1 rounded-xl border-2 border-blue-400 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-60";
const darkPrimaryCartoonButtonStyle = `${darkBaseCartoonButtonStyle} bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-400`;
const darkOutlineCartoonButtonStyle = `${darkBaseCartoonButtonStyle} bg-neutral-800 hover:bg-neutral-700 text-blue-300 hover:text-blue-200 focus:ring-blue-400`;

interface SaveFlowDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveFlowDialog({ isOpen, onOpenChange }: SaveFlowDialogProps) {
  const { 
    saveCurrentFlow, 
    isSaving, 
    currentFlowName, 
    currentFlowDescription,
    loadSavedFlows // Needed to refresh list after save
  } = useFlowStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      // Initialize with current flow details when dialog opens
      setName(currentFlowName || 'New Flow');
      setDescription(currentFlowDescription || '');
    }
  }, [isOpen, currentFlowName, currentFlowDescription]);

  const handleSave = async () => {
    try {
      const savedFlow = await saveCurrentFlow(name, description);
      if (savedFlow) {
        await loadSavedFlows(); // Refresh the list in FlowManager
        onOpenChange(false); // Close the dialog on successful save
      }
    } catch (error) {
      console.error("Failed to save flow:", error);
      // Handle error (e.g., show toast notification)
    }
  };

  // Close dialog handler
  const handleClose = () => {
    if (!isSaving) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {/* Dialog Content: Cartoon Style with Dark Mode Support */}
      <DialogContent className={cn(
        "sm:max-w-[480px] p-0 rounded-2xl shadow-lg",
        isDark 
          ? "bg-neutral-800 border-2 border-blue-500"
          : "bg-white border-2 border-neutral-800"
      )}>
        {/* Dialog Header: Cartoon Style with Dark Mode Support */}
        <DialogHeader className={cn(
          "p-6 pb-4 border-b-2",
          isDark
            ? "border-blue-500"
            : "border-neutral-800"
        )}>
          <DialogTitle className={cn(
            "text-xl font-bold",
            isDark ? "text-white" : "text-neutral-800"
          )}>
            Save Flow As
          </DialogTitle>
          <DialogDescription className={cn(
            "text-sm pt-1",
            isDark ? "text-blue-200" : "text-neutral-600"
          )}>
            Enter a name and optional description for your flow.
          </DialogDescription>
        </DialogHeader>
        {/* Form Area: Cartoon Style with Dark Mode Support */}
        <div className="p-6 space-y-5">
          <div className="space-y-2">
             {/* Label: Cartoon Style with Dark Mode Support */}
            <Label htmlFor="name" className={cn(
              "text-sm font-semibold",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Flow Name
            </Label>
            {/* Input: Cartoon Style with Dark Mode Support */}
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome API Flow"
              className={cn(
                "nodrag w-full rounded-lg text-sm shadow-sm h-10 px-3 focus:outline-none",
                isDark 
                  ? "bg-neutral-700 border-2 border-blue-500 text-white focus:border-blue-400"
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}
              disabled={isSaving}
            />
          </div>
          <div className="space-y-2">
             {/* Label: Cartoon Style with Dark Mode Support */}
            <Label htmlFor="description" className={cn(
              "text-sm font-semibold",
              isDark ? "text-blue-200" : "text-neutral-700"
            )}>
              Description (Optional)
            </Label>
            {/* Input: Cartoon Style with Dark Mode Support */}
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this flow does"
              className={cn(
                "nodrag w-full rounded-lg text-sm shadow-sm h-10 px-3 focus:outline-none",
                isDark 
                  ? "bg-neutral-700 border-2 border-blue-500 text-white focus:border-blue-400" 
                  : "bg-white border-2 border-neutral-800 text-neutral-800 focus:border-blue-500"
              )}
              disabled={isSaving}
            />
          </div>
        </div>
        {/* Dialog Footer: Cartoon Style with Dark Mode Support */}
        <DialogFooter className={cn(
          "p-6 pt-4 border-t-2 flex justify-end gap-3",
          isDark ? "border-blue-500" : "border-neutral-800"
        )}>
           {/* Cancel Button: Cartoon Outline Style with Dark Mode Support */}
          <Button 
            type="button" 
            onClick={handleClose}
            className={cn(
              isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle
            )}
            disabled={isSaving}
          >
            Cancel
          </Button>
           {/* Save Button: Cartoon Primary Style with Dark Mode Support */}
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={isSaving || !name.trim()}
            className={cn(
              isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle
            )}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Flow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 