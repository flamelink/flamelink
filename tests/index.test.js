import flamelink from '../src/index';
import pkg from '../package.json';

jest.mock('firebase');

const basicConfig = {
  apiKey: 'AIzaSyAxlh-gBxcRkQWbxC0L10S5Qo3Su6xRs8E',
  authDomain: 'fir-editor.firebaseapp.com',
  databaseURL: 'https://fir-editor.firebaseio.com',
  storageBucket: 'fir-editor.appspot.com'
};

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
    database: () => {}
  },
  isDeleted_: false,
  services_: { auth: {} },
  name_: '[DEFAULT]',
  options_: basicConfig,
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
    expect(flamelink(basicConfig)).toBeTruthy();
    expect(flamelink({ firebaseApp: fakeFirebaseApp }).firebaseApp).toBe(fakeFirebaseApp);
  });

  describe('"setLocale"', () => {
    test('should be exposed on app instance', () => {
      expect(flamelink(basicConfig).hasOwnProperty('setLocale')).toBe(true);
    });

    test('should throw an error if called with an unsupported locale', () => {
      expect.assertions(1);

      const app = flamelink(basicConfig);
      const testLocale = 'randomstring';

      return expect(app.setLocale(testLocale)).rejects.toMatch(`[FLAMELINK] "${testLocale}" is not a supported locale. Supported Locales: en-US`);
    });
  });

  test('should expose a "getLocale" method', () => {
    const app = flamelink(basicConfig);
    expect(app.hasOwnProperty('getLocale')).toBe(true);
    expect(app.getLocale()).toEqual('en-US');
  });

  describe('"setEnv"', () => {
    test('should be exposed on app instance', () => {
      expect(flamelink(basicConfig).hasOwnProperty('setEnv')).toBe(true);
    });

    test('should throw an error if called with an unsupported environment', () => {
      expect.assertions(1);

      const app = flamelink(basicConfig);
      const testEnvironment = 'randomstring';

      return expect(app.setEnv(testEnvironment)).rejects.toMatch(
        `[FLAMELINK] "${testEnvironment}" is not a supported environment. Supported Environments: production`
      );
    });
  });

  test('should expose a "getEnv" method', () => {
    const app = flamelink(basicConfig);
    expect(app.hasOwnProperty('getEnv')).toBe(true);
    expect(app.getEnv()).toEqual('production');
  });

  describe('Content', () => {
    test('should expose a "ref" method', () => {
      expect(flamelink(basicConfig).content.ref).toEqual(expect.any(Function));
    });

    test('should expose a "getRaw" method', () => {
      expect(flamelink(basicConfig).content.getRaw).toEqual(expect.any(Function));
    });

    test('should expose a "get" method', () => {
      expect(flamelink(basicConfig).content.get).toEqual(expect.any(Function));
    });

    test('should expose a "set" method', () => {
      expect(flamelink(basicConfig).content.set).toEqual(expect.any(Function));
    });

    test('should expose an "on" method', () => {
      expect(flamelink(basicConfig).content.on).toEqual(expect.any(Function));
    });

    test('should expose an "off" method', () => {
      expect(flamelink(basicConfig).content.off).toEqual(expect.any(Function));
    });

    test('should expose a "remove" method', () => {
      expect(flamelink(basicConfig).content.remove).toEqual(expect.any(Function));
    });

    test('should expose an "update" method', () => {
      expect(flamelink(basicConfig).content.update).toEqual(expect.any(Function));
    });

    test('should expose a "transaction" method', () => {
      expect(flamelink(basicConfig).content.transaction).toEqual(expect.any(Function));
    });
  });

  describe('Navigation', () => {
    test('should expose a "ref" method', () => {
      expect(flamelink(basicConfig).nav.ref).toEqual(expect.any(Function));
    });

    test('should expose a "getRaw" method', () => {
      expect(flamelink(basicConfig).nav.getRaw).toEqual(expect.any(Function));
    });

    test('should expose a "get" method', () => {
      expect(flamelink(basicConfig).nav.get).toEqual(expect.any(Function));
    });

    test('should expose a "set" method', () => {
      expect(flamelink(basicConfig).nav.set).toEqual(expect.any(Function));
    });

    test('should expose an "on" method', () => {
      expect(flamelink(basicConfig).nav.on).toEqual(expect.any(Function));
    });

    test('should expose an "off" method', () => {
      expect(flamelink(basicConfig).nav.off).toEqual(expect.any(Function));
    });

    test('should expose a "remove" method', () => {
      expect(flamelink(basicConfig).nav.remove).toEqual(expect.any(Function));
    });

    test('should expose an "update" method', () => {
      expect(flamelink(basicConfig).nav.update).toEqual(expect.any(Function));
    });

    test('should expose a "transaction" method', () => {
      expect(flamelink(basicConfig).nav.transaction).toEqual(expect.any(Function));
    });
  });
});
