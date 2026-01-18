import {
  binomialPMF,
  binomialCDF,
  calculateSettingProbabilities,
  probabilityToDenominator,
  denominatorToProbability,
  formatProbability,
  calculateCurrentProbability,
  generateSettingSummary,
} from '../../utils/binomial';
import { Role, Setting, SettingProbability } from '../../types';

describe('binomial utility functions', () => {
  describe('binomialPMF', () => {
    it('returns 1 when n=0 and k=0', () => {
      expect(binomialPMF(0, 0, 0.5)).toBe(1);
    });

    it('returns 0 when k > n', () => {
      expect(binomialPMF(5, 3, 0.5)).toBe(0);
    });

    it('returns 0 when k < 0', () => {
      expect(binomialPMF(-1, 3, 0.5)).toBe(0);
    });

    it('returns 1 when p=0 and k=0', () => {
      expect(binomialPMF(0, 10, 0)).toBe(1);
    });

    it('returns 0 when p=0 and k>0', () => {
      expect(binomialPMF(5, 10, 0)).toBe(0);
    });

    it('returns 1 when p=1 and k=n', () => {
      expect(binomialPMF(10, 10, 1)).toBe(1);
    });

    it('returns 0 when p=1 and k<n', () => {
      expect(binomialPMF(5, 10, 1)).toBe(0);
    });

    it('calculates correct probability for fair coin', () => {
      // P(X=5) for n=10, p=0.5 should be C(10,5) * 0.5^10 = 252 * 0.0009765625 = 0.24609375
      const result = binomialPMF(5, 10, 0.5);
      expect(result).toBeCloseTo(0.24609375, 6);
    });

    it('calculates correct probability for biased coin', () => {
      // P(X=2) for n=5, p=0.3
      // C(5,2) * 0.3^2 * 0.7^3 = 10 * 0.09 * 0.343 = 0.3087
      const result = binomialPMF(2, 5, 0.3);
      expect(result).toBeCloseTo(0.3087, 4);
    });
  });

  describe('binomialCDF', () => {
    it('returns 1 when k >= n', () => {
      const result = binomialCDF(10, 10, 0.5);
      expect(result).toBeCloseTo(1, 6);
    });

    it('returns sum of PMFs correctly', () => {
      // P(X <= 1) for n=3, p=0.5
      // = P(X=0) + P(X=1) = 0.125 + 0.375 = 0.5
      const result = binomialCDF(1, 3, 0.5);
      expect(result).toBeCloseTo(0.5, 6);
    });
  });

  describe('probabilityToDenominator', () => {
    it('converts probability to denominator', () => {
      expect(probabilityToDenominator(0.5)).toBe(2);
      expect(probabilityToDenominator(0.25)).toBe(4);
      expect(probabilityToDenominator(0.1)).toBeCloseTo(10, 6);
    });

    it('returns Infinity for zero probability', () => {
      expect(probabilityToDenominator(0)).toBe(Infinity);
    });

    it('returns Infinity for negative probability', () => {
      expect(probabilityToDenominator(-0.5)).toBe(Infinity);
    });
  });

  describe('denominatorToProbability', () => {
    it('converts denominator to probability', () => {
      expect(denominatorToProbability(2)).toBe(0.5);
      expect(denominatorToProbability(4)).toBe(0.25);
      expect(denominatorToProbability(10)).toBeCloseTo(0.1, 6);
    });

    it('returns 0 for zero denominator', () => {
      expect(denominatorToProbability(0)).toBe(0);
    });

    it('returns 0 for negative denominator', () => {
      expect(denominatorToProbability(-5)).toBe(0);
    });
  });

  describe('formatProbability', () => {
    it('formats probability as 1/x string', () => {
      expect(formatProbability(0.5)).toBe('1/2.00');
      expect(formatProbability(0.1)).toBe('1/10.00');
    });

    it('returns - for zero probability', () => {
      expect(formatProbability(0)).toBe('-');
    });

    it('returns - for negative probability', () => {
      expect(formatProbability(-0.5)).toBe('-');
    });

    it('respects decimal precision', () => {
      expect(formatProbability(1 / 6.49, 2)).toBe('1/6.49');
      expect(formatProbability(1 / 6.49, 1)).toBe('1/6.5');
    });
  });

  describe('calculateCurrentProbability', () => {
    it('calculates count / totalGames', () => {
      expect(calculateCurrentProbability(50, 1000)).toBe(0.05);
      expect(calculateCurrentProbability(100, 500)).toBe(0.2);
    });

    it('returns 0 when totalGames is 0', () => {
      expect(calculateCurrentProbability(10, 0)).toBe(0);
    });

    it('returns 0 when totalGames is negative', () => {
      expect(calculateCurrentProbability(10, -5)).toBe(0);
    });
  });

  describe('calculateSettingProbabilities', () => {
    const settings: Setting[] = [
      { id: '1', name: '設定1', order: 1 },
      { id: '2', name: '設定2', order: 2 },
      { id: '6', name: '設定6', order: 6 },
    ];

    const roles: Role[] = [
      {
        id: 'grape',
        name: 'ぶどう',
        probabilities: {
          '1': 1 / 6.49,
          '2': 1 / 6.49,
          '6': 1 / 6.18,
        },
        hasSettingDiff: true,
        displayOrder: 1,
      },
    ];

    it('returns equal probabilities when totalGames is 0', () => {
      const result = calculateSettingProbabilities(0, roles, {}, settings);

      expect(result.length).toBe(3);
      result.forEach((r) => {
        expect(r.probability).toBeCloseTo(1 / 3, 6);
      });
    });

    it('calculates probabilities based on observed data', () => {
      // 1000ゲームで160回ぶどう = 1/6.25 に近い
      // 設定6 (1/6.18) に近いはず
      const counts = { grape: 160 };
      const result = calculateSettingProbabilities(1000, roles, counts, settings);

      expect(result.length).toBe(3);
      const setting6 = result.find((r) => r.settingId === '6');
      expect(setting6).toBeDefined();
      expect(setting6!.probability).toBeGreaterThan(0.3);
    });

    it('handles missing counts as 0', () => {
      const result = calculateSettingProbabilities(100, roles, {}, settings);
      expect(result.length).toBe(3);
    });
  });

  describe('generateSettingSummary', () => {
    it('returns データ不足 for empty results', () => {
      const result = generateSettingSummary([]);
      expect(result.label).toBe('データ不足');
      expect(result.color).toBe('#888888');
    });

    it('returns 高設定濃厚 when high settings >= 70%', () => {
      const results: SettingProbability[] = [
        { settingId: '1', settingName: '設定1', probability: 0.1, likelihood: 1 },
        { settingId: '5', settingName: '設定5', probability: 0.3, likelihood: 1 },
        { settingId: '6', settingName: '設定6', probability: 0.6, likelihood: 1 },
      ];
      const result = generateSettingSummary(results);
      expect(result.label).toBe('高設定濃厚');
      expect(result.color).toBe('#4CAF50');
    });

    it('returns 高設定の可能性 when high settings >= 50% but < 70%', () => {
      const results: SettingProbability[] = [
        { settingId: '1', settingName: '設定1', probability: 0.4, likelihood: 1 },
        { settingId: '5', settingName: '設定5', probability: 0.25, likelihood: 1 },
        { settingId: '6', settingName: '設定6', probability: 0.35, likelihood: 1 },
      ];
      const result = generateSettingSummary(results);
      expect(result.label).toBe('高設定の可能性');
      expect(result.color).toBe('#8BC34A');
    });

    it('returns 低設定の可能性 when low settings >= 70%', () => {
      const results: SettingProbability[] = [
        { settingId: '1', settingName: '設定1', probability: 0.5, likelihood: 1 },
        { settingId: '2', settingName: '設定2', probability: 0.3, likelihood: 1 },
        { settingId: '6', settingName: '設定6', probability: 0.2, likelihood: 1 },
      ];
      const result = generateSettingSummary(results);
      expect(result.label).toBe('低設定の可能性');
      expect(result.color).toBe('#F44336');
    });

    it('returns 判別中 for balanced probabilities', () => {
      const results: SettingProbability[] = [
        { settingId: '1', settingName: '設定1', probability: 0.2, likelihood: 1 },
        { settingId: '3', settingName: '設定3', probability: 0.4, likelihood: 1 },
        { settingId: '6', settingName: '設定6', probability: 0.4, likelihood: 1 },
      ];
      const result = generateSettingSummary(results);
      expect(result.label).toBe('判別中');
      expect(result.color).toBe('#2196F3');
    });

    it('returns 低設定寄り when low settings >= 50% but < 70%', () => {
      const results: SettingProbability[] = [
        { settingId: '1', settingName: '設定1', probability: 0.3, likelihood: 1 },
        { settingId: '2', settingName: '設定2', probability: 0.25, likelihood: 1 },
        { settingId: '6', settingName: '設定6', probability: 0.45, likelihood: 1 },
      ];
      const result = generateSettingSummary(results);
      expect(result.label).toBe('低設定寄り');
      expect(result.color).toBe('#FF9800');
    });
  });
});
