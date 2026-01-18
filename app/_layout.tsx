import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
} from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { useMachineStore, useSettingsStore } from '../stores';

// カスタムカラーパレット（ダーク）
const customDarkColors = {
  ...MD3DarkTheme.colors,
  primary: '#7c4dff',
  primaryContainer: '#4a148c',
  secondary: '#03dac6',
  secondaryContainer: '#005047',
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceVariant: '#0f3460',
  error: '#cf6679',
  onPrimary: '#ffffff',
  onSecondary: '#000000',
  onBackground: '#e6e1e5',
  onSurface: '#e6e1e5',
};

// カスタムカラーパレット（ライト）
const customLightColors = {
  ...MD3LightTheme.colors,
  primary: '#6200ee',
  primaryContainer: '#bb86fc',
  secondary: '#03dac6',
  secondaryContainer: '#018786',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#b00020',
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: customDarkColors,
};

const customLightTheme = {
  ...MD3LightTheme,
  colors: customLightColors,
};

// React Navigation用のテーマ
const navDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: customDarkColors.primary,
    background: customDarkColors.background,
    card: customDarkColors.surface,
    text: customDarkColors.onSurface,
    border: customDarkColors.surfaceVariant,
    notification: customDarkColors.error,
  },
};

const navLightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: customLightColors.primary,
    background: customLightColors.background,
    card: customLightColors.surface,
    text: '#000000',
    border: '#e0e0e0',
    notification: customLightColors.error,
  },
};

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const themeSetting = useSettingsStore((state) => state.theme);
  const initialize = useMachineStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isDark =
    themeSetting === 'system'
      ? systemColorScheme === 'dark'
      : themeSetting === 'dark';

  const paperTheme = isDark ? customDarkTheme : customLightTheme;
  const navigationTheme = isDark ? navDarkTheme : navLightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: paperTheme.colors.surface,
            },
            headerTintColor: paperTheme.colors.onSurface,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            contentStyle: {
              backgroundColor: paperTheme.colors.background,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="machine/create"
            options={{
              title: '機種データ作成',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="machine/[id]"
            options={{
              title: '機種詳細',
            }}
          />
          <Stack.Screen
            name="scan"
            options={{
              title: 'QRコード読み取り',
              presentation: 'modal',
            }}
          />
        </Stack>
      </ThemeProvider>
    </PaperProvider>
  );
}
