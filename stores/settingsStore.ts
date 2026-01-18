import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppSettings {
  // 表示設定
  theme: 'light' | 'dark' | 'system';
  vibrationEnabled: boolean;

  // カウンター設定
  showCurrentProbability: boolean;
  showTheoreticalProbability: boolean;
  autoSaveSession: boolean;

  // 設定推測表示
  showAllSettings: boolean; // 全設定を表示するか、上位のみか
  probabilityDecimalPlaces: number; // 確率の小数点以下桁数
}

interface SettingsStore extends AppSettings {
  // アクション
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setShowCurrentProbability: (show: boolean) => void;
  setShowTheoreticalProbability: (show: boolean) => void;
  setAutoSaveSession: (enabled: boolean) => void;
  setShowAllSettings: (show: boolean) => void;
  setProbabilityDecimalPlaces: (places: number) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  vibrationEnabled: true,
  showCurrentProbability: true,
  showTheoreticalProbability: true,
  autoSaveSession: true,
  showAllSettings: true,
  probabilityDecimalPlaces: 2,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => set({ theme }),
      setVibrationEnabled: (enabled) => set({ vibrationEnabled: enabled }),
      setShowCurrentProbability: (show) => set({ showCurrentProbability: show }),
      setShowTheoreticalProbability: (show) =>
        set({ showTheoreticalProbability: show }),
      setAutoSaveSession: (enabled) => set({ autoSaveSession: enabled }),
      setShowAllSettings: (show) => set({ showAllSettings: show }),
      setProbabilityDecimalPlaces: (places) =>
        set({ probabilityDecimalPlaces: places }),
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'slot-analyzer-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
