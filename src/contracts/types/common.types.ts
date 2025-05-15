/**
 * Represents a basic key-value pair, often used for headers, query params, etc.
 */
export interface KeyValueEntry {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
} 