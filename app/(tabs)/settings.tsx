import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  List,
  Switch,
  Divider,
  Button,
  SegmentedButtons,
} from 'react-native-paper';
import { useSettingsStore, useMachineStore, useSessionStore } from '../../stores';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const theme = useTheme();
  const {
    theme: themeSetting,
    vibrationEnabled,
    showCurrentProbability,
    showTheoreticalProbability,
    autoSaveSession,
    setTheme,
    setVibrationEnabled,
    setShowCurrentProbability,
    setShowTheoreticalProbability,
    setAutoSaveSession,
    resetSettings,
  } = useSettingsStore();

  const { machines } = useMachineStore();
  const { sessionHistory, clearHistory } = useSessionStore();

  const handleResetSettings = () => {
    Alert.alert(
      '設定をリセット',
      'すべての設定をデフォルトに戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: resetSettings,
        },
      ]
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'すべてのデータを削除',
      '機種データと履歴をすべて削除しますか？\nこの操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('完了', 'データを削除しました');
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* 表示設定 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            表示設定
          </Text>

          <Text
            variant="bodyMedium"
            style={{ marginBottom: 8, color: theme.colors.onSurface }}
          >
            テーマ
          </Text>
          <SegmentedButtons
            value={themeSetting}
            onValueChange={(value) =>
              setTheme(value as 'light' | 'dark' | 'system')
            }
            buttons={[
              { value: 'light', label: 'ライト' },
              { value: 'dark', label: 'ダーク' },
              { value: 'system', label: 'システム' },
            ]}
            style={{ marginBottom: 16 }}
          />

          <Divider style={{ marginVertical: 8 }} />

          <List.Item
            title="現在確率を表示"
            description="カウント中の現在の確率を表示"
            right={() => (
              <Switch
                value={showCurrentProbability}
                onValueChange={setShowCurrentProbability}
              />
            )}
          />
          <List.Item
            title="理論確率を表示"
            description="設定6の理論確率を表示"
            right={() => (
              <Switch
                value={showTheoreticalProbability}
                onValueChange={setShowTheoreticalProbability}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* 操作設定 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            操作設定
          </Text>

          <List.Item
            title="バイブレーション"
            description="カウント時に振動フィードバック"
            right={() => (
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
              />
            )}
          />
          <List.Item
            title="自動保存"
            description="アプリ終了時にセッションを保存"
            right={() => (
              <Switch
                value={autoSaveSession}
                onValueChange={setAutoSaveSession}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* データ管理 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            データ管理
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {machines.length}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                機種データ
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                {sessionHistory.length}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                履歴件数
              </Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 16 }} />

          <Button
            mode="outlined"
            onPress={handleResetSettings}
            style={styles.button}
          >
            設定をリセット
          </Button>
          <Button
            mode="outlined"
            onPress={handleClearAllData}
            textColor={theme.colors.error}
            style={styles.button}
          >
            履歴をすべて削除
          </Button>
        </Card.Content>
      </Card>

      {/* アプリ情報 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            アプリ情報
          </Text>

          <List.Item
            title="バージョン"
            description={appVersion}
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="SlotAnalyzer"
            description="パチスロ設定判別ツール"
            left={(props) => <List.Icon {...props} icon="slot-machine" />}
          />
        </Card.Content>
      </Card>

      {/* 使い方 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            使い方
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}
          >
            1. 機種一覧から打つ機種を選択{'\n'}
            2. 小役が成立したら+ボタンでカウント{'\n'}
            3. 定期的にゲーム数を更新{'\n'}
            4. 設定推測結果をチェック{'\n'}
            5. 終了時は「履歴に保存」で記録
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          © 2026 SlotAnalyzer
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  button: {
    marginTop: 8,
  },
  footer: {
    paddingVertical: 24,
  },
});
