import {
  encodeMachineData,
  decodeMachineData,
  qrDataToString,
  stringToQRData,
  generateUUID,
  getRecommendedECLevel,
  estimateQRDataSize,
} from '../../utils/qrCodec';
import { MachineData, QRMachineData, DEFAULT_SETTINGS } from '../../types';

describe('qrCodec utility functions', () => {
  const testMachine: MachineData = {
    id: 'test-machine-id',
    name: 'テスト機種',
    type: 'A-type',
    settings: DEFAULT_SETTINGS,
    roles: [
      {
        id: 'role1',
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
        id: 'role2',
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
        id: 'role3',
        name: '設定差なし役',
        probabilities: {
          '1': 1 / 10,
          '2': 1 / 10,
          '3': 1 / 10,
          '4': 1 / 10,
          '5': 1 / 10,
          '6': 1 / 10,
        },
        hasSettingDiff: false,
        displayOrder: 3,
      },
    ],
    createdAt: 1000000,
    updatedAt: 1000000,
  };

  describe('encodeMachineData', () => {
    it('encodes machine data to QR format', () => {
      const result = encodeMachineData(testMachine);

      expect(result.v).toBe(1);
      expect(result.n).toBe('テスト機種');
      expect(result.t).toBe('A');
      expect(result.s).toEqual(['1', '2', '3', '4', '5', '6']);
    });

    it('only includes roles with hasSettingDiff=true', () => {
      const result = encodeMachineData(testMachine);

      // 3 roles in machine, but only 2 have hasSettingDiff=true
      expect(result.r.length).toBe(2);
      expect(result.r.map((r) => r.n)).toContain('ぶどう');
      expect(result.r.map((r) => r.n)).toContain('単独REG');
      expect(result.r.map((r) => r.n)).not.toContain('設定差なし役');
    });

    it('converts probabilities to denominators', () => {
      const result = encodeMachineData(testMachine);

      const grapeRole = result.r.find((r) => r.n === 'ぶどう');
      expect(grapeRole).toBeDefined();
      expect(grapeRole!.p[0]).toBeCloseTo(6.49, 2); // 設定1
      expect(grapeRole!.p[5]).toBeCloseTo(6.18, 2); // 設定6
    });

    it('handles AT type', () => {
      const atMachine = { ...testMachine, type: 'AT' as const };
      const result = encodeMachineData(atMachine);
      expect(result.t).toBe('AT');
    });

    it('handles ART type', () => {
      const artMachine = { ...testMachine, type: 'ART' as const };
      const result = encodeMachineData(artMachine);
      expect(result.t).toBe('ART');
    });
  });

  describe('decodeMachineData', () => {
    const qrData: QRMachineData = {
      v: 1,
      n: 'デコード機種',
      t: 'A',
      s: ['1', '2', '3', '4', '5', '6'],
      r: [
        { n: 'ぶどう', p: [6.49, 6.49, 6.49, 6.49, 6.35, 6.18] },
      ],
    };

    const customSettingsQRData: QRMachineData = {
      v: 1,
      n: 'カスタム設定機種',
      t: 'A',
      s: ['L', 'H'], // カスタム設定（DEFAULT_SETTINGSと異なる）
      r: [
        { n: 'ぶどう', p: [7.0, 6.0] },
      ],
    };

    it('decodes QR data to machine data', () => {
      const result = decodeMachineData(qrData);

      expect(result.name).toBe('デコード機種');
      expect(result.type).toBe('A-type');
      expect(result.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('generates new ID if not provided', () => {
      const result = decodeMachineData(qrData);
      expect(result.id).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('uses provided ID', () => {
      const result = decodeMachineData(qrData, 'custom-id');
      expect(result.id).toBe('custom-id');
    });

    it('converts denominators back to probabilities', () => {
      const result = decodeMachineData(qrData);

      const grapeRole = result.roles[0];
      expect(grapeRole.probabilities['1']).toBeCloseTo(1 / 6.49, 6);
      expect(grapeRole.probabilities['6']).toBeCloseTo(1 / 6.18, 6);
    });

    it('sets hasSettingDiff to true for decoded roles', () => {
      const result = decodeMachineData(qrData);
      result.roles.forEach((role) => {
        expect(role.hasSettingDiff).toBe(true);
      });
    });

    it('handles AT type', () => {
      const atQRData = { ...qrData, t: 'AT' };
      const result = decodeMachineData(atQRData);
      expect(result.type).toBe('AT');
    });

    it('handles ART type', () => {
      const artQRData = { ...qrData, t: 'ART' };
      const result = decodeMachineData(artQRData);
      expect(result.type).toBe('ART');
    });

    it('handles custom settings (non-DEFAULT_SETTINGS)', () => {
      const result = decodeMachineData(customSettingsQRData);

      expect(result.name).toBe('カスタム設定機種');
      expect(result.settings.length).toBe(2);
      expect(result.settings[0].id).toBe('L');
      expect(result.settings[0].name).toBe('設定L');
      expect(result.settings[1].id).toBe('H');
      expect(result.settings[1].name).toBe('設定H');
    });
  });

  describe('encode and decode roundtrip', () => {
    it('preserves machine data through encode/decode cycle', () => {
      const encoded = encodeMachineData(testMachine);
      const decoded = decodeMachineData(encoded, testMachine.id);

      expect(decoded.name).toBe(testMachine.name);
      expect(decoded.type).toBe(testMachine.type);

      // Check roles with setting diff
      const originalRoles = testMachine.roles.filter((r) => r.hasSettingDiff);
      expect(decoded.roles.length).toBe(originalRoles.length);

      for (let i = 0; i < originalRoles.length; i++) {
        expect(decoded.roles[i].name).toBe(originalRoles[i].name);
        // Check probabilities (with tolerance for floating point)
        for (const settingId of ['1', '2', '3', '4', '5', '6']) {
          expect(decoded.roles[i].probabilities[settingId]).toBeCloseTo(
            originalRoles[i].probabilities[settingId],
            4
          );
        }
      }
    });
  });

  describe('qrDataToString', () => {
    it('converts QR data to JSON string', () => {
      const qrData: QRMachineData = {
        v: 1,
        n: 'テスト',
        t: 'A',
        s: ['1'],
        r: [],
      };
      const result = qrDataToString(qrData);
      expect(result).toBe(JSON.stringify(qrData));
    });
  });

  describe('stringToQRData', () => {
    it('parses valid JSON string', () => {
      const qrData: QRMachineData = {
        v: 1,
        n: 'テスト',
        t: 'A',
        s: ['1', '2'],
        r: [{ n: 'ぶどう', p: [6.49, 6.49] }],
      };
      const jsonStr = JSON.stringify(qrData);
      const result = stringToQRData(jsonStr);

      expect(result).not.toBeNull();
      expect(result!.n).toBe('テスト');
    });

    it('returns null for invalid JSON', () => {
      expect(stringToQRData('invalid json')).toBeNull();
      expect(stringToQRData('{}')).toBeNull();
    });

    it('returns null for missing required fields', () => {
      expect(stringToQRData('{"v": 1}')).toBeNull();
      expect(stringToQRData('{"v": 1, "n": "test"}')).toBeNull();
    });

    it('returns null for mismatched role probability count', () => {
      const invalidData = {
        v: 1,
        n: 'test',
        t: 'A',
        s: ['1', '2', '3'],
        r: [{ n: 'role', p: [1, 2] }], // 3 settings but only 2 probabilities
      };
      expect(stringToQRData(JSON.stringify(invalidData))).toBeNull();
    });
  });

  describe('generateUUID', () => {
    it('generates UUID-like string', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('generates unique UUIDs', () => {
      const uuids = Array.from({ length: 100 }, () => generateUUID());
      const uniqueUUIDs = new Set(uuids);
      expect(uniqueUUIDs.size).toBe(100);
    });
  });

  describe('estimateQRDataSize', () => {
    it('returns size in bytes', () => {
      const qrData: QRMachineData = {
        v: 1,
        n: 'テスト',
        t: 'A',
        s: ['1', '2'],
        r: [{ n: 'ぶどう', p: [6.49, 6.49] }],
      };
      const size = estimateQRDataSize(qrData);
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
  });

  describe('getRecommendedECLevel', () => {
    it('returns H for small data', () => {
      expect(getRecommendedECLevel(50)).toBe('H');
      expect(getRecommendedECLevel(99)).toBe('H');
    });

    it('returns Q for medium data', () => {
      expect(getRecommendedECLevel(100)).toBe('Q');
      expect(getRecommendedECLevel(199)).toBe('Q');
    });

    it('returns M for larger data', () => {
      expect(getRecommendedECLevel(200)).toBe('M');
      expect(getRecommendedECLevel(399)).toBe('M');
    });

    it('returns L for large data', () => {
      expect(getRecommendedECLevel(400)).toBe('L');
      expect(getRecommendedECLevel(1000)).toBe('L');
    });
  });
});
