/**
 * 機種データ取得サービス
 * Web上の解析サイトから機種データを取得するためのユーティリティ
 *
 * 注意: このサービスはMCPサーバー（Playwright）を使用してデータを取得します。
 * アプリ単体では動作せず、Claude Codeなどの環境で使用することを想定しています。
 */

import { MachineData, Role, DEFAULT_SETTINGS } from '../types';
import { generateUUID } from '../utils/qrCodec';

// 解析サイトから取得した生データの型
export interface ScrapedBonusData {
  setting: string;
  big: string;
  reg: string;
  combined?: string;
}

export interface ScrapedRoleData {
  name: string;
  probabilities: Record<string, string>; // setting -> "1/xxx" format
}

export interface ScrapedMachineData {
  name: string;
  type: 'A-type' | 'AT' | 'ART';
  bonusData: ScrapedBonusData[];
  roleData: ScrapedRoleData[];
  source: string;
  scrapedAt: number;
}

/**
 * 確率文字列を数値に変換
 * @param probStr "1/273.1" 形式の文字列
 * @returns 確率（0〜1の数値）
 */
export function parseProbability(probStr: string): number {
  if (!probStr) return 0;

  // "1/xxx" 形式をパース
  const match = probStr.match(/1\/(\d+(?:\.\d+)?)/);
  if (match) {
    const denominator = parseFloat(match[1]);
    return denominator > 0 ? 1 / denominator : 0;
  }

  // 直接数値の場合
  const num = parseFloat(probStr);
  if (!isNaN(num)) {
    return num > 1 ? 1 / num : num;
  }

  return 0;
}

/**
 * 設定名から設定IDを取得
 * @param settingName "設定1" または "1" 形式
 */
export function getSettingId(settingName: string): string {
  const match = settingName.match(/(\d+)/);
  return match ? match[1] : settingName;
}

/**
 * スクレイピングデータをMachineData形式に変換
 */
export function convertScrapedToMachine(scraped: ScrapedMachineData): Omit<MachineData, 'id' | 'createdAt' | 'updatedAt'> {
  const roles: Role[] = [];

  // ボーナスデータをRole形式に変換
  if (scraped.bonusData.length > 0) {
    // BIG確率
    const bigProbabilities: Record<string, number> = {};
    scraped.bonusData.forEach(data => {
      const settingId = getSettingId(data.setting);
      bigProbabilities[settingId] = parseProbability(data.big);
    });

    if (Object.values(bigProbabilities).some(p => p > 0)) {
      roles.push({
        id: 'big_bonus',
        name: 'BIG',
        probabilities: bigProbabilities,
        hasSettingDiff: hasSignificantDiff(Object.values(bigProbabilities)),
        displayOrder: roles.length + 1,
      });
    }

    // REG確率
    const regProbabilities: Record<string, number> = {};
    scraped.bonusData.forEach(data => {
      const settingId = getSettingId(data.setting);
      regProbabilities[settingId] = parseProbability(data.reg);
    });

    if (Object.values(regProbabilities).some(p => p > 0)) {
      roles.push({
        id: 'reg_bonus',
        name: 'REG',
        probabilities: regProbabilities,
        hasSettingDiff: hasSignificantDiff(Object.values(regProbabilities)),
        displayOrder: roles.length + 1,
      });
    }
  }

  // 小役データをRole形式に変換
  scraped.roleData.forEach((roleData, index) => {
    const probabilities: Record<string, number> = {};

    Object.entries(roleData.probabilities).forEach(([setting, probStr]) => {
      const settingId = getSettingId(setting);
      probabilities[settingId] = parseProbability(probStr);
    });

    if (Object.values(probabilities).some(p => p > 0)) {
      roles.push({
        id: generateUUID(),
        name: roleData.name,
        probabilities,
        hasSettingDiff: hasSignificantDiff(Object.values(probabilities)),
        displayOrder: roles.length + 1,
      });
    }
  });

  return {
    name: scraped.name,
    type: scraped.type,
    settings: DEFAULT_SETTINGS,
    roles,
    author: `Web取得 (${scraped.source})`,
    version: '1.0',
  };
}

/**
 * 確率値に有意な設定差があるかチェック
 */
function hasSignificantDiff(probabilities: number[]): boolean {
  if (probabilities.length < 2) return false;

  const validProbs = probabilities.filter(p => p > 0);
  if (validProbs.length < 2) return false;

  const max = Math.max(...validProbs);
  const min = Math.min(...validProbs);

  // 10%以上の差があれば設定差ありとする
  return (max - min) / min > 0.1;
}

// 人気機種のプリセットデータ（Webスクレイピングなしで使用可能）
export const POPULAR_MACHINES: ScrapedMachineData[] = [
  {
    name: 'SマイジャグラーV',
    type: 'A-type',
    bonusData: [
      { setting: '設定1', big: '1/273.1', reg: '1/409.6', combined: '1/163.8' },
      { setting: '設定2', big: '1/270.8', reg: '1/385.5', combined: '1/159.1' },
      { setting: '設定3', big: '1/266.4', reg: '1/336.1', combined: '1/148.6' },
      { setting: '設定4', big: '1/254.0', reg: '1/290.0', combined: '1/135.4' },
      { setting: '設定5', big: '1/240.1', reg: '1/268.6', combined: '1/126.8' },
      { setting: '設定6', big: '1/229.1', reg: '1/229.1', combined: '1/114.6' },
    ],
    roleData: [
      {
        name: 'ぶどう',
        probabilities: {
          '設定1': '1/6.49', '設定2': '1/6.49', '設定3': '1/6.49',
          '設定4': '1/6.49', '設定5': '1/6.35', '設定6': '1/6.18',
        },
      },
      {
        name: '単独REG',
        probabilities: {
          '設定1': '1/512', '設定2': '1/448', '設定3': '1/394',
          '設定4': '1/346', '設定5': '1/287', '設定6': '1/240',
        },
      },
    ],
    source: 'chonborista.com',
    scrapedAt: Date.now(),
  },
  {
    name: 'ネオアイムジャグラーEX',
    type: 'A-type',
    bonusData: [
      { setting: '設定1', big: '1/273.1', reg: '1/439.8', combined: '1/168.5' },
      { setting: '設定2', big: '1/268.6', reg: '1/399.6', combined: '1/160.6' },
      { setting: '設定3', big: '1/266.4', reg: '1/331.0', combined: '1/147.6' },
      { setting: '設定4', big: '1/259.0', reg: '1/315.1', combined: '1/142.2' },
      { setting: '設定5', big: '1/253.0', reg: '1/255.0', combined: '1/127.0' },
      { setting: '設定6', big: '1/240.1', reg: '1/240.1', combined: '1/120.0' },
    ],
    roleData: [
      {
        name: 'ぶどう',
        probabilities: {
          '設定1': '1/6.50', '設定2': '1/6.45', '設定3': '1/6.40',
          '設定4': '1/6.30', '設定5': '1/6.25', '設定6': '1/6.18',
        },
      },
    ],
    source: 'chonborista.com',
    scrapedAt: Date.now(),
  },
  {
    name: 'Sゴーゴージャグラー3',
    type: 'A-type',
    bonusData: [
      { setting: '設定1', big: '1/264.3', reg: '1/397.2', combined: '1/158.8' },
      { setting: '設定2', big: '1/260.1', reg: '1/362.1', combined: '1/151.4' },
      { setting: '設定3', big: '1/252.1', reg: '1/332.7', combined: '1/143.3' },
      { setting: '設定4', big: '1/240.9', reg: '1/292.6', combined: '1/132.1' },
      { setting: '設定5', big: '1/229.1', reg: '1/268.6', combined: '1/123.6' },
      { setting: '設定6', big: '1/223.7', reg: '1/223.7', combined: '1/111.8' },
    ],
    roleData: [
      {
        name: 'ぶどう',
        probabilities: {
          '設定1': '1/6.51', '設定2': '1/6.46', '設定3': '1/6.42',
          '設定4': '1/6.33', '設定5': '1/6.27', '設定6': '1/6.18',
        },
      },
    ],
    source: 'chonborista.com',
    scrapedAt: Date.now(),
  },
];

/**
 * 人気機種リストを取得
 */
export function getPopularMachines(): ScrapedMachineData[] {
  return POPULAR_MACHINES;
}

/**
 * 機種名で人気機種を検索
 */
export function searchPopularMachine(keyword: string): ScrapedMachineData[] {
  const normalizedKeyword = keyword.toLowerCase();
  return POPULAR_MACHINES.filter(m =>
    m.name.toLowerCase().includes(normalizedKeyword)
  );
}
