import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Role, Setting } from '../types';
import {
  formatProbability,
  calculateCurrentProbability,
} from '../utils/binomial';

interface CounterRowProps {
  role: Role;
  count: number;
  totalGames: number;
  onIncrement: () => void;
  onDecrement: () => void;
  showCurrentProbability: boolean;
  showTheoreticalProbability: boolean;
  settings: Setting[];
}

export default function CounterRow({
  role,
  count,
  totalGames,
  onIncrement,
  onDecrement,
  showCurrentProbability,
  showTheoreticalProbability,
  settings,
}: CounterRowProps) {
  const theme = useTheme();

  const currentProb = calculateCurrentProbability(count, totalGames);
  const currentProbStr =
    totalGames > 0 ? formatProbability(currentProb, 2) : '-';

  // 設定6の理論確率を表示（高設定の基準）
  const setting6 = settings.find((s) => s.id === '6');
  const theoreticalProb = setting6
    ? formatProbability(role.probabilities[setting6.id], 2)
    : '-';

  // 現在確率と理論値の比較
  const isAboveTheory =
    totalGames > 0 &&
    setting6 &&
    currentProb > role.probabilities[setting6.id];

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: theme.colors.surfaceVariant },
      ]}
    >
      <View style={styles.mainRow}>
        <View style={styles.roleInfo}>
          <Text
            variant="titleSmall"
            style={[styles.roleName, { color: theme.colors.onSurface }]}
          >
            {role.name}
          </Text>
          {showCurrentProbability && (
            <Text
              variant="bodySmall"
              style={[
                styles.probability,
                {
                  color: isAboveTheory
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              現在: {currentProbStr}
            </Text>
          )}
          {showTheoreticalProbability && (
            <Text
              variant="bodySmall"
              style={[
                styles.probability,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              設6理論: {theoreticalProb}
            </Text>
          )}
        </View>

        <View style={styles.counterControls}>
          <Pressable
            onPress={onDecrement}
            style={({ pressed }) => [
              styles.counterButton,
              styles.decrementButton,
              {
                backgroundColor: pressed
                  ? theme.colors.errorContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.error }}
            >
              -
            </Text>
          </Pressable>

          <View style={styles.countDisplay}>
            <Text
              variant="headlineSmall"
              style={[styles.countText, { color: theme.colors.onSurface }]}
            >
              {count}
            </Text>
          </View>

          <Pressable
            onPress={onIncrement}
            style={({ pressed }) => [
              styles.counterButton,
              styles.incrementButton,
              {
                backgroundColor: pressed
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <Text
              variant="headlineMedium"
              style={{ color: theme.colors.primary }}
            >
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontWeight: '600',
    marginBottom: 2,
  },
  probability: {
    fontSize: 11,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  counterButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {},
  incrementButton: {},
  countDisplay: {
    minWidth: 60,
    alignItems: 'center',
  },
  countText: {
    fontWeight: '700',
  },
});
