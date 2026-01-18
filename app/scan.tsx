import { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, Card } from 'react-native-paper';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { useMachineStore } from '../stores';
import { stringToQRData, decodeMachineData } from '../utils/qrCodec';

export default function ScanScreen() {
  const theme = useTheme();
  const { importMachine, selectMachine } = useMachineStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanned || processing) return;

      setScanned(true);
      setProcessing(true);

      try {
        const { data } = result;
        const qrData = stringToQRData(data);

        if (!qrData) {
          Alert.alert(
            '読み取りエラー',
            'このQRコードは機種データとして認識できません',
            [
              {
                text: '再スキャン',
                onPress: () => {
                  setScanned(false);
                  setProcessing(false);
                },
              },
              {
                text: 'キャンセル',
                onPress: () => router.back(),
              },
            ]
          );
          return;
        }

        const machine = decodeMachineData(qrData);

        Alert.alert(
          '機種データを検出',
          `「${machine.name}」をインポートしますか？\n\n` +
            `タイプ: ${machine.type}\n` +
            `小役: ${machine.roles.length}種類`,
          [
            {
              text: 'キャンセル',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
              },
            },
            {
              text: 'インポート',
              onPress: () => {
                const imported = importMachine(machine);
                selectMachine(imported.id);
                Alert.alert(
                  'インポート完了',
                  `「${imported.name}」をインポートしました`,
                  [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                );
              },
            },
          ]
        );
      } catch {
        Alert.alert('エラー', 'QRコードの処理中にエラーが発生しました', [
          {
            text: '再スキャン',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
          {
            text: 'キャンセル',
            onPress: () => router.back(),
          },
        ]);
      }
    },
    [scanned, processing, importMachine, selectMachine]
  );

  if (!permission) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={{ marginTop: 16 }}>
          カメラの権限を確認中...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Card style={[styles.permissionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.permissionContent}>
            <Text variant="headlineSmall" style={{ textAlign: 'center' }}>
              カメラの許可が必要です
            </Text>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 12,
              }}
            >
              QRコードを読み取るためにカメラへのアクセスを許可してください
            </Text>
            <Button
              mode="contained"
              onPress={requestPermission}
              style={{ marginTop: 24 }}
            >
              カメラを許可
            </Button>
            <Button
              mode="outlined"
              onPress={() => router.back()}
              style={{ marginTop: 12 }}
            >
              キャンセル
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.overlayTop} />
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTopLeft]} />
              <View style={[styles.corner, styles.cornerTopRight]} />
              <View style={[styles.corner, styles.cornerBottomLeft]} />
              <View style={[styles.corner, styles.cornerBottomRight]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayBottom}>
            <Text
              variant="bodyLarge"
              style={{ color: '#ffffff', textAlign: 'center', marginTop: 24 }}
            >
              QRコードをスキャン枠内に映してください
            </Text>
            {processing && (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        </View>
      </CameraView>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          キャンセル
        </Button>
      </View>
    </View>
  );
}

const SCAN_AREA_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
  },
  permissionContent: {
    alignItems: 'center',
    padding: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#ffffff',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 48,
  },
  cancelButton: {
    borderRadius: 24,
  },
});
