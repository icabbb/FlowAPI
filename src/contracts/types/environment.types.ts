// Type definitions related to Environments

/**
 * Represents a single variable within an Environment.
 */
export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isSecret?: boolean; // Flag for sensitive variables
}

/**
 * Represents an Environment as stored in the database.
 * Matches the DB table columns.
 */
export interface Environment {
  id: string;         // uuid in DB
  user_id: string;    // text in DB
  name: string;       // text in DB
  variables: EnvironmentVariable[]; // jsonb in DB
  created_at: string; // timestamptz in DB
  updated_at: string; // timestamptz in DB
}

/**
 * Data structure used when saving/updating an environment.
 * Includes only the necessary fields.
 */
export type EnvironmentSaveData = Pick<Environment, 'name' | 'variables'> & { 
  id?: string; // Optional ID for updates
}; 