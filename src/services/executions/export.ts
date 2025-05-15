import type { Node, Edge } from '@xyflow/react';
import type {
  SetNodeResultCallback,
  UpdateNodeDataCallback,
  ResolveVariableCallback,
  SetFlowContextVariableCallback,
} from '@/contracts/types/execution.types';
import type { NodeResult } from '@/contracts/types';
import type { ExportNodeData } from '@/contracts/types/nodes.types';
import { triggerNextNodes } from '@/utils/triggerNextNodes';

/**
 * Converts data to HTML table format
 */
function convertToHTML(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '<p>No data available</p>';
  }

  // Get all unique keys
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });
  const headers = Array.from(allKeys);

  // Start building HTML
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Exported Data</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>Exported Data</h1>
  <table>
    <thead>
      <tr>
`;

  // Add headers
  headers.forEach(header => {
    html += `        <th>${header}</th>\n`;
  });
  
  html += `      </tr>
    </thead>
    <tbody>
`;

  // Add data rows
  data.forEach(item => {
    html += '      <tr>\n';
    headers.forEach(header => {
      const val = typeof item === 'object' && item !== null ? item[header] : item;
      if (val === null || val === undefined) {
        html += '        <td></td>\n';
      } else if (typeof val === 'object') {
        html += `        <td>${JSON.stringify(val)}</td>\n`;
      } else {
        html += `        <td>${val}</td>\n`;
      }
    });
    html += '      </tr>\n';
  });
  
  html += `    </tbody>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Converts data to Markdown table format
 */
function convertToMarkdown(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) {
    return '**No data available**';
  }

  // Get all unique keys
  const allKeys = new Set<string>();
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key));
    }
  });
  const headers = Array.from(allKeys);

  // Build markdown table
  let markdown = '# Exported Data\n\n';
  
  // Header row
  markdown += '| ' + headers.join(' | ') + ' |\n';
  
  // Separator row
  markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
  
  // Data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const val = typeof item === 'object' && item !== null ? item[header] : item;
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val).replace(/\|/g, '\\|'); // Escape pipes in content
    });
    markdown += '| ' + row.join(' | ') + ' |\n';
  });
  
  return markdown;
}

/**
 * Creates a downloadable blob and triggers download
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  if (typeof window === 'undefined') {
    throw new Error('File download is only available in browser environments');
  }
  
  // Create blob
  const blob = new Blob([content], { type: mimeType });
  
  // Create download link
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  
  // Append to document, click, and remove
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 100);
}

/**
 * Executes the Export node logic using a Web Worker for formatting.
 */
export async function executeExportNodeLogic(
  node: Node<ExportNodeData>,
  inputData: any,
  nodes: Node[],
  edges: Edge[],
  setNodeResult: SetNodeResultCallback,
  updateNodeData: UpdateNodeDataCallback,
  resolveVariable: ResolveVariableCallback,
  setFlowContextVariable: SetFlowContextVariableCallback
): Promise<NodeResult> {
  const { id, data } = node;


  
  // Set initial loading state
  setNodeResult(id, { status: 'loading', error: undefined, data: undefined });
  
  // Initialize final result
  let finalResult: NodeResult = { status: 'idle' };
  let worker: Worker | null = null;
  
  try {
    // Update the node's inputData property first
    updateNodeData(id, { inputData });
    
    // Validate input data
    if (!inputData) {

      throw new Error('No input data provided for export');
    }
    
    // Ensure data is in array format for exporting
    const dataToExport = Array.isArray(inputData) ? inputData : [inputData];

    
    // Generate timestamp if enabled
    const timestamp = data.includeTimestamp ? `-${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    
    // Determine file name and content based on format
    let fileContent = '';
    let fileName = `${data.fileName || 'exported-data'}${timestamp}`;
    let mimeType = 'text/plain';
    

    
    // --- Use Web Worker for formatting --- 
    if (typeof Worker !== 'undefined') { 

      // Use new URL() syntax for static analysis compatibility
      worker = new Worker(new URL('../../workers/export.worker.ts', import.meta.url));
      
      // Send data to worker
      const workerPayload = { inputData, config: data };
      worker.postMessage(workerPayload);


      // Wrap worker interaction in a Promise
      await new Promise<void>((resolve, reject) => {
          if (!worker) { // Should not happen, but type safety
              return reject(new Error('Worker initialization failed.'));
          }
          worker.onmessage = (event) => {

            const { success, fileContent, fileName, mimeType, error } = event.data;
            
            if (success) {

              downloadFile(fileContent, fileName, mimeType);
              
              const successResult: NodeResult = {
                status: 'success',
                data: {
                  exportedFormat: data.exportFormat,
                  fileName: fileName,
                  recordCount: dataToExport.length,
                  timestamp: Date.now()
                },
                timestamp: Date.now()
              };
              setNodeResult(id, successResult);
              finalResult = successResult;
              resolve(); // Resolve the promise on success
            } else {

              const errorResult: NodeResult = {
                status: 'error',
                error: error || 'Worker formatting failed',
                timestamp: Date.now()
              };
              setNodeResult(id, errorResult);
              finalResult = errorResult;
              reject(new Error(error || 'Worker formatting failed')); // Reject promise on error
            }
            worker?.terminate(); // Clean up worker after completion or error
            worker = null;
          };

          worker.onerror = (error) => {

            const errorResult: NodeResult = {
              status: 'error',
              error: error.message || 'Worker encountered an error',
              timestamp: Date.now()
            };
            setNodeResult(id, errorResult);
            finalResult = errorResult;
            worker?.terminate();
            worker = null;
            reject(error); // Reject the promise on worker error
          };
      });

    } else {
      // Fallback if Workers are not supported (should not happen in modern browsers)

      // Re-implement the switch logic here as a fallback if truly needed
      // For now, throw an error as Workers are expected
      throw new Error('Web Workers are required for this functionality but not supported in this environment.');
    }
    // --- End Worker Logic ---
    
  } catch (error: any) {

    
    if (finalResult.status === 'idle' || finalResult.status === 'loading') { // Only set error if not already set by worker
        const errorResult: NodeResult = {
          status: 'error',
          error: error.message || 'Export operation failed',
          timestamp: Date.now()
        };
        setNodeResult(id, errorResult);
        finalResult = errorResult;
    }
    // Ensure worker is terminated if an error occurred before or during promise handling
    if (worker) {
        worker.terminate();
        worker = null;
    }

  } finally {
      // Final check to ensure worker termination if it exists
      if (worker) {

          worker.terminate();
      }
  }
  
  // Trigger next nodes based on the finalResult status set by worker or catch block
  if (finalResult.status === 'success') {

    await triggerNextNodes(
      id, 
      finalResult.data, // Pass the success data (metadata) from the worker
      nodes, 
      edges, 
      setNodeResult, 
      updateNodeData, 
      resolveVariable, 
      setFlowContextVariable, 
      'output'
    );
  } else {

  }
  

  return finalResult;
} 