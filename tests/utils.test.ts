import { describe, test, expect } from 'vitest';

import { getQuotePairMap } from '../src/utils';

describe('utils', () => {
  describe('getQuotePairMap', () => {
    const emptyQuotePairMap = { single: {}, double: {} };

    test('empty', () => {
      expect(getQuotePairMap()).toEqual(emptyQuotePairMap);
      expect(getQuotePairMap('')).toEqual(emptyQuotePairMap);
      expect(getQuotePairMap('  ')).toEqual(emptyQuotePairMap);
      expect(getQuotePairMap(null)).toEqual(emptyQuotePairMap);
      expect(getQuotePairMap(undefined)).toEqual(emptyQuotePairMap);
    });

    test('simple pairs', () => {
      const singleStr = "This is 'quoted and' this is not";
      const doubleStr = 'This is "quoted and" this is not';
      const locations = { 8: true, 19: true };
      expect(getQuotePairMap(singleStr)).toEqual({ single: locations, double: {} });
      expect(getQuotePairMap(doubleStr)).toEqual({ single: {}, double: locations });
    });

    test('two pairs', () => {
      const singleStr = "This 'is' 'quoted and' this is not";
      const doubleStr = 'This "is" "quoted and" this is not';
      const locations = { 5: true, 8: true, 10: true, 21: true };
      expect(getQuotePairMap(singleStr)).toEqual({ single: locations, double: {} });
      expect(getQuotePairMap(doubleStr)).toEqual({ single: {}, double: locations });
    });

    test('simple no pairs', () => {
      const singleStr = "This is quoted and' this is not";
      const doubleStr = 'This is quoted and" this is not';
      expect(getQuotePairMap(singleStr)).toEqual(emptyQuotePairMap);
      expect(getQuotePairMap(doubleStr)).toEqual(emptyQuotePairMap);
    });

    test('intermixed', () => {
      const singleStr = "This 'is \"'quoted and' this is not";
      const doubleStr = 'This "is \'"quoted and" this is not';
      const locations = { 5: true, 10: true };
      expect(getQuotePairMap(singleStr)).toEqual({ single: locations, double: {} });
      expect(getQuotePairMap(doubleStr)).toEqual({ single: {}, double: locations });
    });
  });
});
