import { act } from '@testing-library/react-native';
import { useMachineStore } from '../../stores/machineStore';
import { DEFAULT_SETTINGS, MachineData } from '../../types';

// Reset store between tests
const resetStore = () => {
  useMachineStore.setState({
    machines: [],
    selectedMachineId: null,
    isLoading: true,
    isInitialized: false,
  });
};

describe('machineStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initialize', () => {
    it('adds preset machines when store is empty', async () => {
      const { initialize } = useMachineStore.getState();

      await act(async () => {
        await initialize();
      });

      const state = useMachineStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.machines.length).toBeGreaterThan(0);
    });

    it('does not add presets when already initialized', async () => {
      const { initialize } = useMachineStore.getState();

      await act(async () => {
        await initialize();
      });

      const machineCount = useMachineStore.getState().machines.length;

      await act(async () => {
        await initialize();
      });

      expect(useMachineStore.getState().machines.length).toBe(machineCount);
    });

    it('does not duplicate presets when they already exist', async () => {
      // First initialize to add presets
      const { initialize } = useMachineStore.getState();

      await act(async () => {
        await initialize();
      });

      // Reset initialized flag but keep machines
      useMachineStore.setState({ isInitialized: false });

      await act(async () => {
        await initialize();
      });

      const state = useMachineStore.getState();
      // Should not have duplicate machines
      const machineNames = state.machines.map((m) => m.name);
      const uniqueNames = [...new Set(machineNames)];
      expect(machineNames.length).toBe(uniqueNames.length);
    });
  });

  const testMachineInput = {
    name: 'テスト機種',
    type: 'A-type' as const,
    settings: DEFAULT_SETTINGS,
    roles: [
      {
        id: 'role1',
        name: 'ぶどう',
        probabilities: { '1': 0.15, '2': 0.15, '3': 0.16 },
        hasSettingDiff: true,
        displayOrder: 1,
      },
    ],
  };

  describe('addMachine', () => {
    it('adds a new machine with generated id and timestamps', () => {
      const { addMachine, machines } = useMachineStore.getState();

      const result = addMachine(testMachineInput);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('テスト機種');
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();

      const state = useMachineStore.getState();
      expect(state.machines.length).toBe(1);
      expect(state.machines[0].id).toBe(result.id);
    });
  });

  describe('updateMachine', () => {
    it('updates an existing machine', async () => {
      const { addMachine, updateMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);
      const originalUpdatedAt = machine.updatedAt;

      // Wait a tick to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 1));

      act(() => {
        updateMachine(machine.id, { name: '更新後の名前' });
      });

      const state = useMachineStore.getState();
      const updatedMachine = state.machines.find((m) => m.id === machine.id);
      expect(updatedMachine?.name).toBe('更新後の名前');
      expect(updatedMachine?.updatedAt).toBeGreaterThanOrEqual(originalUpdatedAt);
    });

    it('does not update non-existent machine', () => {
      const { addMachine, updateMachine } = useMachineStore.getState();
      addMachine(testMachineInput);

      act(() => {
        updateMachine('non-existent-id', { name: '更新後' });
      });

      const state = useMachineStore.getState();
      expect(state.machines[0].name).toBe('テスト機種');
    });
  });

  describe('deleteMachine', () => {
    it('removes machine from the list', () => {
      const { addMachine, deleteMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      expect(useMachineStore.getState().machines.length).toBe(1);

      act(() => {
        deleteMachine(machine.id);
      });

      expect(useMachineStore.getState().machines.length).toBe(0);
    });

    it('clears selectedMachineId if deleted machine was selected', () => {
      const { addMachine, selectMachine, deleteMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      act(() => {
        selectMachine(machine.id);
      });

      expect(useMachineStore.getState().selectedMachineId).toBe(machine.id);

      act(() => {
        deleteMachine(machine.id);
      });

      expect(useMachineStore.getState().selectedMachineId).toBeNull();
    });
  });

  describe('selectMachine', () => {
    it('sets selectedMachineId', () => {
      const { addMachine, selectMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      act(() => {
        selectMachine(machine.id);
      });

      expect(useMachineStore.getState().selectedMachineId).toBe(machine.id);
    });

    it('can set selectedMachineId to null', () => {
      const { addMachine, selectMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      act(() => {
        selectMachine(machine.id);
        selectMachine(null);
      });

      expect(useMachineStore.getState().selectedMachineId).toBeNull();
    });
  });

  describe('getSelectedMachine', () => {
    it('returns null when no machine is selected', () => {
      const { getSelectedMachine } = useMachineStore.getState();
      expect(getSelectedMachine()).toBeNull();
    });

    it('returns selected machine', () => {
      const { addMachine, selectMachine, getSelectedMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      act(() => {
        selectMachine(machine.id);
      });

      const { getSelectedMachine: getSelected } = useMachineStore.getState();
      expect(getSelected()?.id).toBe(machine.id);
    });
  });

  describe('getMachineById', () => {
    it('returns machine by id', () => {
      const { addMachine, getMachineById } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      const { getMachineById: getById } = useMachineStore.getState();
      expect(getById(machine.id)?.name).toBe('テスト機種');
    });

    it('returns undefined for non-existent id', () => {
      const { getMachineById } = useMachineStore.getState();
      expect(getMachineById('non-existent')).toBeUndefined();
    });
  });

  describe('importMachine', () => {
    it('imports new machine', () => {
      const { importMachine } = useMachineStore.getState();
      const machineData: MachineData = {
        ...testMachineInput,
        id: 'import-id',
        createdAt: 1000000,
        updatedAt: 1000000,
      };

      const result = importMachine(machineData);

      expect(result.name).toBe('テスト機種');
      expect(useMachineStore.getState().machines.length).toBe(1);
    });

    it('updates existing machine with same name', () => {
      const { addMachine, importMachine } = useMachineStore.getState();
      addMachine(testMachineInput);

      const importData: MachineData = {
        ...testMachineInput,
        id: 'new-id',
        name: 'テスト機種', // same name
        type: 'AT', // different type
        createdAt: 1000000,
        updatedAt: 1000000,
      };

      act(() => {
        importMachine(importData);
      });

      const state = useMachineStore.getState();
      expect(state.machines.length).toBe(1);
      expect(state.machines[0].type).toBe('AT');
    });
  });

  describe('role management', () => {
    it('addRoleToMachine adds role to existing machine', () => {
      const { addMachine, addRoleToMachine } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);

      act(() => {
        addRoleToMachine(machine.id, {
          name: '新規小役',
          probabilities: { '1': 0.1 },
          hasSettingDiff: true,
          displayOrder: 2,
        });
      });

      const state = useMachineStore.getState();
      const updated = state.machines.find((m) => m.id === machine.id);
      expect(updated?.roles.length).toBe(2);
      expect(updated?.roles[1].name).toBe('新規小役');
    });

    it('updateRole updates existing role', () => {
      const { addMachine, updateRole } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);
      const roleId = machine.roles[0].id;

      act(() => {
        updateRole(machine.id, roleId, { name: '更新小役' });
      });

      const state = useMachineStore.getState();
      const updated = state.machines.find((m) => m.id === machine.id);
      expect(updated?.roles[0].name).toBe('更新小役');
    });

    it('deleteRole removes role from machine', () => {
      const { addMachine, deleteRole } = useMachineStore.getState();
      const machine = addMachine(testMachineInput);
      const roleId = machine.roles[0].id;

      act(() => {
        deleteRole(machine.id, roleId);
      });

      const state = useMachineStore.getState();
      const updated = state.machines.find((m) => m.id === machine.id);
      expect(updated?.roles.length).toBe(0);
    });
  });
});
