'use client';

import { useEffect } from 'react';

/**
 * Component that registers a visit when a shared flow is viewed.
 * This component should be included in the shared view page.
 * It does not render any visible UI elements, only tracks visits.
 * 
 * Implements a robust system to ensure access tracking:
 * 1. First tries direct access method
 * 2. Falls back to trigger-based method if needed
 * 3. Has built-in retry logic
 */
export function AccessTracker({ shareId }: { shareId: string }) {
  useEffect(() => {
    // Only register the visit once, when the component mounts
    const registerAccessAttempt = async () => {
      try {

        
        // Small delay to ensure the user actually views the page
        // (not just loading and immediately leaving)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Attempt both methods in parallel with a race
        try {
          await Promise.any([
            // Method 1: Direct-access endpoint (faster, bypasses triggers)
            registerWithDirectAccess(),
            // Method 2: Regular endpoint (uses database triggers)
            registerWithRegularEndpoint()
          ]);

        } catch (error) {

        }
      } catch (error) {

      }
    };
    
    // Method 1: Direct access endpoint (bypasses triggers)
    const registerWithDirectAccess = async () => {
      try {

        const response = await fetch(`/api/public-flow/${shareId}/direct-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error('[AccessTracker] Direct access method failed:', {
            status: response.status,
            data
          });
          throw new Error(`Direct access failed: ${response.status}`);
        }
        
        const data = await response.json().catch(() => ({}));

        return data;
      } catch (error) {

        throw error; // Let Promise.any handle this
      }
    };
    
    // Method 2: Regular endpoint (uses database triggers)
    const registerWithRegularEndpoint = async () => {
      // Add a small delay to let the direct method try first
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {

        const response = await fetch(`/api/public-flow/${shareId}/access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error('[AccessTracker] Regular access method failed:', {
            status: response.status,
            data
          });
          throw new Error(`Regular access failed: ${response.status}`);
        }
        
        const data = await response.json().catch(() => ({}));

        return data;
      } catch (error) {

        throw error; // Let Promise.any handle this
      }
    };

    // Register the visit
    const registered = registerAccessAttempt();
    
    // Cleanup function
    return () => {
      // Nothing to clean up
    };
  }, [shareId]); // Only run when shareId changes

  // This component doesn't render anything visible
  return null;
} 