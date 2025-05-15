import type { KeyValueEntry } from '@/contracts/types/common.types';
import type { ResolveVariableCallback } from '@/contracts/types/execution.types';

export function resolveKeyValueEntries(
  entries: KeyValueEntry[] | undefined,
  resolveVariable: ResolveVariableCallback
): KeyValueEntry[] {
  if (!entries) return [];
  return entries.map(entry => ({
    ...entry,
    value: resolveVariable(entry.value) || entry.value,
  }));
}