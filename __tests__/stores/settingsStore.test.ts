import { act } from '@testing-library/react-native';
import { useSettingsStore } from '../../stores/settingsStore';

// Reset store between tests
const resetStore = () => {
  useSettingsStore.setState({
    theme: 'dark',
    vibrationEnabled: true,
    showCurrentProbability: true,
    showTheoreticalProbability: true,
    autoSaveSession: true,
    showAllSettings: true,
    probabilityDecimalPlaces: 2,
  });
};

describe('settingsStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('default values', () => {
    it('has correct default values', () => {
      const state = useSettingsStore.getState();

      expect(state.theme).toBe('dark');
      expect(state.vibrationEnabled).toBe(true);
      expect(state.showCurrentProbability).toBe(true);
      expect(state.showTheoreticalProbability).toBe(true);
      expect(state.autoSaveSession).toBe(true);
      expect(state.showAllSettings).toBe(true);
      expect(state.probabilityDecimalPlaces).toBe(2);
    });
  });

  describe('setTheme', () => {
    it('sets theme to light', () => {
      const { setTheme } = useSettingsStore.getState();

      act(() => {
        setTheme('light');
      });

      expect(useSettingsStore.getState().theme).toBe('light');
    });

    it('sets theme to dark', () => {
      const { setTheme } = useSettingsStore.getState();

      act(() => {
        setTheme('light');
        setTheme('dark');
      });

      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('sets theme to system', () => {
      const { setTheme } = useSettingsStore.getState();

      act(() => {
        setTheme('system');
      });

      expect(useSettingsStore.getState().theme).toBe('system');
    });
  });

  describe('setVibrationEnabled', () => {
    it('enables vibration', () => {
      const { setVibrationEnabled } = useSettingsStore.getState();

      act(() => {
        setVibrationEnabled(false);
        setVibrationEnabled(true);
      });

      expect(useSettingsStore.getState().vibrationEnabled).toBe(true);
    });

    it('disables vibration', () => {
      const { setVibrationEnabled } = useSettingsStore.getState();

      act(() => {
        setVibrationEnabled(false);
      });

      expect(useSettingsStore.getState().vibrationEnabled).toBe(false);
    });
  });

  describe('setShowCurrentProbability', () => {
    it('toggles show current probability', () => {
      const { setShowCurrentProbability } = useSettingsStore.getState();

      act(() => {
        setShowCurrentProbability(false);
      });

      expect(useSettingsStore.getState().showCurrentProbability).toBe(false);

      act(() => {
        setShowCurrentProbability(true);
      });

      expect(useSettingsStore.getState().showCurrentProbability).toBe(true);
    });
  });

  describe('setShowTheoreticalProbability', () => {
    it('toggles show theoretical probability', () => {
      const { setShowTheoreticalProbability } = useSettingsStore.getState();

      act(() => {
        setShowTheoreticalProbability(false);
      });

      expect(useSettingsStore.getState().showTheoreticalProbability).toBe(false);
    });
  });

  describe('setAutoSaveSession', () => {
    it('toggles auto save session', () => {
      const { setAutoSaveSession } = useSettingsStore.getState();

      act(() => {
        setAutoSaveSession(false);
      });

      expect(useSettingsStore.getState().autoSaveSession).toBe(false);
    });
  });

  describe('setShowAllSettings', () => {
    it('toggles show all settings', () => {
      const { setShowAllSettings } = useSettingsStore.getState();

      act(() => {
        setShowAllSettings(false);
      });

      expect(useSettingsStore.getState().showAllSettings).toBe(false);
    });
  });

  describe('setProbabilityDecimalPlaces', () => {
    it('sets decimal places', () => {
      const { setProbabilityDecimalPlaces } = useSettingsStore.getState();

      act(() => {
        setProbabilityDecimalPlaces(3);
      });

      expect(useSettingsStore.getState().probabilityDecimalPlaces).toBe(3);
    });

    it('allows 0 decimal places', () => {
      const { setProbabilityDecimalPlaces } = useSettingsStore.getState();

      act(() => {
        setProbabilityDecimalPlaces(0);
      });

      expect(useSettingsStore.getState().probabilityDecimalPlaces).toBe(0);
    });
  });

  describe('resetSettings', () => {
    it('resets all settings to defaults', () => {
      const {
        setTheme,
        setVibrationEnabled,
        setShowCurrentProbability,
        setProbabilityDecimalPlaces,
        resetSettings,
      } = useSettingsStore.getState();

      // Change all settings
      act(() => {
        setTheme('light');
        setVibrationEnabled(false);
        setShowCurrentProbability(false);
        setProbabilityDecimalPlaces(5);
      });

      // Verify changes
      let state = useSettingsStore.getState();
      expect(state.theme).toBe('light');
      expect(state.vibrationEnabled).toBe(false);
      expect(state.showCurrentProbability).toBe(false);
      expect(state.probabilityDecimalPlaces).toBe(5);

      // Reset
      act(() => {
        useSettingsStore.getState().resetSettings();
      });

      // Verify defaults
      state = useSettingsStore.getState();
      expect(state.theme).toBe('dark');
      expect(state.vibrationEnabled).toBe(true);
      expect(state.showCurrentProbability).toBe(true);
      expect(state.probabilityDecimalPlaces).toBe(2);
    });
  });
});
