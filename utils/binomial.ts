import { Role, Setting, SettingProbability } from '../types';

/**
 * 二項分布の確率質量関数（対数を使用してオーバーフロー防止）
 * P(X = k) = C(n,k) * p^k * (1-p)^(n-k)
 */
export function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n || p < 0 || p > 1) return 0;
  if (n === 0) return k === 0 ? 1 : 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;

  // 対数を使って計算（オーバーフロー防止）
  let logProb = 0;

  // log(C(n,k)) = Σ(log(n-i) - log(i+1)) for i = 0 to k-1
  for (let i = 0; i < k; i++) {
    logProb += Math.log(n - i) - Math.log(i + 1);
  }

  // log(p^k) + log((1-p)^(n-k))
  logProb += k * Math.log(p) + (n - k) * Math.log(1 - p);

  return Math.exp(logProb);
}

/**
 * 二項分布の累積分布関数
 * P(X <= k)
 */
export function binomialCDF(k: number, n: number, p: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += binomialPMF(i, n, p);
  }
  return sum;
}

/**
 * 設定推測計算
 * 各設定の尤度を計算し、正規化して確率を返す
 */
export function calculateSettingProbabilities(
  totalGames: number,
  roles: Role[],
  counts: Record<string, number>,
  settings: Setting[]
): SettingProbability[] {
  if (totalGames <= 0) {
    // ゲーム数が0の場合は均等確率
    const equalProb = 1 / settings.length;
    return settings.map((setting) => ({
      settingId: setting.id,
      settingName: setting.name,
      probability: equalProb,
      likelihood: 1,
    }));
  }

  const likelihoods: Record<string, number> = {};
  const logLikelihoods: Record<string, number> = {};

  // 各設定の対数尤度を計算
  for (const setting of settings) {
    let logLikelihood = 0;

    for (const role of roles) {
      if (!role.hasSettingDiff) continue;

      const p = role.probabilities[setting.id];
      if (p === undefined || p <= 0 || p >= 1) continue;

      const k = counts[role.id] || 0;

      // 対数尤度を加算
      const logPMF = k * Math.log(p) + (totalGames - k) * Math.log(1 - p);

      // 二項係数の対数を加算
      for (let i = 0; i < k; i++) {
        logLikelihood += Math.log(totalGames - i) - Math.log(i + 1);
      }
      logLikelihood += logPMF;
    }

    logLikelihoods[setting.id] = logLikelihood;
  }

  // 最大の対数尤度を基準に正規化（アンダーフロー防止）
  const maxLogLikelihood = Math.max(...Object.values(logLikelihoods));

  for (const setting of settings) {
    likelihoods[setting.id] = Math.exp(logLikelihoods[setting.id] - maxLogLikelihood);
  }

  // 正規化
  const totalLikelihood = Object.values(likelihoods).reduce((a, b) => a + b, 0);

  return settings.map((setting) => ({
    settingId: setting.id,
    settingName: setting.name,
    probability:
      totalLikelihood > 0
        ? likelihoods[setting.id] / totalLikelihood
        : 1 / settings.length,
    likelihood: likelihoods[setting.id],
  }));
}

/**
 * 確率から分母を計算（1/x形式）
 */
export function probabilityToDenominator(p: number): number {
  if (p <= 0) return Infinity;
  return 1 / p;
}

/**
 * 分母から確率を計算
 */
export function denominatorToProbability(d: number): number {
  if (d <= 0) return 0;
  return 1 / d;
}

/**
 * 確率を「1/x.xx」形式の文字列に変換
 */
export function formatProbability(p: number, decimals: number = 2): string {
  if (p <= 0) return '-';
  const denominator = 1 / p;
  return `1/${denominator.toFixed(decimals)}`;
}

/**
 * 現在の確率を計算（回数/ゲーム数）
 */
export function calculateCurrentProbability(
  count: number,
  totalGames: number
): number {
  if (totalGames <= 0) return 0;
  return count / totalGames;
}

/**
 * 設定推測結果のサマリーを生成
 */
export function generateSettingSummary(
  results: SettingProbability[]
): { label: string; color: string } {
  if (results.length === 0) {
    return { label: 'データ不足', color: '#888888' };
  }

  // 最も確率の高い設定を見つける
  const sorted = [...results].sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  const topSettingNum = parseInt(top.settingId, 10);

  // 高設定（5,6）の合計確率
  const highSettingProb = results
    .filter((r) => parseInt(r.settingId, 10) >= 5)
    .reduce((sum, r) => sum + r.probability, 0);

  // 低設定（1,2）の合計確率
  const lowSettingProb = results
    .filter((r) => parseInt(r.settingId, 10) <= 2)
    .reduce((sum, r) => sum + r.probability, 0);

  if (highSettingProb >= 0.7) {
    return { label: '高設定濃厚', color: '#4CAF50' };
  } else if (highSettingProb >= 0.5) {
    return { label: '高設定の可能性', color: '#8BC34A' };
  } else if (lowSettingProb >= 0.7) {
    return { label: '低設定の可能性', color: '#F44336' };
  } else if (lowSettingProb >= 0.5) {
    return { label: '低設定寄り', color: '#FF9800' };
  } else {
    return { label: '判別中', color: '#2196F3' };
  }
}
