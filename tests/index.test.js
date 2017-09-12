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
    test('should resolve with the given locale if called with a supported locale', () => {
      expect.assertions(1);

      const app = flamelink(basicConfig);
      const testLocale = 'en-US';

      return expect(app.setLocale(testLocale)).resolves.toBe(testLocale);
    });

    test('should reject with an error if called with an unsupported locale', async () => {
      expect.assertions(1);
      const app = flamelink(basicConfig);
      const testLocale = 'randomstring';

      let message;

      try {
        await app.setLocale(testLocale);
      } catch (error) {
        message = error.message;
      }

      expect(message).toMatch(`[FLAMELINK] "${testLocale}" is not a supported locale. Supported Locales: en-US`);
    });
  });

  test('should expose a "getLocale" method', () => {
    const app = flamelink(basicConfig);
    expect(app.hasOwnProperty('getLocale')).toBe(true);
    return expect(app.getLocale()).resolves.toBe('en-US');
  });

  describe('"setEnv"', () => {
    test('should resolve with the given environment if called with a supported environment', () => {
      expect.assertions(1);

      const app = flamelink(basicConfig);
      const testEnvironment = 'production';

      return expect(app.setEnv(testEnvironment)).resolves.toBe(testEnvironment);
    });

    test('should reject with an error if called with an unsupported environment', async () => {
      expect.assertions(1);
      const app = flamelink(basicConfig);
      const testEnvironment = 'randomstring';

      let message;

      try {
        await app.setEnv(testEnvironment);
      } catch (error) {
        message = error.message;
      }

      expect(message).toMatch(`[FLAMELINK] "${testEnvironment}" is not a supported environment. Supported Environments: production`);
    });
  });

  test('should expose a "getEnv" method', () => {
    const app = flamelink(basicConfig);
    expect(app.hasOwnProperty('getEnv')).toBe(true);
    return expect(app.getEnv()).resolves.toBe('production');
  });

  describe('Content', () => {
    test('should expose a "ref" method', () => {
      expect(flamelink(basicConfig).content.ref).toEqual(expect.any(Function));
    });

    test('should expose a "getRaw" method', () => {
      expect(flamelink(basicConfig).content.getRaw).toEqual(expect.any(Function));
    });

    describe('"get" Method', () => {
      test('should be exposed on the "content" object', () => {
        const ref = 'get-ref';
        return expect(flamelink(basicConfig).content.get(ref, {})).resolves.toEqual({
          'content-type-1': {
            id: 1491679616674,
            name: 'ASP'
          },
          'content-type-2': {
            id: 1491679616683,
            name: 'Axor'
          }
        });
      });

      test('should respect the "fields" option', () => {
        const ref = 'get-ref';
        return expect(flamelink(basicConfig).content.get(ref, { fields: ['name'] })).resolves.toEqual({
          'content-type-1': {
            name: 'ASP'
          },
          'content-type-2': {
            name: 'Axor'
          }
        });
      });
    });

    test('should expose a "set" method', () => {
      const payload = { key: 'value' };
      expect(flamelink(basicConfig).content.set('ref', payload)).toEqual(`"set" called with payload: "${JSON.stringify(payload)}"`);
    });

    test('should expose a "onRaw" method', () => {
      const cb = jest.fn();
      flamelink(basicConfig).content.onRaw('ref', {}, cb);
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0].val()).toEqual(`"on" called with event: "value"`);
      flamelink(basicConfig).content.onRaw('ref', cb);
      expect(cb.mock.calls.length).toEqual(2);
      expect(cb.mock.calls[0][0].val()).toEqual(`"on" called with event: "value"`);
    });

    test('should expose an "on" method', () => {
      const cb = jest.fn();
      flamelink(basicConfig).content.on('ref', {}, cb);
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(`"on" called with event: "value"`);
      flamelink(basicConfig).content.on('ref', cb);
      expect(cb.mock.calls.length).toEqual(2);
      expect(cb.mock.calls[0][0]).toEqual(`"on" called with event: "value"`);
    });

    test('should expose an "off" method', () => {
      const event = 'something';
      expect(flamelink(basicConfig).content.off('ref', event)).toEqual(`"off" called with event: "${event}"`);
      expect(flamelink(basicConfig).content.off('ref')).toEqual(`"off" called with event: "undefined"`);
    });

    test('should expose a "remove" method', () => {
      const ref = 'choccie';
      expect(flamelink(basicConfig).content.remove(ref)).toEqual(`"remove" called for "/environments/production/content/${ref}/en-US"`);
    });

    test('should expose an "update" method', () => {
      const payload = { key: 'value' };
      expect(flamelink(basicConfig).content.update('ref', payload)).toEqual(`"update" called with payload: "${JSON.stringify(payload)}"`);
    });

    test('should expose a "transaction" method', () => {
      const updateFn = jest.fn();
      const completeFn = jest.fn();
      flamelink(basicConfig).content.transaction('ref', updateFn, completeFn);
      expect(updateFn.mock.calls.length).toEqual(1);
      expect(completeFn.mock.calls.length).toEqual(1);
      flamelink(basicConfig).content.transaction('ref', updateFn);
      expect(updateFn.mock.calls.length).toEqual(2);
      expect(completeFn.mock.calls.length).toEqual(1);
    });
  });

  describe('Navigation', () => {
    test('should expose a "ref" method', () => {
      expect(flamelink(basicConfig).nav.ref).toEqual(expect.any(Function));
    });

    test('should expose a "getRaw" method', () => {
      expect(flamelink(basicConfig).nav.getRaw).toEqual(expect.any(Function));
    });

    describe('"get" Method', () => {
      test('should be exposed on the "nav" object', () => {
        const ref = 'get-ref';
        return expect(flamelink(basicConfig).nav.get(ref, {})).resolves.toEqual({
          id: 'main',
          items: [
            {
              attachment: 0,
              component: 'Template',
              cssClass: '',
              id: 1491798664087,
              newWindow: '',
              order: 0,
              parentIndex: 0,
              title: 'Homes',
              url: '/',
              uuid: 1491798664087
            },
            {
              attachment: 0,
              component: 'About',
              cssClass: '',
              id: 1491799269435,
              newWindow: '',
              order: 1,
              parentIndex: 0,
              title: 'About',
              url: '/about-us',
              uuid: 1491799269435
            }
          ],
          title: 'main'
        });
      });
    });

    describe('"getItems" Method', () => {
      test('should be exposed on the "nav" object', () => {
        const ref = 'get-items-ref';
        return expect(flamelink(basicConfig).nav.getItems(ref, {})).resolves.toEqual([
          {
            attachment: 0,
            component: 'Template',
            cssClass: '',
            id: 1491798664087,
            newWindow: '',
            order: 0,
            parentIndex: 0,
            title: 'Homes',
            url: '/',
            uuid: 1491798664087
          },
          {
            attachment: 0,
            component: 'About',
            cssClass: '',
            id: 1491799269435,
            newWindow: '',
            order: 1,
            parentIndex: 0,
            title: 'About',
            url: '/about-us',
            uuid: 1491799269435
          }
        ]);
      });

      test('should respect the "fields" option', () => {
        const ref = 'get-items-ref';
        return expect(flamelink(basicConfig).nav.getItems(ref, { fields: ['cssClass', 'title', 'url'] })).resolves.toEqual([
          {
            cssClass: '',
            title: 'Homes',
            url: '/'
          },
          {
            cssClass: '',
            title: 'About',
            url: '/about-us'
          }
        ]);
      });
    });

    test('should expose a "set" method', () => {
      const payload = { key: 'value' };
      expect(flamelink(basicConfig).nav.set('ref', payload)).toEqual(`"set" called with payload: "${JSON.stringify(payload)}"`);
    });

    test('should expose a "onRaw" method', () => {
      const cb = jest.fn();
      flamelink(basicConfig).nav.onRaw('ref', {}, cb);
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0].val()).toEqual(`"on" called with event: "value"`);
      flamelink(basicConfig).nav.onRaw('ref', cb);
      expect(cb.mock.calls.length).toEqual(2);
      expect(cb.mock.calls[0][0].val()).toEqual(`"on" called with event: "value"`);
    });

    test('should expose an "on" method', () => {
      const cb = jest.fn();
      flamelink(basicConfig).nav.on('ref', {}, cb);
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0]).toEqual(`"on" called with event: "value"`);
      flamelink(basicConfig).nav.on('ref', cb);
      expect(cb.mock.calls.length).toEqual(2);
      expect(cb.mock.calls[0][0]).toEqual(`"on" called with event: "value"`);
    });

    test('should expose an "off" method', () => {
      const event = 'something';
      expect(flamelink(basicConfig).nav.off('ref', event)).toEqual(`"off" called with event: "${event}"`);
      expect(flamelink(basicConfig).nav.off('ref')).toEqual(`"off" called with event: "undefined"`);
    });

    test('should expose a "remove" method', () => {
      const ref = 'choccie';
      expect(flamelink(basicConfig).nav.remove(ref)).toEqual(`"remove" called for "/environments/production/navigation/${ref}/en-US"`);
    });

    test('should expose an "update" method', () => {
      const payload = { key: 'value' };
      expect(flamelink(basicConfig).nav.update('ref', payload)).toEqual(`"update" called with payload: "${JSON.stringify(payload)}"`);
    });

    test('should expose a "transaction" method', () => {
      const updateFn = jest.fn();
      const completeFn = jest.fn();
      flamelink(basicConfig).nav.transaction('ref', updateFn, completeFn);
      expect(updateFn.mock.calls.length).toEqual(1);
      expect(completeFn.mock.calls.length).toEqual(1);
      flamelink(basicConfig).nav.transaction('ref', updateFn);
      expect(updateFn.mock.calls.length).toEqual(2);
      expect(completeFn.mock.calls.length).toEqual(1);
    });
  });

  describe('Schemas', () => {
    test('should expose a "ref" method', () => {
      expect(flamelink(basicConfig).schemas.ref).toEqual(expect.any(Function));
    });

    test('should expose a "getAllRaw" method', () => {
      expect(flamelink(basicConfig).schemas.getAllRaw).toEqual(expect.any(Function));
    });

    describe('"getAll" method', () => {
      test('should return all schemas', () => {
        return expect(flamelink(basicConfig).schemas.getAll()).resolves.toEqual(
          expect.objectContaining({
            'about-us': expect.objectContaining({
              description: expect.any(String),
              display: expect.any(Boolean),
              fields: expect.any(Array),
              group: expect.any(String),
              icon: expect.any(String),
              id: expect.any(String),
              menuIndex: expect.any(Number),
              title: expect.any(String),
              type: expect.any(String)
            }),
            brands: expect.objectContaining({
              description: expect.any(String),
              display: expect.any(Boolean),
              fields: expect.any(Array),
              group: expect.any(String),
              icon: expect.any(String),
              id: expect.any(String),
              menuIndex: expect.any(Number),
              title: expect.any(String),
              type: expect.any(String)
            })
          })
        );
      });

      test('should respect the "fields" option', () => {
        return expect(flamelink(basicConfig).schemas.getAll({ fields: ['description', 'id', 'title'] })).resolves.toEqual({
          'about-us': {
            description: expect.any(String),
            id: expect.any(String),
            title: expect.any(String)
          },
          brands: {
            description: expect.any(String),
            id: expect.any(String),
            title: expect.any(String)
          }
        });
      });
    });

    test('should expose a "getRaw" method', () => {
      expect(flamelink(basicConfig).schemas.getRaw).toEqual(expect.any(Function));
    });

    describe('"get" method', () => {
      test('should return a single schema', () => {
        const ref = 'get-schema';
        return expect(flamelink(basicConfig).schemas.get(ref)).resolves.toEqual(
          expect.objectContaining({
            description: expect.any(String),
            display: expect.any(Boolean),
            fields: expect.any(Array),
            group: expect.any(String),
            icon: expect.any(String),
            id: expect.any(String),
            menuIndex: expect.any(Number),
            title: expect.any(String),
            type: expect.any(String)
          })
        );
      });

      test('should respect the "fields" option', () => {
        const ref = 'get-schema';
        return expect(flamelink(basicConfig).schemas.get(ref, { fields: ['description', 'id', 'title'] })).resolves.toEqual({
          description: expect.any(String),
          id: expect.any(String),
          title: expect.any(String)
        });
      });
    });

    test('should expose a "getFieldsRaw" method', () => {
      expect(flamelink(basicConfig).schemas.getFieldsRaw).toEqual(expect.any(Function));
    });

    describe('"getFields" method', () => {
      test('should return a single schema', () => {
        const ref = 'get-entry-ref';
        return expect(flamelink(basicConfig).schemas.getFields(ref)).resolves.toEqual(expect.any(Array));
      });

      test('should respect the "fields" option', () => {
        const ref = 'get-entry-ref';
        return expect(flamelink(basicConfig).schemas.getFields(ref, { fields: ['description', 'title'] })).resolves.toEqual(
          expect.arrayContaining([
            {
              description: expect.any(String),
              title: expect.any(String)
            }
          ])
        );
      });
    });
  });
});
