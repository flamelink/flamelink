import flamelink from '../src/index';
import pkg from '../package.json';

const fakeFirebaseApp = {
  firebase_: {
    __esModule: true,
    initializeApp: () => {},
    app: {},
    apps: () => {},
    Promise: () => {},
    SDK_VERSION: '4.2.0',
    INTERNAL: {},
    default: {},
    auth: {},
    User: {},
    database: {}
  },
  isDeleted_: false,
  services_: { auth: {} },
  name_: '[DEFAULT]',
  options_: {
    apiKey: 'AIzaSyAxlh-gBxcRkQWbxC0L10S5Qo3Su6xRs8E',
    authDomain: 'fir-editor.firebaseapp.com',
    databaseURL: 'https://fir-editor.firebaseio.com',
    storageBucket: 'fir-editor.appspot.com'
  },
  INTERNAL: {
    getUid: () => {},
    getToken: () => {},
    addAuthTokenListener: () => {},
    removeAuthTokenListener: () => {}
  }
};

describe('Flamelink SDK', () => {
  test('should expose the package version', () => {
    expect(flamelink.VERSION).toBe(pkg.version);
  });

  test('should expose a factory function', () => {
    expect(typeof flamelink).toBe('function');
  });

  test('should throw an error if initialized without the mandatory properties', () => {
    expect(flamelink).toThrow('[FLAMELINK] The following config properties are mandatory: "apiKey", "authDomain", "databaseURL"');
  });

  test('should expose the `firebaseApp` instance if passed in via config', () => {
    expect(
      flamelink({
        apiKey: 'AIzaSyAxlh-gBxcRkQWbxC0L10S5Qo3Su6xRs8E',
        authDomain: 'fir-editor.firebaseapp.com',
        databaseURL: 'https://fir-editor.firebaseio.com',
        storageBucket: 'fir-editor.appspot.com'
      })
    ).toBeTruthy();
    expect(flamelink({ firebaseApp: fakeFirebaseApp }).firebaseApp).toBe(fakeFirebaseApp);
  });

  test('should expose a "setLanguage" method', () => {
    expect(flamelink().hasOwnProperty('setLanguage')).toBe(true);
  });

  test('should expose a "setEnv" method', () => {
    expect(flamelink().hasOwnProperty('setEnv')).toBe(true);
  });

  describe('Content', () => {
    test('should expose a "getRaw" method', () => {
      expect(flamelink().content.hasOwnProperty('getRaw')).toBe(true);
    });

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
