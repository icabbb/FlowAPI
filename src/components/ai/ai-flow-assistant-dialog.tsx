'use client';

import { useState } from 'react';
import { useFlowStore } from '@/store/index';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Node, Edge } from '@xyflow/react'; // Import Node and Edge types

interface AiFlowAssistantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AiResponse {
  explanation: string;
  flow: {
    nodes: Node[];
    edges: Edge[];
  } | null;
}

export function AiFlowAssistantDialog({ isOpen, onOpenChange }: AiFlowAssistantDialogProps) {
  const { addNode, addEdge } = useFlowStore(); // Get functions to add nodes/edges
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserInput(event.target.value);
  };

  const handleGenerateClick = async () => {
    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      // Call the backend API route
      const response = await fetch('/api/ai-flow-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Basic validation
      if (!data || !data.explanation || !data.flow || !Array.isArray(data.flow.nodes) || !Array.isArray(data.flow.edges)) {
        throw new Error('Invalid response structure from AI assistant.');
      }
      setAiResponse(data);

    } catch (err: any) {
    
      setError(err.message || 'Failed to generate flow proposal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCanvasClick = () => {
    if (aiResponse?.flow?.nodes && aiResponse.flow.edges) {
      // TODO: Implement intelligent positioning logic if needed
      aiResponse.flow.nodes.forEach(node => addNode(node));
      aiResponse.flow.edges.forEach(edge => addEdge(edge));
      handleClose(); // Close dialog after adding
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUserInput(''); // Reset input on close
      setAiResponse(null);
      setError(null);
      onOpenChange(false);
    }
  };

  // --- Style Helpers ---
  const getInputClass = () => cn(
      "nodrag w-full rounded-lg text-sm shadow-sm focus:outline-none border-2 min-h-[100px] p-3",
      isDark
        ? "bg-neutral-700 border-purple-500 text-white focus:border-purple-400 placeholder:text-neutral-400"
        : "bg-white border-neutral-800 text-neutral-800 focus:border-purple-500 placeholder:text-neutral-500"
  );
  const getLabelClass = () => cn(
      "text-sm font-semibold mb-1.5 block",
      isDark ? "text-purple-200" : "text-neutral-700"
  );
  const darkPrimaryCartoonButtonStyle = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-60",
    "border-purple-400 bg-purple-600 hover:bg-purple-500 text-white focus:ring-purple-400"
  );
   const darkOutlineCartoonButtonStyle = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:opacity-60",
    "border-purple-400 bg-neutral-800 hover:bg-neutral-700 text-purple-300 hover:text-purple-200 focus:ring-purple-400"
  );
  const primaryCartoonButtonStyle = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60",
    "border-neutral-800 bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
  );
  const outlineCartoonButtonStyle = cn(
    "gap-1 rounded-xl border-2 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60",
    "border-neutral-800 bg-white hover:bg-neutral-100 text-purple-800 focus:ring-purple-500"
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "sm:max-w-lg p-0 rounded-2xl shadow-lg",
        isDark 
          ? "bg-neutral-800 border-2 border-purple-500 text-white"
          : "bg-white border-2 border-neutral-800 text-neutral-800"
      )}>
        <DialogHeader className={cn(
          "p-6 pb-4 border-b-2 flex flex-row items-center gap-3",
          isDark ? "border-purple-500" : "border-neutral-800"
        )}>
          <Wand2 className={cn("h-6 w-6 flex-shrink-0", isDark ? "text-purple-300" : "text-purple-600")} />
          <div>
            <DialogTitle className={cn("text-xl font-bold", isDark ? "text-white" : "text-neutral-800")}>
              AI Flow Assistant
            </DialogTitle>
            <DialogDescription className={cn("text-sm pt-0.5", isDark ? "text-purple-200" : "text-neutral-600")}>
              Describe the flow you want to build.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label htmlFor="userInput" className={getLabelClass()}>Your Request</label>
            <Textarea
              id="userInput"
              value={userInput}
              onChange={handleInputChange}
              placeholder="e.g., Login at /auth, save token from response (data.token), then GET /profile using the token as Bearer."
              className={getInputClass()}
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center space-x-2 p-4 text-sm text-purple-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating proposal...</span>
            </div>
          )}

          {error && (
            <div className={cn("p-3 text-sm rounded-xl flex items-center gap-2 shadow-sm", isDark ? "bg-red-900/30 border-2 border-red-700 text-red-300" : "bg-red-100 border-2 border-red-700 text-red-800")}>
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {aiResponse && (
            <div className={cn("p-4 space-y-2 rounded-lg border-2 shadow-inner", isDark ? "bg-neutral-700/50 border-purple-500/50" : "bg-purple-50/50 border-neutral-300")}>
              <h4 className={cn("text-sm font-semibold", isDark ? "text-purple-200" : "text-purple-700")}>Assistant's Proposal:</h4>
              <p className={cn("text-sm", isDark ? "text-white" : "text-neutral-800")}>{aiResponse.explanation}</p>
              {/* TODO: Maybe add a very simple preview of nodes/edges? */} 
            </div>
          )}
        </div>

        <DialogFooter className={cn(
          "p-6 pt-4 border-t-2 flex flex-col sm:flex-row justify-between items-center gap-3",
          isDark ? "border-purple-500" : "border-neutral-800"
        )}>
           {/* Left side: Generate Button */} 
          <Button
            type="button"
            onClick={handleGenerateClick}
            disabled={isLoading || !userInput.trim()}
            className={cn(
              isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle,
              "w-full sm:w-auto"
            )}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isLoading ? 'Generating...' : 'Generate Proposal'}
          </Button>
          
          {/* Right side: Add/Cancel Buttons */} 
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className={cn(
                isDark ? darkOutlineCartoonButtonStyle : outlineCartoonButtonStyle,
                "flex-1 sm:flex-none"
              )}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddToCanvasClick}
              disabled={isLoading || !aiResponse || !aiResponse.flow}
              className={cn(
                isDark ? darkPrimaryCartoonButtonStyle : primaryCartoonButtonStyle,
                "flex-1 sm:flex-none"
              )}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add to Canvas
            </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 