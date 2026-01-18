import { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme,
  IconButton,
  Menu,
  Divider,
  Portal,
  Dialog,
  TextInput,
} from 'react-native-paper';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMachineStore, useSessionStore, useSettingsStore } from '../../stores';
import { MachineData } from '../../types';
import { generateSettingSummary } from '../../utils/binomial';
import SettingChart from '../../components/SettingChart';
import CounterRow from '../../components/CounterRow';

export default function CounterScreen() {
  const theme = useTheme();
  const { machines, selectedMachineId, selectMachine, getSelectedMachine } =
    useMachineStore();
  const {
    currentSession,
    startSession,
    endSession,
    updateGameCount,
    incrementCount,
    decrementCount,
    resetCounts,
    updateResults,
  } = useSessionStore();
  const { vibrationEnabled, showCurrentProbability, showTheoreticalProbability } =
    useSettingsStore();

  const [menuVisible, setMenuVisible] = useState(false);
  const [resetDialogVisible, setResetDialogVisible] = useState(false);
  const [gameInputVisible, setGameInputVisible] = useState(false);
  const [gameInputValue, setGameInputValue] = useState('');

  const selectedMachine = getSelectedMachine();

  // 機種選択時にセッションを開始
  useEffect(() => {
    if (selectedMachine && !currentSession) {
      startSession(selectedMachine);
    }
  }, [selectedMachine, currentSession, startSession]);

  // カウント変更時に設定推測を更新
  useEffect(() => {
    if (selectedMachine && currentSession) {
      updateResults(selectedMachine);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.counts, currentSession?.totalGames, selectedMachine, updateResults]);

  const handleMachineSelect = useCallback(
    (machine: MachineData) => {
      if (currentSession && currentSession.machineDataId !== machine.id) {
        Alert.alert(
          '機種を変更',
          '現在のカウントをリセットして機種を変更しますか？',
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '変更',
              onPress: () => {
                endSession(false);
                selectMachine(machine.id);
                startSession(machine);
              },
            },
          ]
        );
      } else {
        selectMachine(machine.id);
        if (!currentSession) {
          startSession(machine);
        }
      }
      setMenuVisible(false);
    },
    [currentSession, selectMachine, startSession, endSession]
  );

  const handleIncrement = useCallback(
    (roleId: string) => {
      if (vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      incrementCount(roleId);
    },
    [incrementCount, vibrationEnabled]
  );

  const handleDecrement = useCallback(
    (roleId: string) => {
      if (vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      decrementCount(roleId);
    },
    [decrementCount, vibrationEnabled]
  );

  const handleGameCountChange = useCallback(
    (delta: number) => {
      if (!currentSession) return;
      if (vibrationEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      updateGameCount(currentSession.totalGames + delta);
    },
    [currentSession, updateGameCount, vibrationEnabled]
  );

  const handleGameInputConfirm = useCallback(() => {
    const value = parseInt(gameInputValue, 10);
    if (!isNaN(value) && value >= 0) {
      updateGameCount(value);
    }
    setGameInputVisible(false);
    setGameInputValue('');
  }, [gameInputValue, updateGameCount]);

  const handleReset = useCallback(() => {
    resetCounts();
    setResetDialogVisible(false);
  }, [resetCounts]);

  const handleSaveSession = useCallback(() => {
    endSession(true);
    Alert.alert('保存完了', '履歴に保存しました');
    if (selectedMachine) {
      startSession(selectedMachine);
    }
  }, [endSession, startSession, selectedMachine]);

  const summary = currentSession
    ? generateSettingSummary(currentSession.results)
    : { label: 'データなし', color: '#888888' };

  if (machines.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onBackground }}>
            機種データがありません
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            機種を追加してカウントを開始しましょう
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/machine/create')}
            style={{ marginTop: 24 }}
          >
            機種を追加
          </Button>
          <Button
            mode="outlined"
            onPress={() => router.push('/scan')}
            style={{ marginTop: 12 }}
          >
            QRコードで追加
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 機種選択 */}
      <View style={styles.machineSelector}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              icon="chevron-down"
              contentStyle={{ flexDirection: 'row-reverse' }}
              style={{ flex: 1 }}
            >
              {selectedMachine?.name || '機種を選択'}
            </Button>
          }
          contentStyle={{ backgroundColor: theme.colors.surface }}
        >
          {machines.map((machine) => (
            <Menu.Item
              key={machine.id}
              onPress={() => handleMachineSelect(machine)}
              title={machine.name}
              leadingIcon={
                machine.id === selectedMachineId ? 'check' : undefined
              }
            />
          ))}
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              router.push('/machine/create');
            }}
            title="機種を追加"
            leadingIcon="plus"
          />
        </Menu>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {selectedMachine && currentSession && (
          <>
            {/* 設定推測結果 */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                  設定推測結果
                </Text>
                <SettingChart results={currentSession.results} />
                <View style={styles.summaryContainer}>
                  <View
                    style={[
                      styles.summaryBadge,
                      { backgroundColor: summary.color },
                    ]}
                  >
                    <Text style={styles.summaryText}>{summary.label}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* ゲーム数 */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <View style={styles.gameCountContainer}>
                  <Text variant="titleMedium">ゲーム数</Text>
                  <View style={styles.gameCountControls}>
                    <IconButton
                      icon="minus"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => handleGameCountChange(-100)}
                      onLongPress={() => handleGameCountChange(-1000)}
                    />
                    <IconButton
                      icon="minus"
                      mode="contained-tonal"
                      size={16}
                      onPress={() => handleGameCountChange(-10)}
                    />
                    <Button
                      mode="text"
                      onPress={() => {
                        setGameInputValue(String(currentSession.totalGames));
                        setGameInputVisible(true);
                      }}
                    >
                      <Text variant="headlineMedium">
                        {currentSession.totalGames.toLocaleString()}G
                      </Text>
                    </Button>
                    <IconButton
                      icon="plus"
                      mode="contained-tonal"
                      size={16}
                      onPress={() => handleGameCountChange(10)}
                    />
                    <IconButton
                      icon="plus"
                      mode="contained-tonal"
                      size={20}
                      onPress={() => handleGameCountChange(100)}
                      onLongPress={() => handleGameCountChange(1000)}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* 小役カウンター */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ marginBottom: 12 }}>
                  小役カウント
                </Text>
                {selectedMachine.roles
                  .filter((role) => role.hasSettingDiff)
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((role) => (
                    <CounterRow
                      key={role.id}
                      role={role}
                      count={currentSession.counts[role.id] || 0}
                      totalGames={
                        currentSession.totalGames - currentSession.startGames
                      }
                      onIncrement={() => handleIncrement(role.id)}
                      onDecrement={() => handleDecrement(role.id)}
                      showCurrentProbability={showCurrentProbability}
                      showTheoreticalProbability={showTheoreticalProbability}
                      settings={selectedMachine.settings}
                    />
                  ))}
              </Card.Content>
            </Card>

            {/* アクションボタン */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={() => setResetDialogVisible(true)}
                style={styles.actionButton}
                icon="refresh"
              >
                リセット
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveSession}
                style={styles.actionButton}
                icon="content-save"
              >
                履歴に保存
              </Button>
            </View>
          </>
        )}
      </ScrollView>

      {/* リセット確認ダイアログ */}
      <Portal>
        <Dialog
          visible={resetDialogVisible}
          onDismiss={() => setResetDialogVisible(false)}
        >
          <Dialog.Title>カウントをリセット</Dialog.Title>
          <Dialog.Content>
            <Text>すべてのカウントとゲーム数をリセットしますか？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetDialogVisible(false)}>キャンセル</Button>
            <Button onPress={handleReset}>リセット</Button>
          </Dialog.Actions>
        </Dialog>

        {/* ゲーム数入力ダイアログ */}
        <Dialog
          visible={gameInputVisible}
          onDismiss={() => setGameInputVisible(false)}
        >
          <Dialog.Title>ゲーム数を入力</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              keyboardType="numeric"
              value={gameInputValue}
              onChangeText={setGameInputValue}
              placeholder="0"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setGameInputVisible(false)}>キャンセル</Button>
            <Button onPress={handleGameInputConfirm}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  machineSelector: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 12,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  summaryContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  summaryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  summaryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameCountContainer: {
    alignItems: 'center',
  },
  gameCountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
