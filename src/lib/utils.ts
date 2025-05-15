import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a URL-friendly slug from a given string.
 * Converts to lowercase, replaces spaces and non-alphanumeric characters with hyphens,
 * and cleans up multiple or leading/trailing hyphens.
 * Does NOT ensure uniqueness; that is a database-level concern.
 * @param name The string to slugify (e.g., a flow name).
 * @returns A URL-friendly base slug.
 */
export function generateSlug(name: string): string {
  if (!name) return 'untitled-flow'; // Default for empty names

  const slug = name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^a-z0-9-]/g, '') // Remove all non-alphanumeric chars except hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text

  return slug || 'flow'; // Fallback if slug becomes empty after cleaning
}
