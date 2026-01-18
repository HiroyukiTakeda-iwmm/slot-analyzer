import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  useTheme,
  IconButton,
  FAB,
  Chip,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useMachineStore } from '../../stores';
import { MachineData } from '../../types';

export default function MachinesScreen() {
  const theme = useTheme();
  const { machines, deleteMachine, selectMachine } = useMachineStore();

  const handleDelete = (machine: MachineData) => {
    Alert.alert(
      '機種を削除',
      `「${machine.name}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => deleteMachine(machine.id),
        },
      ]
    );
  };

  const handleSelect = (machine: MachineData) => {
    selectMachine(machine.id);
    router.push('/(tabs)');
  };

  const handleEdit = (machine: MachineData) => {
    router.push(`/machine/${machine.id}`);
  };

  const renderMachineItem = ({ item }: { item: MachineData }) => (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => handleSelect(item)}
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.machineInfo}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
            {item.name}
          </Text>
          <View style={styles.chipRow}>
            <Chip
              mode="outlined"
              compact
              style={{ marginRight: 8 }}
              textStyle={{ fontSize: 10 }}
            >
              {item.type}
            </Chip>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              小役: {item.roles.filter((r) => r.hasSettingDiff).length}種類
            </Text>
          </View>
          {item.author && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
            >
              作成者: {item.author}
            </Text>
          )}
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleEdit(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => handleDelete(item)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {machines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground }}
          >
            機種データがありません
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            機種を追加してカウントを始めましょう
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/machine/create')}
            style={{ marginTop: 24 }}
          >
            機種を追加
          </Button>
        </View>
      ) : (
        <FlatList
          data={machines}
          renderItem={renderMachineItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.fabContainer}>
        <FAB
          icon="download"
          style={[styles.fab, { backgroundColor: theme.colors.tertiaryContainer }]}
          color={theme.colors.onTertiaryContainer}
          onPress={() => router.push('/import')}
          size="medium"
        />
        <FAB
          icon="qrcode-scan"
          style={[styles.fab, { backgroundColor: theme.colors.secondaryContainer }]}
          color={theme.colors.onSecondaryContainer}
          onPress={() => router.push('/scan')}
          size="medium"
        />
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
          color={theme.colors.onPrimaryContainer}
          onPress={() => router.push('/machine/create')}
        />
      </View>
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
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  machineInfo: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    elevation: 4,
  },
});
