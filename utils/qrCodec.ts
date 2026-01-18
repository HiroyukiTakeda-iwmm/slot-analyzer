import {
  MachineData,
  QRMachineData,
  QRRole,
  Role,
  DEFAULT_SETTINGS,
} from '../types';
import { denominatorToProbability, probabilityToDenominator } from './binomial';

/**
 * 機種データをQRコード用の圧縮形式に変換
 */
export function encodeMachineData(machine: MachineData): QRMachineData {
  const typeMap: Record<string, string> = {
    'A-type': 'A',
    AT: 'AT',
    ART: 'ART',
  };

  const qrRoles: QRRole[] = machine.roles
    .filter((role) => role.hasSettingDiff)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((role) => ({
      n: role.name,
      p: machine.settings.map((s) =>
        parseFloat(probabilityToDenominator(role.probabilities[s.id]).toFixed(2))
      ),
    }));

  return {
    v: 1,
    n: machine.name,
    t: typeMap[machine.type] || 'A',
    s: machine.settings.map((s) => s.id),
    r: qrRoles,
  };
}

/**
 * QRコード用の圧縮形式を機種データに変換
 */
export function decodeMachineData(
  qrData: QRMachineData,
  id?: string
): MachineData {
  const typeMap: Record<string, 'A-type' | 'AT' | 'ART'> = {
    A: 'A-type',
    AT: 'AT',
    ART: 'ART',
  };

  const settings =
    qrData.s.length === DEFAULT_SETTINGS.length &&
    qrData.s.every((s, i) => s === DEFAULT_SETTINGS[i].id)
      ? DEFAULT_SETTINGS
      : qrData.s.map((s, i) => ({
          id: s,
          name: `設定${s}`,
          order: i + 1,
        }));

  const roles: Role[] = qrData.r.map((qrRole, index) => {
    const probabilities: Record<string, number> = {};
    qrData.s.forEach((settingId, i) => {
      probabilities[settingId] = denominatorToProbability(qrRole.p[i]);
    });

    return {
      id: `role_${index}`,
      name: qrRole.n,
      probabilities,
      hasSettingDiff: true,
      displayOrder: index + 1,
    };
  });

  const now = Date.now();

  return {
    id: id || generateUUID(),
    name: qrData.n,
    type: typeMap[qrData.t] || 'A-type',
    settings,
    roles,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * QRデータを文字列に変換
 */
export function qrDataToString(qrData: QRMachineData): string {
  return JSON.stringify(qrData);
}

/**
 * 文字列をQRデータに変換
 */
export function stringToQRData(str: string): QRMachineData | null {
  try {
    const parsed = JSON.parse(str);

    // バリデーション
    if (
      typeof parsed.v !== 'number' ||
      typeof parsed.n !== 'string' ||
      typeof parsed.t !== 'string' ||
      !Array.isArray(parsed.s) ||
      !Array.isArray(parsed.r)
    ) {
      return null;
    }

    // 小役データのバリデーション
    for (const role of parsed.r) {
      if (
        typeof role.n !== 'string' ||
        !Array.isArray(role.p) ||
        role.p.length !== parsed.s.length
      ) {
        return null;
      }
    }

    return parsed as QRMachineData;
  } catch {
    return null;
  }
}

/**
 * 簡易UUID生成
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * QRコードデータのサイズを推定（バイト数）
 */
export function estimateQRDataSize(qrData: QRMachineData): number {
  return new Blob([qrDataToString(qrData)]).size;
}

/**
 * QRコードの推奨エラー訂正レベルを取得
 */
export function getRecommendedECLevel(
  dataSize: number
): 'L' | 'M' | 'Q' | 'H' {
  // データサイズに基づいて推奨レベルを返す
  // 小さいデータ -> 高い訂正レベル
  // 大きいデータ -> 低い訂正レベル（容量確保）
  if (dataSize < 100) return 'H';
  if (dataSize < 200) return 'Q';
  if (dataSize < 400) return 'M';
  return 'L';
}
