# SlotAnalyzer テスト環境

## テストの種類と実行方法

### 1. ユニットテスト (Jest)

stores, utils のロジックテスト。

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付き
npm run test:coverage
```

**テストファイル:**
- `__tests__/utils/binomial.test.ts` - 確率計算関数のテスト
- `__tests__/utils/qrCodec.test.ts` - QRコードエンコード/デコードのテスト
- `__tests__/stores/machineStore.test.ts` - 機種ストアのテスト
- `__tests__/stores/sessionStore.test.ts` - セッションストアのテスト
- `__tests__/stores/settingsStore.test.ts` - 設定ストアのテスト

### 2. E2Eテスト - Web (Playwright)

Expo Webでのブラウザテスト。

```bash
# E2Eテスト実行
npm run test:e2e:web

# UIモードで実行
npx playwright test --ui
```

**テストファイル:**
- `e2e/app.spec.ts` - 基本的なアプリ動作テスト

### 3. E2Eテスト - Mobile (mobile-mcp)

Android/iOSでの実機・エミュレータテスト。

Claude Codeのmobile-mcp MCPサーバーを使用。

詳細: `e2e/mobile/README.md`

## CI/CD

GitHub Actionsで自動テスト実行:
- プッシュ/PRで自動実行
- ユニットテスト → Lint → E2E → ビルド

設定: `.github/workflows/test.yml`

## MCPを活用したテスト

### Playwright MCP (ブラウザテスト)

```
Expo Webを起動して、Playwrightでカウンター画面をテストして
```

### mobile-mcp (モバイルテスト)

```
Androidエミュレータで SlotAnalyzer アプリをテストして
```

## カバレッジ目標

- branches: 70%
- functions: 70%
- lines: 70%
- statements: 70%

## テスト追加ガイド

1. **ユニットテスト**: `__tests__/` ディレクトリに配置
2. **E2Eテスト (Web)**: `e2e/` ディレクトリに配置
3. **E2Eテスト (Mobile)**: `e2e/mobile/` に手順を記載
