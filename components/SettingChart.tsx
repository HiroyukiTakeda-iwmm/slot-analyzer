import { View, StyleSheet, DimensionValue } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SettingProbability } from '../types';

interface SettingChartProps {
  results: SettingProbability[];
}

// 設定ごとの色
const SETTING_COLORS: Record<string, string> = {
  '1': '#78909c', // 灰色
  '2': '#90a4ae',
  '3': '#ffb74d', // オレンジ
  '4': '#ffa726',
  '5': '#66bb6a', // 緑
  '6': '#4caf50',
  L: '#e91e63', // ピンク（L設定用）
};

export default function SettingChart({ results }: SettingChartProps) {
  const theme = useTheme();

  // 確率が高い順にソート（表示用）
  const sortedResults = [...results].sort((a, b) => b.probability - a.probability);

  // 最大確率を取得（バーの幅計算用）
  const maxProbability = Math.max(...results.map((r) => r.probability), 0.01);

  return (
    <View style={styles.container}>
      {sortedResults.map((result) => {
        const percentage = (result.probability * 100).toFixed(1);
        const barWidth = `${(result.probability / maxProbability) * 100}%` as DimensionValue;
        const color = SETTING_COLORS[result.settingId] || theme.colors.primary;

        return (
          <View key={result.settingId} style={styles.row}>
            <Text
              variant="bodyMedium"
              style={[styles.settingLabel, { color: theme.colors.onSurface }]}
            >
              {result.settingName}
            </Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: barWidth,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text
              variant="bodyMedium"
              style={[styles.percentage, { color: theme.colors.onSurface }]}
            >
              {percentage}%
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
  },
  settingLabel: {
    width: 50,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  percentage: {
    width: 50,
    textAlign: 'right',
    fontWeight: '600',
  },
});
