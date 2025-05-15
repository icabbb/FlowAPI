'use client';

import { useEffect } from 'react';
import { useFlowStore } from '../index';

/**
 * Custom hook to warn the user about unsaved changes before leaving the page.
 */
export function useWarnOnUnload() {
  const isDirty = useFlowStore((state) => state.isDirty);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        // Standard practice: modern browsers show a generic message,
        // but assigning to returnValue is needed for older browsers/compatibility.
        event.returnValue = ''; 
        return ''; // Some browsers might use this
      }
      // If not dirty, do nothing, allow unload without warning
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function to remove the listener when the component unmounts
    // or when isDirty changes to false
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]); // Re-run the effect if isDirty changes

  // This hook doesn't need to return anything
} 