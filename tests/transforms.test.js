const transforms = require('../src/transforms');

describe('transforms', () => {
  describe('emails', () => {
    test('strings containing basic email addresses', () => {
      expect(transforms.emails('foo@bar.com')).toEqual({ key: 'to', value: 'foo@bar.com' });
    });

    test('strings containing emails wrapped in brackets', () => {
      expect(transforms.emails('<foo@bar.com>')).toEqual({ key: 'to', value: 'foo@bar.com' });
    });

    test('non-email strings', () => {
      expect(transforms.emails('hello')).toEqual({});
      expect(transforms.emails('foo@bar')).toEqual({});
      expect(transforms.emails('foo@bar.')).toEqual({});
      expect(transforms.emails('foo.com')).toEqual({});
    });
  });

  describe('domains', () => {
    test('strings containing domains', () => {
      expect(transforms.domains('foo.bar.com')).toEqual({ key: 'to', value: 'foo.bar.com' });
    });

    test('non-domain strings', () => {
      expect(transforms.domains('hello')).toEqual({});
      expect(transforms.domains('foo.')).toEqual({});
    });
  });
});
