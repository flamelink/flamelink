import flamelink from '../src/index';

describe('Flamelink SDK', () => {
  test('should expose a factory function', () => {
    expect(typeof flamelink).toBe('function');
    expect(typeof flamelink()).toBe('object');
  });

  test('should expose the `firebaseApp` instance', () => {
    expect(flamelink().hasOwnProperty('firebaseApp')).toBe(true);
  });

  test('should expose the `firebaseApp` instance if passed in via config', () => {
    const fakeFirebaseApp = { key: 'value' };
    expect(flamelink({ firebaseApp: fakeFirebaseApp }).firebaseApp).toBe(fakeFirebaseApp);
  });

  test('should expose a "setLanguage" method', () => {
    expect(flamelink().hasOwnProperty('setLanguage')).toBe(true);
  });

  test('should expose a "setEnv" method', () => {
    expect(flamelink().hasOwnProperty('setEnv')).toBe(true);
  });

  describe('Content', () => {
    test('should expose a "get" method', () => {
      expect(flamelink().content.hasOwnProperty('get')).toBe(true);
    });

    test('should expose a "set" method', () => {
      expect(flamelink().content.hasOwnProperty('set')).toBe(true);
    });

    test('should expose a "on" method', () => {
      expect(flamelink().content.hasOwnProperty('on')).toBe(true);
    });

    test('should expose a "off" method', () => {
      expect(flamelink().content.hasOwnProperty('off')).toBe(true);
    });

    test('should expose a "remove" method', () => {
      expect(flamelink().content.hasOwnProperty('remove')).toBe(true);
    });
  });

  describe('Navigation', () => {
    test('should expose a "get" method', () => {
      expect(flamelink().nav.hasOwnProperty('get')).toBe(true);
    });

    test('should expose a "set" method', () => {
      expect(flamelink().nav.hasOwnProperty('set')).toBe(true);
    });

    test('should expose a "on" method', () => {
      expect(flamelink().nav.hasOwnProperty('on')).toBe(true);
    });

    test('should expose a "off" method', () => {
      expect(flamelink().nav.hasOwnProperty('off')).toBe(true);
    });

    test('should expose a "remove" method', () => {
      expect(flamelink().nav.hasOwnProperty('remove')).toBe(true);
    });
  });
});
