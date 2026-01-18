import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CountSession, SettingProbability, MachineData } from '../types';
import { generateUUID } from '../utils/qrCodec';
import { calculateSettingProbabilities } from '../utils/binomial';

interface SessionStore {
  currentSession: CountSession | null;
  sessionHistory: CountSession[];
  isLoading: boolean;

  // アクション
  startSession: (machine: MachineData, startGames?: number) => void;
  endSession: (save: boolean) => void;
  updateGameCount: (totalGames: number) => void;
  incrementCount: (roleId: string) => void;
  decrementCount: (roleId: string) => void;
  setCount: (roleId: string, count: number) => void;
  resetCounts: () => void;
  updateResults: (machine: MachineData) => void;
  setMemo: (memo: string) => void;
  deleteSession: (sessionId: string) => void;
  clearHistory: () => void;
  loadSession: (session: CountSession) => void;
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessionHistory: [],
      isLoading: false,

      startSession: (machine, startGames = 0) => {
        const now = Date.now();
        const initialCounts: Record<string, number> = {};
        machine.roles.forEach((role) => {
          initialCounts[role.id] = 0;
        });

        const newSession: CountSession = {
          id: generateUUID(),
          machineDataId: machine.id,
          machineName: machine.name,
          totalGames: startGames,
          startGames,
          counts: initialCounts,
          results: calculateSettingProbabilities(
            0,
            machine.roles,
            initialCounts,
            machine.settings
          ),
          createdAt: now,
          updatedAt: now,
          isActive: true,
        };

        set({ currentSession: newSession });
      },

      endSession: (save) => {
        const { currentSession } = get();
        if (!currentSession) return;

        if (save) {
          const savedSession: CountSession = {
            ...currentSession,
            isActive: false,
            updatedAt: Date.now(),
          };

          set((state) => ({
            currentSession: null,
            sessionHistory: [savedSession, ...state.sessionHistory].slice(0, 100), // 最大100件
          }));
        } else {
          set({ currentSession: null });
        }
      },

      updateGameCount: (totalGames) => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              totalGames: Math.max(0, totalGames),
              updatedAt: Date.now(),
            },
          };
        });
      },

      incrementCount: (roleId) => {
        set((state) => {
          if (!state.currentSession) return state;
          const newCounts = {
            ...state.currentSession.counts,
            [roleId]: (state.currentSession.counts[roleId] || 0) + 1,
          };
          return {
            currentSession: {
              ...state.currentSession,
              counts: newCounts,
              updatedAt: Date.now(),
            },
          };
        });
      },

      decrementCount: (roleId) => {
        set((state) => {
          if (!state.currentSession) return state;
          const currentCount = state.currentSession.counts[roleId] || 0;
          if (currentCount <= 0) return state;

          const newCounts = {
            ...state.currentSession.counts,
            [roleId]: currentCount - 1,
          };
          return {
            currentSession: {
              ...state.currentSession,
              counts: newCounts,
              updatedAt: Date.now(),
            },
          };
        });
      },

      setCount: (roleId, count) => {
        set((state) => {
          if (!state.currentSession) return state;
          const newCounts = {
            ...state.currentSession.counts,
            [roleId]: Math.max(0, count),
          };
          return {
            currentSession: {
              ...state.currentSession,
              counts: newCounts,
              updatedAt: Date.now(),
            },
          };
        });
      },

      resetCounts: () => {
        set((state) => {
          if (!state.currentSession) return state;
          const resetCounts: Record<string, number> = {};
          Object.keys(state.currentSession.counts).forEach((key) => {
            resetCounts[key] = 0;
          });
          return {
            currentSession: {
              ...state.currentSession,
              totalGames: 0,
              counts: resetCounts,
              results: state.currentSession.results.map((r) => ({
                ...r,
                probability: 1 / state.currentSession!.results.length,
                likelihood: 1,
              })),
              updatedAt: Date.now(),
            },
          };
        });
      },

      updateResults: (machine) => {
        set((state) => {
          if (!state.currentSession) return state;

          const effectiveGames =
            state.currentSession.totalGames - state.currentSession.startGames;

          const results = calculateSettingProbabilities(
            effectiveGames,
            machine.roles,
            state.currentSession.counts,
            machine.settings
          );

          return {
            currentSession: {
              ...state.currentSession,
              results,
              updatedAt: Date.now(),
            },
          };
        });
      },

      setMemo: (memo) => {
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              memo,
              updatedAt: Date.now(),
            },
          };
        });
      },

      deleteSession: (sessionId) => {
        set((state) => ({
          sessionHistory: state.sessionHistory.filter((s) => s.id !== sessionId),
        }));
      },

      clearHistory: () => {
        set({ sessionHistory: [] });
      },

      loadSession: (session) => {
        set({
          currentSession: {
            ...session,
            isActive: true,
            updatedAt: Date.now(),
          },
        });
      },
    }),
    {
      name: 'slot-analyzer-sessions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentSession: state.currentSession,
        sessionHistory: state.sessionHistory,
      }),
    }
  )
);
