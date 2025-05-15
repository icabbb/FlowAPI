// src/store/Slices/environmentSlice.ts
/* eslint-disable @typescript-eslint/consistent-type-imports */
import { StateCreator } from 'zustand';

import type {
  Environment,
  EnvironmentSaveData,
  EnvironmentVariable,
} from '@/contracts/types';
import { processEnvironmentVariables } from '@/services/encryption-service';

import type { FlowStore } from '../index';
import { createActionClient } from '../utils/supabase';

export interface EnvironmentSlice {
  environments: Environment[];
  selectedEnvironmentId: string | null;
  editingEnvironment: Environment | null;

  /* flags */
  isLoading: boolean;
  isSaving: boolean;

  /* CRUD */
  loadEnvironments(): Promise<void>;
  saveEnvironment(data: EnvironmentSaveData): Promise<Environment | null>;
  deleteEnvironment(id: string): Promise<boolean>;
  saveEnvironmentVariable(environmentId: string, variable: EnvironmentVariable): Promise<void>;

  /* helpers */
  selectEnvironment(id: string | null): void;
  getActiveEnvironment(): Environment | null;
  setEditingEnvironment(env: Environment | null): void;
}

export const createEnvSlice: StateCreator<
  FlowStore,
  [],
  [],
  EnvironmentSlice
> = (set, get) => ({
  /* ---------- state ---------- */
  environments: [],
  selectedEnvironmentId: null,
  editingEnvironment: null,

  isLoading: false,
  isSaving: false,

  /* ---------- helpers ---------- */
  selectEnvironment: (id) => set({ selectedEnvironmentId: id }),

  getActiveEnvironment: () => {
    const { environments, selectedEnvironmentId } = get();
    return (
      environments.find((e: { id: string }) => e.id === selectedEnvironmentId) ||
      null
    );
  },

  setEditingEnvironment: (env) => set({ editingEnvironment: env }),

  /* ---------- actions ---------- */
  async loadEnvironments() {
    const { userId, selectEnvironment, selectedEnvironmentId } = get();

    if (!userId) {
      set({ environments: [], selectedEnvironmentId: null });
      return;
    }

    const supabase = createActionClient();
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('environments')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      const envs = (data ?? []) as Environment[];

      /* decrypt all variables before storing in state */
      const decrypted = await Promise.all(
        envs.map(async (env) => ({
          ...env,
          variables: await processEnvironmentVariables(
            env.variables ?? [],
            userId,
            'decrypt',
          ),
        })),
      );

      set({ environments: decrypted });

      /* keep selection valid */
      if (
        !selectedEnvironmentId ||
        !decrypted.some((e) => e.id === selectedEnvironmentId)
      ) {
        selectEnvironment(decrypted[0]?.id ?? null);
      }
    } catch (err) {

      set({ environments: [], selectedEnvironmentId: null });
    } finally {
      set({ isLoading: false });
    }
  },

  async saveEnvironment(envData) {
    const { userId, loadEnvironments, selectEnvironment } = get();

    if (!userId) {

      return null;
    }

    const supabase = createActionClient();
    set({ isSaving: true });

    try {
      /* ensure every variable has an id */
      const vars: EnvironmentVariable[] = (envData.variables ?? []).map((v) => ({
        ...v,
        id: v.id || crypto.randomUUID(),
      }));

      const encrypted = await processEnvironmentVariables(vars, userId, 'encrypt');

      const { data, error } = await supabase
        .from('environments')
        .upsert({
          ...envData,
          variables: encrypted,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Upsert returned null');

      /* keep decrypted vars in local state */
      const saved: Environment = { ...data, variables: vars };

      await loadEnvironments();
      if (!envData.id) selectEnvironment(saved.id);

      return saved;
    } catch (err) {

      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  async deleteEnvironment(envId) {
    const {
      userId,
      selectedEnvironmentId,
      selectEnvironment,
      loadEnvironments,
    } = get();

    if (!userId) {

      return false;
    }

    const supabase = createActionClient();
    set({ isLoading: true });

    try {
      const { error } = await supabase
        .from('environments')
        .delete()
        .eq('id', envId)
        .eq('user_id', userId);

      if (error) throw error;

      if (selectedEnvironmentId === envId) selectEnvironment(null);
      await loadEnvironments();
      return true;
    } catch (err) {

      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  async saveEnvironmentVariable(environmentId, newVariable) {
    const { environments, saveEnvironment, userId } = get();
    if (!userId) {

      return;
    }

    const targetEnvironment = environments.find(env => env.id === environmentId);

    if (!targetEnvironment) {

      return;
    }

    // Clonar las variables para no mutar el estado directamente
    const existingVariables = [...(targetEnvironment.variables || [])];
    const variableIndex = existingVariables.findIndex(v => v.key === newVariable.key);

    if (variableIndex > -1) {
      // Actualizar variable existente
      existingVariables[variableIndex] = {
        ...existingVariables[variableIndex], // Mantener ID original si existe
        ...newVariable, // Aplicar todos los campos de la nueva variable (value, isSecret, enabled)
      };
      (`[environmentSlice] Updating variable "${newVariable.key}" in environment "${targetEnvironment.name}"`);
    } else {
      // Añadir nueva variable (asegurándose de que tenga un ID)
      existingVariables.push({ ...newVariable, id: newVariable.id || crypto.randomUUID() });
      (`[environmentSlice] Adding new variable "${newVariable.key}" to environment "${targetEnvironment.name}"`);
    }

    // Crear el objeto EnvironmentSaveData para la función saveEnvironment
    const environmentToSave: EnvironmentSaveData = {
      ...targetEnvironment,
      variables: existingVariables,
    };

    // Llamar a la función saveEnvironment existente para persistir los cambios
    // saveEnvironment ya maneja la encriptación y la recarga de entornos.
    try {
      set({ isSaving: true }); // Indicar que estamos guardando
      const savedEnv = await saveEnvironment(environmentToSave);
      if (savedEnv) {
        (`[environmentSlice] Successfully saved environment "${targetEnvironment.name}" after updating variable "${newVariable.key}".`);
      } else {

      }
    } catch (error) {

    } finally {
      set({ isSaving: false });
    }
  },
});
