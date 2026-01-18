// 機種データ
export interface MachineData {
  id: string;
  name: string;
  type: 'A-type' | 'AT' | 'ART';
  settings: Setting[];
  roles: Role[];
  createdAt: number;
  updatedAt: number;
  author?: string;
  version?: string;
}

// 設定
export interface Setting {
  id: string;
  name: string;
  order: number;
}

// 小役
export interface Role {
  id: string;
  name: string;
  probabilities: Record<string, number>; // settingId -> 確率（0〜1）
  hasSettingDiff: boolean;
  displayOrder: number;
}

// カウントセッション
export interface CountSession {
  id: string;
  machineDataId: string;
  machineName: string;
  totalGames: number;
  startGames: number;
  counts: Record<string, number>; // roleId -> count
  results: SettingProbability[];
  createdAt: number;
  updatedAt: number;
  memo?: string;
  isActive: boolean;
}

// 設定推測結果
export interface SettingProbability {
  settingId: string;
  settingName: string;
  probability: number; // 0〜1
  likelihood: number;
}

// QRコード用データ（圧縮形式）
export interface QRMachineData {
  v: number; // フォーマットバージョン
  n: string; // 機種名
  t: string; // 機種タイプ
  s: string[]; // 設定リスト
  r: QRRole[]; // 小役データ
}

export interface QRRole {
  n: string; // 小役名
  p: number[]; // 設定別確率（分母のみ）
}

// デフォルト設定（設定1〜6）
export const DEFAULT_SETTINGS: Setting[] = [
  { id: '1', name: '設定1', order: 1 },
  { id: '2', name: '設定2', order: 2 },
  { id: '3', name: '設定3', order: 3 },
  { id: '4', name: '設定4', order: 4 },
  { id: '5', name: '設定5', order: 5 },
  { id: '6', name: '設定6', order: 6 },
];

// プリセット機種データ
export const PRESET_MACHINES: Omit<MachineData, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'マイジャグラーV',
    type: 'A-type',
    settings: DEFAULT_SETTINGS,
    roles: [
      {
        id: 'grape',
        name: 'ぶどう',
        probabilities: {
          '1': 1 / 6.49,
          '2': 1 / 6.49,
          '3': 1 / 6.49,
          '4': 1 / 6.49,
          '5': 1 / 6.35,
          '6': 1 / 6.18,
        },
        hasSettingDiff: true,
        displayOrder: 1,
      },
      {
        id: 'solo_reg',
        name: '単独REG',
        probabilities: {
          '1': 1 / 512,
          '2': 1 / 448,
          '3': 1 / 394,
          '4': 1 / 346,
          '5': 1 / 287,
          '6': 1 / 240,
        },
        hasSettingDiff: true,
        displayOrder: 2,
      },
      {
        id: 'cherry_reg',
        name: 'チェリーREG',
        probabilities: {
          '1': 1 / 1365,
          '2': 1 / 1213,
          '3': 1 / 1092,
          '4': 1 / 993,
          '5': 1 / 910,
          '6': 1 / 840,
        },
        hasSettingDiff: true,
        displayOrder: 3,
      },
    ],
    author: 'プリセット',
    version: '1.0',
  },
  {
    name: 'アイムジャグラーEX',
    type: 'A-type',
    settings: DEFAULT_SETTINGS,
    roles: [
      {
        id: 'grape',
        name: 'ぶどう',
        probabilities: {
          '1': 1 / 6.49,
          '2': 1 / 6.49,
          '3': 1 / 6.49,
          '4': 1 / 6.49,
          '5': 1 / 6.35,
          '6': 1 / 6.18,
        },
        hasSettingDiff: true,
        displayOrder: 1,
      },
      {
        id: 'solo_big',
        name: '単独BIG',
        probabilities: {
          '1': 1 / 409,
          '2': 1 / 399,
          '3': 1 / 381,
          '4': 1 / 372,
          '5': 1 / 352,
          '6': 1 / 334,
        },
        hasSettingDiff: true,
        displayOrder: 2,
      },
      {
        id: 'solo_reg',
        name: '単独REG',
        probabilities: {
          '1': 1 / 528,
          '2': 1 / 489,
          '3': 1 / 455,
          '4': 1 / 431,
          '5': 1 / 373,
          '6': 1 / 327,
        },
        hasSettingDiff: true,
        displayOrder: 3,
      },
    ],
    author: 'プリセット',
    version: '1.0',
  },
];
