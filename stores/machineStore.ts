import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MachineData, PRESET_MACHINES, Role } from '../types';
import { generateUUID } from '../utils/qrCodec';

interface MachineStore {
  machines: MachineData[];
  selectedMachineId: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // アクション
  initialize: () => Promise<void>;
  addMachine: (machine: Omit<MachineData, 'id' | 'createdAt' | 'updatedAt'>) => MachineData;
  updateMachine: (id: string, updates: Partial<MachineData>) => void;
  deleteMachine: (id: string) => void;
  selectMachine: (id: string | null) => void;
  getSelectedMachine: () => MachineData | null;
  getMachineById: (id: string) => MachineData | undefined;
  importMachine: (machine: MachineData) => MachineData;
  addRoleToMachine: (machineId: string, role: Omit<Role, 'id'>) => void;
  updateRole: (machineId: string, roleId: string, updates: Partial<Role>) => void;
  deleteRole: (machineId: string, roleId: string) => void;
}

export const useMachineStore = create<MachineStore>()(
  persist(
    (set, get) => ({
      machines: [],
      selectedMachineId: null,
      isLoading: true,
      isInitialized: false,

      initialize: async () => {
        const state = get();
        if (state.isInitialized) return;

        // プリセット機種を追加（まだない場合）
        const existingNames = state.machines.map((m) => m.name);
        const presetsToAdd = PRESET_MACHINES.filter(
          (p) => !existingNames.includes(p.name)
        );

        if (presetsToAdd.length > 0) {
          const now = Date.now();
          const newMachines = presetsToAdd.map((preset) => ({
            ...preset,
            id: generateUUID(),
            createdAt: now,
            updatedAt: now,
          }));

          set((state) => ({
            machines: [...state.machines, ...newMachines],
            isLoading: false,
            isInitialized: true,
          }));
        } else {
          set({ isLoading: false, isInitialized: true });
        }
      },

      addMachine: (machineData) => {
        const now = Date.now();
        const newMachine: MachineData = {
          ...machineData,
          id: generateUUID(),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          machines: [...state.machines, newMachine],
        }));

        return newMachine;
      },

      updateMachine: (id, updates) => {
        set((state) => ({
          machines: state.machines.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
          ),
        }));
      },

      deleteMachine: (id) => {
        set((state) => ({
          machines: state.machines.filter((m) => m.id !== id),
          selectedMachineId:
            state.selectedMachineId === id ? null : state.selectedMachineId,
        }));
      },

      selectMachine: (id) => {
        set({ selectedMachineId: id });
      },

      getSelectedMachine: () => {
        const state = get();
        if (!state.selectedMachineId) return null;
        return state.machines.find((m) => m.id === state.selectedMachineId) || null;
      },

      getMachineById: (id) => {
        return get().machines.find((m) => m.id === id);
      },

      importMachine: (machine) => {
        const existingMachine = get().machines.find((m) => m.name === machine.name);

        if (existingMachine) {
          // 同名の機種がある場合は更新
          set((state) => ({
            machines: state.machines.map((m) =>
              m.name === machine.name
                ? { ...machine, id: m.id, updatedAt: Date.now() }
                : m
            ),
          }));
          return { ...machine, id: existingMachine.id };
        } else {
          // 新規追加
          const now = Date.now();
          const newMachine: MachineData = {
            ...machine,
            id: generateUUID(),
            createdAt: now,
            updatedAt: now,
          };

          set((state) => ({
            machines: [...state.machines, newMachine],
          }));

          return newMachine;
        }
      },

      addRoleToMachine: (machineId, roleData) => {
        const newRole: Role = {
          ...roleData,
          id: generateUUID(),
        };

        set((state) => ({
          machines: state.machines.map((m) =>
            m.id === machineId
              ? {
                  ...m,
                  roles: [...m.roles, newRole],
                  updatedAt: Date.now(),
                }
              : m
          ),
        }));
      },

      updateRole: (machineId, roleId, updates) => {
        set((state) => ({
          machines: state.machines.map((m) =>
            m.id === machineId
              ? {
                  ...m,
                  roles: m.roles.map((r) =>
                    r.id === roleId ? { ...r, ...updates } : r
                  ),
                  updatedAt: Date.now(),
                }
              : m
          ),
        }));
      },

      deleteRole: (machineId, roleId) => {
        set((state) => ({
          machines: state.machines.map((m) =>
            m.id === machineId
              ? {
                  ...m,
                  roles: m.roles.filter((r) => r.id !== roleId),
                  updatedAt: Date.now(),
                }
              : m
          ),
        }));
      },
    }),
    {
      name: 'slot-analyzer-machines',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        machines: state.machines,
        selectedMachineId: state.selectedMachineId,
      }),
    }
  )
);
