import { StateCreator } from 'zustand';

export interface UserSlice {
  userId:   string | null;
  setUserId(id: string | null): void;
}

export const createUserSlice: StateCreator<
  any, [], [], UserSlice
> = (set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
});
