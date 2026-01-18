# SlotAnalyzer モバイルテスト自動化ガイド

## 必要環境

### Android実機の場合
1. USBデバッグを有効化
2. PCにUSB接続
3. ADBでデバイスが認識されていることを確認: `adb devices`

### Androidエミュレータの場合
1. Android Studio でエミュレータを起動
2. `adb devices` で認識されていることを確認

## mobile-mcp コマンド

Claude Code から以下のMCPツールが利用可能です：

### デバイス管理
```
mobile_list_available_devices - 利用可能なデバイス一覧
mobile_list_apps - インストール済みアプリ一覧
mobile_launch_app - アプリ起動
mobile_terminate_app - アプリ終了
mobile_install_app - アプリインストール
```

### 画面操作
```
mobile_take_screenshot - スクリーンショット撮影
mobile_list_elements_on_screen - 画面要素取得
mobile_click_on_screen_at_coordinates - タップ
mobile_swipe_on_screen - スワイプ
mobile_type_keys - テキスト入力
mobile_press_button - ボタン押下（HOME, BACK等）
```

## テストシナリオ例

### 1. アプリ起動テスト
```
1. mobile_launch_app でアプリを起動
2. mobile_take_screenshot で画面確認
3. mobile_list_elements_on_screen で要素を取得
```

### 2. カウント機能テスト
```
1. アプリ起動
2. 機種選択ドロップダウンをタップ
3. 機種を選択
4. ぶどうカウントボタンをタップ
5. スクリーンショットで確認
```

### 3. 機種インポートテスト
```
1. 機種タブに移動
2. インポートボタンをタップ
3. 機種を選択してインポート
4. 結果確認
```

## Expo Development Build

mobile-mcp でテストするには、Expo Development Build が必要です。

```bash
# EAS CLI インストール
npm install -g eas-cli

# EAS にログイン
eas login

# Development Build 作成
eas build --profile development --platform android

# または ローカルビルド
npx expo run:android
```

## 補足

- Expoのdevelopment buildでは、パッケージ名は通常 `com.slotanalyzer.app` です
- 実機テストには開発用署名が必要です
- エミュレータでのテストは最も簡単です
