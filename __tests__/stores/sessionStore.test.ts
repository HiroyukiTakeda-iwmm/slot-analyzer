import { act } from '@testing-library/react-native';
import { useSessionStore } from '../../stores/sessionStore';
import { MachineData, DEFAULT_SETTINGS } from '../../types';

// Reset store between tests
const resetStore = () => {
  useSessionStore.setState({
    currentSession: null,
    sessionHistory: [],
    isLoading: false,
  });
};

describe('sessionStore', () => {
  beforeEach(() => {
    resetStore();
  });

  const testMachine: MachineData = {
    id: 'machine-1',
    name: 'テスト機種',
    type: 'A-type',
    settings: DEFAULT_SETTINGS,
    roles: [
      {
        id: 'grape',
        name: 'ぶどう',
        probabilities: {
          '1': 1 / 6.49,
          '2': 1 / 6.49,
          '3': 1 / 6.49,
          '4': 1 / 6.49,
          '5': 1 / 6.35,
          '6': 1 / 6.18,
        },
        hasSettingDiff: true,
        displayOrder: 1,
      },
    ],
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  describe('startSession', () => {
    it('creates new session with initial values', () => {
      const { startSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession).not.toBeNull();
      expect(state.currentSession?.machineName).toBe('テスト機種');
      expect(state.currentSession?.machineDataId).toBe('machine-1');
      expect(state.currentSession?.totalGames).toBe(0);
      expect(state.currentSession?.startGames).toBe(0);
      expect(state.currentSession?.isActive).toBe(true);
    });

    it('creates session with startGames parameter', () => {
      const { startSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine, 500);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.totalGames).toBe(500);
      expect(state.currentSession?.startGames).toBe(500);
    });

    it('initializes counts for all roles to 0', () => {
      const { startSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(0);
    });

    it('calculates initial setting probabilities', () => {
      const { startSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.results.length).toBe(6);
    });
  });

  describe('endSession', () => {
    it('saves session to history when save=true', () => {
      const { startSession, endSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        endSession(true);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.sessionHistory.length).toBe(1);
      expect(state.sessionHistory[0].isActive).toBe(false);
    });

    it('discards session when save=false', () => {
      const { startSession, endSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        endSession(false);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession).toBeNull();
      expect(state.sessionHistory.length).toBe(0);
    });

    it('does nothing when no current session', () => {
      const { endSession } = useSessionStore.getState();

      act(() => {
        endSession(true);
      });

      const state = useSessionStore.getState();
      expect(state.sessionHistory.length).toBe(0);
    });

    it('limits history to 100 sessions', () => {
      const { startSession, endSession } = useSessionStore.getState();

      // Create 105 sessions
      for (let i = 0; i < 105; i++) {
        act(() => {
          startSession(testMachine);
          endSession(true);
        });
      }

      const state = useSessionStore.getState();
      expect(state.sessionHistory.length).toBe(100);
    });
  });

  describe('updateGameCount', () => {
    it('updates totalGames', () => {
      const { startSession, updateGameCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        updateGameCount(1000);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.totalGames).toBe(1000);
    });

    it('does not allow negative game count', () => {
      const { startSession, updateGameCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        updateGameCount(-100);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.totalGames).toBe(0);
    });

    it('does nothing when no current session', () => {
      const { updateGameCount } = useSessionStore.getState();

      act(() => {
        updateGameCount(1000);
      });

      expect(useSessionStore.getState().currentSession).toBeNull();
    });
  });

  describe('incrementCount', () => {
    it('increments count for specified role', () => {
      const { startSession, incrementCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        incrementCount('grape');
        incrementCount('grape');
        incrementCount('grape');
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(3);
    });

    it('handles non-existent role gracefully', () => {
      const { startSession, incrementCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        incrementCount('non-existent');
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['non-existent']).toBe(1);
    });
  });

  describe('decrementCount', () => {
    it('decrements count for specified role', () => {
      const { startSession, incrementCount, decrementCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        incrementCount('grape');
        incrementCount('grape');
        decrementCount('grape');
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(1);
    });

    it('does not decrement below 0', () => {
      const { startSession, decrementCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        decrementCount('grape');
        decrementCount('grape');
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(0);
    });
  });

  describe('setCount', () => {
    it('sets count to specified value', () => {
      const { startSession, setCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        setCount('grape', 50);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(50);
    });

    it('does not allow negative count', () => {
      const { startSession, setCount } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        setCount('grape', -10);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(0);
    });
  });

  describe('resetCounts', () => {
    it('resets all counts to 0', () => {
      const { startSession, incrementCount, resetCounts } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        incrementCount('grape');
        incrementCount('grape');
        resetCounts();
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.counts['grape']).toBe(0);
      expect(state.currentSession?.totalGames).toBe(0);
    });
  });

  describe('setMemo', () => {
    it('sets memo on current session', () => {
      const { startSession, setMemo } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        setMemo('テストメモ');
      });

      const state = useSessionStore.getState();
      expect(state.currentSession?.memo).toBe('テストメモ');
    });
  });

  describe('deleteSession', () => {
    it('removes session from history', () => {
      const { startSession, endSession, deleteSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        endSession(true);
      });

      const sessionId = useSessionStore.getState().sessionHistory[0].id;

      act(() => {
        deleteSession(sessionId);
      });

      expect(useSessionStore.getState().sessionHistory.length).toBe(0);
    });
  });

  describe('clearHistory', () => {
    it('clears all session history', () => {
      const { startSession, endSession, clearHistory } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        endSession(true);
        startSession(testMachine);
        endSession(true);
        clearHistory();
      });

      expect(useSessionStore.getState().sessionHistory.length).toBe(0);
    });
  });

  describe('loadSession', () => {
    it('loads session as active', () => {
      const { startSession, endSession, loadSession } = useSessionStore.getState();

      act(() => {
        startSession(testMachine);
        endSession(true);
      });

      const savedSession = useSessionStore.getState().sessionHistory[0];

      act(() => {
        loadSession(savedSession);
      });

      const state = useSessionStore.getState();
      expect(state.currentSession).not.toBeNull();
      expect(state.currentSession?.isActive).toBe(true);
      expect(state.currentSession?.machineName).toBe('テスト機種');
    });
  });
});
