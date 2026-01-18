import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Searchbar,
  List,
  Chip,
  useTheme,
  Portal,
  Dialog,
  DataTable,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useMachineStore } from '../stores/machineStore';
import {
  getPopularMachines,
  searchPopularMachine,
  convertScrapedToMachine,
  ScrapedMachineData,
} from '../services/machineDataService';

export default function ImportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { importMachine } = useMachineStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<ScrapedMachineData | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  const popularMachines = getPopularMachines();
  const filteredMachines = searchQuery
    ? searchPopularMachine(searchQuery)
    : popularMachines;

  const handleImport = () => {
    if (!selectedMachine) return;

    try {
      const machineData = convertScrapedToMachine(selectedMachine);
      importMachine({
        ...machineData,
        id: '', // Will be generated
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      Alert.alert(
        'インポート完了',
        `${selectedMachine.name} をインポートしました。`,
        [
          {
            text: 'OK',
            onPress: () => {
              setDialogVisible(false);
              router.back();
            },
          },
        ]
      );
    } catch {
      Alert.alert('エラー', 'インポートに失敗しました。');
    }
  };

  const showMachineDetail = (machine: ScrapedMachineData) => {
    setSelectedMachine(machine);
    setDialogVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Title
            title="機種データインポート"
            subtitle="解析サイトのデータをインポート"
          />
          <Card.Content>
            <Searchbar
              placeholder="機種名で検索..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />

            <View style={styles.chipContainer}>
              <Chip icon="slot-machine" style={styles.chip}>
                {popularMachines.length} 機種
              </Chip>
              <Chip icon="web" style={styles.chip}>
                chonborista.com
              </Chip>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="人気機種" subtitle="プリセットデータ" />
          <Card.Content>
            {filteredMachines.length === 0 ? (
              <Text style={styles.noResults}>該当する機種がありません</Text>
            ) : (
              <List.Section>
                {filteredMachines.map((machine, index) => (
                  <List.Item
                    key={index}
                    title={machine.name}
                    description={`${machine.type} | ${machine.roleData.length + 2}項目`}
                    left={(props) => <List.Icon {...props} icon="slot-machine" />}
                    right={(props) => (
                      <Button
                        mode="outlined"
                        onPress={() => showMachineDetail(machine)}
                        compact
                      >
                        詳細
                      </Button>
                    )}
                    onPress={() => showMachineDetail(machine)}
                    style={styles.listItem}
                  />
                ))}
              </List.Section>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Webスクレイピング" subtitle="Coming Soon" />
          <Card.Content>
            <Text style={styles.comingSoonText}>
              将来的にはURLを入力して直接解析サイトからデータを取得できるようになります。
              現在はプリセットデータのみ利用可能です。
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>{selectedMachine?.name}</Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              {selectedMachine && (
                <>
                  <Text style={styles.sectionTitle}>ボーナス確率</Text>
                  <DataTable>
                    <DataTable.Header>
                      <DataTable.Title>設定</DataTable.Title>
                      <DataTable.Title>BIG</DataTable.Title>
                      <DataTable.Title>REG</DataTable.Title>
                    </DataTable.Header>
                    {selectedMachine.bonusData.map((data, index) => (
                      <DataTable.Row key={index}>
                        <DataTable.Cell>{data.setting}</DataTable.Cell>
                        <DataTable.Cell>{data.big}</DataTable.Cell>
                        <DataTable.Cell>{data.reg}</DataTable.Cell>
                      </DataTable.Row>
                    ))}
                  </DataTable>

                  {selectedMachine.roleData.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, styles.marginTop]}>
                        小役確率
                      </Text>
                      {selectedMachine.roleData.map((role, roleIndex) => (
                        <View key={roleIndex}>
                          <Text style={styles.roleTitle}>{role.name}</Text>
                          <DataTable>
                            <DataTable.Header>
                              <DataTable.Title>設定</DataTable.Title>
                              <DataTable.Title>確率</DataTable.Title>
                            </DataTable.Header>
                            {Object.entries(role.probabilities).map(
                              ([setting, prob], index) => (
                                <DataTable.Row key={index}>
                                  <DataTable.Cell>{setting}</DataTable.Cell>
                                  <DataTable.Cell>{prob}</DataTable.Cell>
                                </DataTable.Row>
                              )
                            )}
                          </DataTable>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>キャンセル</Button>
            <Button mode="contained" onPress={handleImport}>
              インポート
            </Button>
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  searchbar: {
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  noResults: {
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 24,
  },
  comingSoonText: {
    opacity: 0.7,
    lineHeight: 20,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogScrollArea: {
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  marginTop: {
    marginTop: 24,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
});
