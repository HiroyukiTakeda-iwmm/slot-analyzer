import { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  useTheme,
  SegmentedButtons,
  IconButton,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { useMachineStore } from '../../stores';
import { DEFAULT_SETTINGS, Role } from '../../types';
import {
  encodeMachineData,
  qrDataToString,
  generateUUID,
} from '../../utils/qrCodec';
import {
  denominatorToProbability,
  probabilityToDenominator,
} from '../../utils/binomial';

interface RoleInput {
  id: string;
  name: string;
  probabilities: string[];
  hasSettingDiff: boolean;
}

export default function MachineDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMachineById, updateMachine } = useMachineStore();

  const machine = getMachineById(id || '');

  const [name, setName] = useState('');
  const [type, setType] = useState<'A-type' | 'AT' | 'ART'>('A-type');
  const [roles, setRoles] = useState<RoleInput[]>([]);
  const [qrDialogVisible, setQrDialogVisible] = useState(false);
  const [qrData, setQrData] = useState<string>('');

  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleInput | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleProbs, setNewRoleProbs] = useState<string[]>(
    DEFAULT_SETTINGS.map(() => '')
  );

  // 機種データを読み込み
  useEffect(() => {
    if (machine) {
      setName(machine.name);
      setType(machine.type);
      setRoles(
        machine.roles.map((role) => ({
          id: role.id,
          name: role.name,
          probabilities: DEFAULT_SETTINGS.map((setting) => {
            const prob = role.probabilities[setting.id];
            if (prob && prob > 0) {
              return probabilityToDenominator(prob).toFixed(2);
            }
            return '';
          }),
          hasSettingDiff: role.hasSettingDiff,
        }))
      );
    }
  }, [machine]);

  const handleAddRole = useCallback(() => {
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleProbs(DEFAULT_SETTINGS.map(() => ''));
    setRoleDialogVisible(true);
  }, []);

  const handleEditRole = useCallback((role: RoleInput) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleProbs([...role.probabilities]);
    setRoleDialogVisible(true);
  }, []);

  const handleSaveRole = useCallback(() => {
    if (!newRoleName.trim()) {
      Alert.alert('エラー', '小役名を入力してください');
      return;
    }

    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id
            ? {
                ...r,
                name: newRoleName.trim(),
                probabilities: newRoleProbs,
              }
            : r
        )
      );
    } else {
      const newRole: RoleInput = {
        id: generateUUID(),
        name: newRoleName.trim(),
        probabilities: newRoleProbs,
        hasSettingDiff: true,
      };
      setRoles((prev) => [...prev, newRole]);
    }

    setRoleDialogVisible(false);
  }, [editingRole, newRoleName, newRoleProbs]);

  const handleDeleteRole = useCallback((roleId: string) => {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
  }, []);

  const handleSave = useCallback(() => {
    if (!machine || !name.trim()) {
      Alert.alert('エラー', '機種名を入力してください');
      return;
    }

    if (roles.length === 0) {
      Alert.alert('エラー', '少なくとも1つの小役を追加してください');
      return;
    }

    const machineRoles: Role[] = roles.map((role, index) => {
      const probabilities: Record<string, number> = {};
      DEFAULT_SETTINGS.forEach((setting, i) => {
        const denominator = parseFloat(role.probabilities[i]);
        if (!isNaN(denominator) && denominator > 0) {
          probabilities[setting.id] = denominatorToProbability(denominator);
        } else {
          probabilities[setting.id] = 0;
        }
      });

      return {
        id: role.id,
        name: role.name,
        probabilities,
        hasSettingDiff: role.hasSettingDiff,
        displayOrder: index + 1,
      };
    });

    updateMachine(machine.id, {
      name: name.trim(),
      type,
      roles: machineRoles,
    });

    Alert.alert('保存完了', `「${name.trim()}」を更新しました`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }, [machine, name, type, roles, updateMachine]);

  const handleGenerateQR = useCallback(() => {
    if (!machine || !name.trim() || roles.length === 0) return;

    const machineRoles: Role[] = roles.map((role, index) => {
      const probabilities: Record<string, number> = {};
      DEFAULT_SETTINGS.forEach((setting, i) => {
        const denominator = parseFloat(role.probabilities[i]);
        if (!isNaN(denominator) && denominator > 0) {
          probabilities[setting.id] = denominatorToProbability(denominator);
        } else {
          probabilities[setting.id] = 0;
        }
      });

      return {
        id: role.id,
        name: role.name,
        probabilities,
        hasSettingDiff: role.hasSettingDiff,
        displayOrder: index + 1,
      };
    });

    const tempMachine = {
      ...machine,
      name: name.trim(),
      type,
      roles: machineRoles,
    };

    const qr = encodeMachineData(tempMachine);
    const qrString = qrDataToString(qr);
    setQrData(qrString);
    setQrDialogVisible(true);
  }, [machine, name, type, roles]);

  if (!machine) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="bodyLarge">機種が見つかりません</Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
          戻る
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* 基本情報 */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              基本情報
            </Text>
            <TextInput
              mode="outlined"
              label="機種名"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <Text variant="bodyMedium" style={{ marginTop: 12, marginBottom: 8 }}>
              機種タイプ
            </Text>
            <SegmentedButtons
              value={type}
              onValueChange={(value) =>
                setType(value as 'A-type' | 'AT' | 'ART')
              }
              buttons={[
                { value: 'A-type', label: 'Aタイプ' },
                { value: 'AT', label: 'AT' },
                { value: 'ART', label: 'ART' },
              ]}
            />
          </Card.Content>
        </Card>

        {/* 小役設定 */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium">小役設定</Text>
              <Button mode="contained-tonal" onPress={handleAddRole} icon="plus">
                追加
              </Button>
            </View>

            {roles.length === 0 ? (
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
              >
                小役を追加してください
              </Text>
            ) : (
              roles.map((role, index) => (
                <View key={role.id}>
                  {index > 0 && <Divider style={{ marginVertical: 8 }} />}
                  <View style={styles.roleItem}>
                    <View style={styles.roleInfo}>
                      <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                        {role.name}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {role.probabilities
                          .filter((p) => p.trim() !== '')
                          .slice(0, 3)
                          .map((p, i) => `設${i + 1}:1/${p}`)
                          .join(', ')}
                        ...
                      </Text>
                    </View>
                    <View style={styles.roleActions}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditRole(role)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => handleDeleteRole(role.id)}
                      />
                    </View>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* アクションボタン */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={handleGenerateQR}
            style={styles.actionButton}
            icon="qrcode"
            disabled={roles.length === 0 || !name.trim()}
          >
            QRコード生成
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.actionButton}
            icon="content-save"
            disabled={roles.length === 0 || !name.trim()}
          >
            保存
          </Button>
        </View>
      </ScrollView>

      {/* 小役追加/編集ダイアログ */}
      <Portal>
        <Dialog
          visible={roleDialogVisible}
          onDismiss={() => setRoleDialogVisible(false)}
          style={{ maxHeight: '80%' }}
        >
          <Dialog.Title>
            {editingRole ? '小役を編集' : '小役を追加'}
          </Dialog.Title>
          <Dialog.ScrollArea style={{ maxHeight: 400, paddingHorizontal: 0 }}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24 }}>
              <TextInput
                mode="outlined"
                label="小役名"
                value={newRoleName}
                onChangeText={setNewRoleName}
                placeholder="例: ぶどう"
                style={styles.input}
              />
              <Text
                variant="bodyMedium"
                style={{ marginTop: 16, marginBottom: 8 }}
              >
                設定別確率（分母のみ入力）
              </Text>
              {DEFAULT_SETTINGS.map((setting, index) => (
                <TextInput
                  key={setting.id}
                  mode="outlined"
                  label={`${setting.name} (1/○)`}
                  value={newRoleProbs[index]}
                  onChangeText={(text) => {
                    const newProbs = [...newRoleProbs];
                    newProbs[index] = text;
                    setNewRoleProbs(newProbs);
                  }}
                  placeholder="例: 6.49"
                  keyboardType="decimal-pad"
                  style={styles.probInput}
                  dense
                />
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setRoleDialogVisible(false)}>
              キャンセル
            </Button>
            <Button onPress={handleSaveRole}>保存</Button>
          </Dialog.Actions>
        </Dialog>

        {/* QRコードダイアログ */}
        <Dialog
          visible={qrDialogVisible}
          onDismiss={() => setQrDialogVisible(false)}
        >
          <Dialog.Title>QRコード</Dialog.Title>
          <Dialog.Content style={{ alignItems: 'center' }}>
            {qrData && (
              <View style={styles.qrContainer}>
                <QRCode value={qrData} size={200} backgroundColor="white" />
              </View>
            )}
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              このQRコードを共有すると{'\n'}
              他のユーザーが機種データをインポートできます
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQrDialogVisible(false)}>閉じる</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  input: {
    marginBottom: 8,
  },
  probInput: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roleInfo: {
    flex: 1,
  },
  roleActions: {
    flexDirection: 'row',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
});
