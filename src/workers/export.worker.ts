/// <reference lib="webworker" />
// Papa object is available globally via importScripts in the first line

// --- Helper Functions (More explicit types) ---

// Function to flatten nested objects (re-added)
function flattenObject(obj: any, prefix: string = '', separator: string = '.'): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
    const pre = prefix.length ? prefix + separator : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k, separator));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

function convertToHTML(data: any[]): string { // Added basic type
  if (!Array.isArray(data) || data.length === 0) return '<p>No data available</p>';
  const allKeys = new Set<string>(); // Specify Set type
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) Object.keys(item).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys);
  let html = `<!DOCTYPE html><html><head><title>Exported Data</title><style>body{font-family:sans-serif;margin:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f2f2f2}tr:nth-child(even){background-color:#f9f9f9}</style></head><body><h1>Exported Data</h1><table><thead><tr>`;
  headers.forEach(header => { html += `<th>${header}</th>`; });
  html += `</tr></thead><tbody>`;
  data.forEach(item => {
    html += '<tr>';
    headers.forEach(header => {
      const val = (typeof item === 'object' && item !== null) ? item[header as keyof typeof item] : item; // Type assertion for index access
      html += `<td>${(val === null || val === undefined) ? '' : (typeof val === 'object' ? JSON.stringify(val) : val)}</td>`;
    });
    html += '</tr>';
  });
  html += `</tbody></table></body></html>`;
  return html;
}

function convertToMarkdown(data: any[]): string { // Added basic type
  if (!Array.isArray(data) || data.length === 0) return '**No data available**';
  const allKeys = new Set<string>(); // Specify Set type
  data.forEach(item => {
    if (typeof item === 'object' && item !== null) Object.keys(item).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys);
  let markdown = `# Exported Data\n\n| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
  data.forEach(item => {
    const row = headers.map(header => {
      const val = (typeof item === 'object' && item !== null) ? item[header as keyof typeof item] : item; // Type assertion for index access
      if (val === null || val === undefined) return '';
      return String(typeof val === 'object' ? JSON.stringify(val) : val).replace(/\|/g, '\\|');
    });
    markdown += `| ${row.join(' | ')} |\n`;
  });
  return markdown;
}

// --- Worker Logic ---

// Define expected message structure (optional but good practice)
interface WorkerInputData {
    inputData: any;
    config: {
        exportFormat?: 'csv' | 'json' | 'txt' | 'html' | 'markdown';
        fileName?: string;
        includeTimestamp?: boolean;
        customSeparator?: string;
        flatten?: boolean; // Add flatten config option
        // Add other potential config fields from ExportNodeData if needed
    };
}

self.onmessage = function(event: MessageEvent<WorkerInputData>) { // Typed event
  // IMPORTANT: PapaParse needs to be explicitly imported *inside* the worker now
  // Since it's part of the source, not loaded via importScripts
  if (typeof Papa === 'undefined') {
      try {
          // Attempt to dynamically import - might not work in all worker contexts
          // depending on build output. A direct import at the top is safer if bundling works.
          importScripts('https://unpkg.com/papaparse@5.3.2/papaparse.min.js');
      } catch (e) {
           self.postMessage({ success: false, error: "Failed to load CSV library in worker." });
           return;
      }
  }


  const { inputData, config } = event.data;
  const { exportFormat, fileName: baseFileName, includeTimestamp, customSeparator, flatten } = config;

  

  try {
    const dataToExportRaw = Array.isArray(inputData) ? inputData : [inputData];
    const timestamp = includeTimestamp ? `-${new Date().toISOString().replace(/[:.]/g, '-')}` : '';
    let fileContent = '';
    let fileName = `${baseFileName || 'exported-data'}${timestamp}`;
    let mimeType = 'text/plain;charset=utf-8;';

    switch (exportFormat) {
      case 'csv':
        // Flatten data IF the option is enabled in the node config
        const dataForCsv = flatten 
          ? dataToExportRaw.map(item => (typeof item === 'object' && item !== null) ? flattenObject(item) : item)
          : dataToExportRaw;
        
    

        fileContent = Papa.unparse(dataForCsv, {
          delimiter: customSeparator || ',',
          header: true,
          skipEmptyLines: true,
        });
        fileName += '.csv';
        mimeType = 'text/csv;charset=utf-8;';
        break;
      case 'json':
        // JSON handles nested structures naturally
        fileContent = JSON.stringify(dataToExportRaw, null, 2);
        fileName += '.json';
        mimeType = 'application/json;charset=utf-8;';
        break;
      case 'txt':
         // TXT usually benefits from flattening too if we want readable key-value pairs
         const dataForTxt = flatten
            ? dataToExportRaw.map(item => (typeof item === 'object' && item !== null) ? flattenObject(item) : item)
            : dataToExportRaw;
        fileContent = dataForTxt.map(item =>
          typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
        ).join('\n\n====================\n\n'); // Added separator for clarity
        fileName += '.txt';
        mimeType = 'text/plain;charset=utf-8;';
        break;
      case 'html':
         // HTML might also benefit from flattening for a simple table
         const dataForHtml = flatten
            ? dataToExportRaw.map(item => (typeof item === 'object' && item !== null) ? flattenObject(item) : item)
            : dataToExportRaw;
        fileContent = convertToHTML(dataForHtml);
        fileName += '.html';
        mimeType = 'text/html;charset=utf-8;';
        break;
      case 'markdown':
         // Markdown table also benefits from flattening
         const dataForMd = flatten
            ? dataToExportRaw.map(item => (typeof item === 'object' && item !== null) ? flattenObject(item) : item)
            : dataToExportRaw;
        fileContent = convertToMarkdown(dataForMd);
        fileName += '.md';
        mimeType = 'text/markdown;charset=utf-8;';
        break;
      default:
        throw new Error(`Unsupported export format: ${exportFormat}`);
    }

    ('[Worker] Formatting successful. Sending result back.');
    self.postMessage({ success: true, fileContent, fileName, mimeType });

  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ success: false, error: errorMessage });
  }
};

('[Worker] Export worker initialized.'); 