import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useSessionStore, useMachineStore } from '../../stores';
import { CountSession } from '../../types';
import { formatProbability, generateSettingSummary } from '../../utils/binomial';

export default function HistoryScreen() {
  const theme = useTheme();
  const { sessionHistory, deleteSession, clearHistory, loadSession } =
    useSessionStore();
  const { getMachineById, selectMachine } = useMachineStore();

  const handleDelete = (session: CountSession) => {
    Alert.alert(
      '履歴を削除',
      `この履歴を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteSession(session.id),
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      '全履歴を削除',
      'すべての履歴を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };

  const handleRestore = (session: CountSession) => {
    const machine = getMachineById(session.machineDataId);
    if (!machine) {
      Alert.alert('エラー', 'この機種データは削除されています');
      return;
    }

    Alert.alert(
      '履歴を復元',
      `「${session.machineName}」の履歴を復元してカウントを続けますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '復元',
          onPress: () => {
            selectMachine(machine.id);
            loadSession(session);
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const renderSessionItem = ({ item }: { item: CountSession }) => {
    const summary = generateSettingSummary(item.results);
    const topResult = [...item.results].sort(
      (a, b) => b.probability - a.probability
    )[0];
    const effectiveGames = item.totalGames - item.startGames;

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.machineInfo}>
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {item.machineName}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {formatDate(item.createdAt)}
              </Text>
            </View>
            <View style={styles.actions}>
              <IconButton
                icon="restore"
                size={20}
                onPress={() => handleRestore(item)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleDelete(item)}
              />
            </View>
          </View>

          <View style={styles.statsRow}>
            <Chip mode="outlined" compact style={styles.chip}>
              {effectiveGames.toLocaleString()}G
            </Chip>
            <View
              style={[
                styles.summaryBadge,
                { backgroundColor: summary.color },
              ]}
            >
              <Text style={styles.summaryText}>{summary.label}</Text>
            </View>
          </View>

          {topResult && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
            >
              最有力: {topResult.settingName} (
              {(topResult.probability * 100).toFixed(1)}%)
            </Text>
          )}

          {item.memo && (
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 4,
                fontStyle: 'italic',
              }}
            >
              メモ: {item.memo}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {sessionHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground }}
          >
            履歴がありません
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            カウント終了時に「履歴に保存」で記録できます
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.headerBar}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {sessionHistory.length}件の履歴
            </Text>
            <Button
              mode="text"
              onPress={handleClearAll}
              textColor={theme.colors.error}
              compact
            >
              すべて削除
            </Button>
          </View>
          <FlatList
            data={sessionHistory}
            renderItem={renderSessionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContent: {
    padding: 12,
    paddingTop: 0,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  machineInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginRight: -8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    height: 28,
  },
  summaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
});
