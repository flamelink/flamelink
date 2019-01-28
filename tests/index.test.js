import flamelink from '../src/index';
import * as utils from '../src/utils/';
import { mockFile } from './helpers';
import imageSizesFixture from '../fixtures/image-sizes';

utils.hasNonCacheableOptions = jest.fn(() => true);

const basicConfig = {
  apiKey: 'AIzaSyAxlh-gBxcRkQWbxC0L10S5Qo3Su6xRs8E',
  authDomain: 'fir-editor.firebaseapp.com',
  databaseURL: 'https://fir-editor.firebaseio.com',
  projectId: 'fir-editor',
  storageBucket: 'fir-editor.appspot.com'
};

describe('Flamelink SDK', () => {
  test('should expose a factory function', () => {
    expect(typeof flamelink).toBe('function');
  });

  test('should throw an error if initialized without the mandatory properties', () => {
    expect(flamelink).toThrow(
      '[FLAMELINK] The following config properties are mandatory: "apiKey", "authDomain", "databaseURL", "projectId"'
    );
  });

  describe('Settings', () => {
    describe('"setLocale"', () => {
      test('should resolve with the given locale if called with a supported locale', () => {
        expect.assertions(1);

        const app = flamelink(basicConfig);
        const testLocale = 'en-US';

        return expect(app.settings.setLocale(testLocale)).resolves.toBe(testLocale);
      });

      test('should reject with an error if called with an unsupported locale', async () => {
        expect.assertions(1);
        const app = flamelink(basicConfig);
        const testLocale = 'randomstring';

        let message;

        try {
          await app.settings.setLocale(testLocale);
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "${testLocale}" is not a supported locale. Supported Locales: en-US`
        );
      });
    });

    test('should expose a "getLocale" method', () => {
      const app = flamelink(basicConfig);
      return expect(app.settings.getLocale()).resolves.toBe('en-US');
    });

    describe('"setEnvironment"', () => {
      test('should resolve with the given environment if called with a supported environment', () => {
        expect.assertions(1);

        const app = flamelink(basicConfig);
        const testEnvironment = 'production';

        return expect(app.settings.setEnvironment(testEnvironment)).resolves.toBe(testEnvironment);
      });

      test('should reject with an error if called with an unsupported environment', async () => {
        expect.assertions(1);
        const app = flamelink(basicConfig);
        const testEnvironment = 'randomstring';

        let message;

        try {
          await app.settings.setEnvironment(testEnvironment);
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "${testEnvironment}" is not a supported environment. Supported Environments: production`
        );
      });
    });

    test('should expose a "getEnvironment" method', () => {
      const app = flamelink(basicConfig);
      return expect(app.settings.getEnvironment()).resolves.toBe('production');
    });

    test('should expose a "getImageSizes" method', () => {
      const app = flamelink(basicConfig);
      return expect(app.settings.getImageSizes()).resolves.toEqual(imageSizesFixture());
    });
  });

  describe('Content', () => {
    test('should expose a "ref" method', () => {
      expect(flamelink(basicConfig).content.ref).toEqual(expect.any(Function));
    });

    describe('"get" Method', () => {
      describe('for all entries of a given content type', () => {
        test('should be exposed on the "content" object', () => {
          const ref = 'get-ref';
          return expect(flamelink(basicConfig).content.get(ref)).resolves.toEqual({
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
          return expect(
            flamelink(basicConfig).content.get(ref, { fields: ['name'] })
          ).resolves.toEqual({
            'content-type-1': {
              name: 'ASP'
            },
            'content-type-2': {
              name: 'Axor'
            }
          });
        });

        test('should pass through custom events', () => {
          const ref = 'random-non-existing-ref';
          return expect(
            flamelink(basicConfig).content.get(ref, { event: 'child_added' })
          ).resolves.toEqual({ test: '"once" called with event: "child_added"' });
        });
      });

      describe('for a single entry of a given content type', () => {
        test('should be exposed on the "content" object', () => {
          const contentRef = 'get-entry-ref';
          const entryRef = 'entry-ref';
          return expect(flamelink(basicConfig).content.get(contentRef, entryRef)).resolves.toEqual({
            brand: [1491679616700],
            classification: [
              1491683439177,
              1491683439514,
              1491683439236,
              1491683439455,
              1491683439241,
              1491683439435
            ],
            finish: 'Chrome',
            id: 1491827711368,
            image: ['-KhTzFZtaoA1wwxhgIav'],
            material: 'Brass',
            price: '123.00',
            productCode: 'HG31685003',
            showPrice: '1',
            site1: '1',
            status: 'publish',
            supplierCode: '31685003',
            titleA: 'Metris Shower/Bath Finish Set Round Large'
          });
        });

        test('should pass through custom events', () => {
          const contentRef = 'random-non-existing-ref';
          const entryRef = 'random-non-existing-ref';
          return expect(
            flamelink(basicConfig).content.get(contentRef, entryRef, { event: 'child_added' })
          ).resolves.toEqual({ test: '"once" called with event: "child_added"' });
        });

        test('should respect the "fields" option', () => {
          const contentRef = 'get-entry-ref';
          const entryRef = 'entry-ref';
          const options = { fields: ['brand', 'productCode', 'status', 'price'] };
          return expect(
            flamelink(basicConfig).content.get(contentRef, entryRef, options)
          ).resolves.toEqual({
            brand: [1491679616700],
            price: '123.00',
            productCode: 'HG31685003',
            status: 'publish'
          });
        });

        test('should respect the "populate" option', () => {
          const contentRef = 'get-entry-ref';
          const entryRef = 'entry-ref';
          const options = { populate: ['brand'] };
          return expect(
            flamelink(basicConfig).content.get(contentRef, entryRef, options)
          ).resolves.toEqual({
            brand: [
              {
                id: 1491679616700,
                name: 'Hansgrohe',
                order: 55,
                parentId: 0
              }
            ],
            classification: [
              1491683439177,
              1491683439514,
              1491683439236,
              1491683439455,
              1491683439241,
              1491683439435
            ],
            finish: 'Chrome',
            id: 1491827711368,
            image: ['-KhTzFZtaoA1wwxhgIav'],
            material: 'Brass',
            price: '123.00',
            productCode: 'HG31685003',
            showPrice: '1',
            site1: '1',
            status: 'publish',
            supplierCode: '31685003',
            titleA: 'Metris Shower/Bath Finish Set Round Large'
          });
        });
      });
    });

    describe('"getByField" Method', () => {
      test('should pass all values to the "get" method', done => {
        const app = flamelink(basicConfig);
        const spy = jest.spyOn(app.content, 'get');
        const ref = 'get-ref';
        const fieldName = 'name';
        const fieldValue = 'value';
        const options = {};
        app.content.getByField(ref, fieldName, fieldValue, options).then(() => {
          expect(spy).toHaveBeenCalledWith(ref, { equalTo: fieldValue, orderByChild: fieldName });
          done();
        });
      });
    });

    describe('"subscribe" Method', () => {
      test('should have a related "subscribeRaw" method', () => {
        const tests = [
          {
            args: ['contentRef', jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', {}, jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', { event: 'child_moved' }, jest.fn()],
            expect: '"on" called with event: "child_moved"'
          },
          {
            args: ['contentRef', 'entryRef', jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', 'entryRef', {}, jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', 'entryRef', { event: 'child_added' }, jest.fn()],
            expect: '"on" called with event: "child_added"'
          }
        ];

        tests.forEach(test => {
          flamelink(basicConfig).content.subscribeRaw(...test.args);
          const cb = test.args.pop();
          expect(cb.mock.calls.length).toEqual(1);
          expect(cb.mock.calls[0][0].val()).toEqual(test.expect);
        });
      });

      test('should handle arguments in any of the acceptable orders', done => {
        // Callback automatically added as the last argument for each test
        const tests = [
          {
            args: ['contentRef'],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', {}],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', { event: 'child_moved' }],
            expect: '"on" called with event: "child_moved"'
          },
          {
            args: ['contentRef', 'entryRef'],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', 'entryRef', {}],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['contentRef', 'entryRef', { event: 'child_added' }],
            expect: '"on" called with event: "child_added"'
          }
        ];

        tests.forEach((test, index) => {
          flamelink(basicConfig).content.subscribe(...test.args, result => {
            expect(result).toEqual(null, test.expect);

            if (tests.length === index + 1) {
              done();
            }
          });
        });
      });

      test('should respect the "fields" option', done => {
        const contentRef = 'subscribe-content-entry-ref';
        const entryRef = 'entry-ref';
        const options = { fields: ['brand', 'productCode', 'status', 'price'] };

        flamelink(basicConfig).content.subscribe(contentRef, entryRef, options, result => {
          expect(result).toEqual(null, {
            brand: [1491679616700],
            price: '123.00',
            productCode: 'HG31685003',
            status: 'publish'
          });
          done();
        });
      });

      test('should respect the "populate" option', done => {
        const contentRef = 'subscribe-content-entry-ref';
        const entryRef = 'entry-ref';
        const options = { populate: ['brand'] };

        flamelink(basicConfig).content.subscribe(contentRef, entryRef, options, result => {
          expect(result).toEqual(null, {
            brand: [
              {
                id: 1491679616700,
                name: 'Hansgrohe',
                order: 55,
                parentId: 0
              }
            ],
            classification: [
              1491683439177,
              1491683439514,
              1491683439236,
              1491683439455,
              1491683439241,
              1491683439435
            ],
            finish: 'Chrome',
            id: 1491827711368,
            image: ['-KhTzFZtaoA1wwxhgIav'],
            material: 'Brass',
            price: '123.00',
            productCode: 'HG31685003',
            showPrice: '1',
            site1: '1',
            status: 'publish',
            supplierCode: '31685003',
            titleA: 'Metris Shower/Bath Finish Set Round Large'
          });
          done();
        });
      });
    });

    describe('"unsubscribe" Method', () => {
      test('should throw if called with incorrect number of arguments', () => {
        let message;

        try {
          flamelink(basicConfig).content.unsubscribe();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          '[FLAMELINK] "unsubscribe" method needs to be called with min 1 argument and max 3 arguments'
        );

        message = '';

        try {
          flamelink(basicConfig).content.unsubscribe('ref', 'entry', 'value', 'some-4th-arg');
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          '[FLAMELINK] "unsubscribe" method needs to be called with min 1 argument and max 3 arguments'
        );
      });

      test('should unsubscribe all events for given content ref', () => {
        expect(flamelink(basicConfig).content.unsubscribe('ref')).toEqual(
          '"off" called with event: "undefined"'
        );
      });

      test('should unsubscribe all events for given entry ref', () => {
        expect(flamelink(basicConfig).content.unsubscribe('ref', 'entry')).toEqual(
          '"off" called with event: "undefined"'
        );
      });

      test('should unsubscribe given event for given content ref', () => {
        const event = 'child_moved';
        expect(flamelink(basicConfig).content.unsubscribe('ref', event)).toEqual(
          `"off" called with event: "${event}"`
        );
      });

      test('should unsubscribe given event for given entry ref', () => {
        const event = 'child_moved';
        expect(flamelink(basicConfig).content.unsubscribe('ref', 'entry', event)).toEqual(
          `"off" called with event: "${event}"`
        );
      });
    });

    describe('"set" Method', () => {
      test('should be exposed on the "content" object', () => {
        const contentRef = 'ref';
        const entryRef = 'entry-ref';
        const payload = { image: 'value' };
        const result = /"set" called with payload: "{"image":"value","__meta__":{"createdBy":"(.*)","createdDate":"(.*)"},"id":"entry-ref"}"/;
        return expect(
          flamelink(basicConfig).content.set(contentRef, entryRef, payload)
        ).resolves.toMatch(result);
      });

      test('should throw if called with the incorrect arguments', async () => {
        try {
          await flamelink(basicConfig).content.set();
        } catch (err) {
          expect(err.message).toEqual(
            '[FLAMELINK] "set" called with the incorrect arguments. Check the docs for details.'
          );
        }

        try {
          await flamelink(basicConfig).content.set('content-ref');
        } catch (error) {
          expect(error.message).toEqual(
            '[FLAMELINK] "set" called with the incorrect arguments. Check the docs for details.'
          );
        }

        try {
          await flamelink(basicConfig).content.set('content-ref', 'entry-ref');
        } catch (error) {
          expect(error.message).toEqual(
            '[FLAMELINK] "set" called with the incorrect arguments. Check the docs for details.'
          );
        }

        try {
          await flamelink(basicConfig).content.set('content-ref', 'entry-ref', 'not-an-object');
        } catch (error) {
          expect(error.message).toEqual(
            '[FLAMELINK] "set" called with the incorrect arguments. Check the docs for details.'
          );
        }
      });
    });

    describe('"update" Method', () => {
      test('should be exposed on the "content" object', () => {
        const contentRef = 'ref';
        const entryRef = 'entry-ref';
        const payload = { image: 'value' };
        const result = /"update" called with payload: "{"image":"value","__meta__\/lastModifiedBy":"(.*)","__meta__\/lastModifiedDate":"(.*)","id":"entry-ref"}"/;
        return expect(
          flamelink(basicConfig).content.update(contentRef, entryRef, payload)
        ).resolves.toMatch(result);
      });

      test('should throw if called with the incorrect arguments', async () => {
        try {
          await flamelink(basicConfig).content.update();
        } catch (err) {
          expect(err.message).toEqual(
            '[FLAMELINK] "update" called with the incorrect arguments. Check the docs for details.'
          );
        }

        try {
          await flamelink(basicConfig).content.update('content-ref');
        } catch (error) {
          expect(error.message).toEqual(
            '[FLAMELINK] "update" called with the incorrect arguments. Check the docs for details.'
          );
        }

        try {
          await flamelink(basicConfig).content.update('content-ref', 'entry-ref');
        } catch (error) {
          expect(error.message).toEqual(
            '[FLAMELINK] "update" called with the incorrect arguments. Check the docs for details.'
          );
        }

        try {
          await flamelink(basicConfig).content.update('content-ref', 'entry-ref', 'not-an-object');
        } catch (error) {
          expect(error.message).toEqual(
            '[FLAMELINK] "update" called with the incorrect arguments. Check the docs for details.'
          );
        }
      });
    });

    test('should expose a "remove" method', () => {
      const ref = 'choccie';
      const entryRef = 'choccie';
      return expect(flamelink(basicConfig).content.remove(ref, entryRef)).resolves.toEqual(
        `"remove" called for "/flamelink/environments/production/content/${ref}/en-US/choccie"`
      );
    });

    test('should expose a "transaction" method', () => {
      const contentRef = 'ref';
      const entryRef = 'entry-ref';
      const updateFn = jest.fn();
      const completeFn = jest.fn();
      flamelink(basicConfig).content.transaction(contentRef, entryRef, updateFn, completeFn);
      expect(updateFn.mock.calls.length).toEqual(1);
      expect(completeFn.mock.calls.length).toEqual(1);
      flamelink(basicConfig).content.transaction(contentRef, entryRef, updateFn);
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
      test('should get an individual navigation menu', () => {
        const navRef = 'get-ref';
        return expect(flamelink(basicConfig).nav.get(navRef, {})).resolves.toEqual({
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

      test('should get all navigation menus', () =>
        expect(flamelink(basicConfig).nav.get({})).resolves.toEqual({
          main: {
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
          },
          footer: {
            id: 'footer',
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
            title: 'footer'
          }
        }));

      test('should respect `fields` option when getting all navigation menus', () =>
        expect(flamelink(basicConfig).nav.get({ fields: ['items'] })).resolves.toEqual({
          main: {
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
            ]
          },
          footer: {
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
            ]
          }
        }));
    });

    describe('"getItems" Method', () => {
      test('should be exposed on the "nav" object', () => {
        const navRef = 'get-items-ref';
        return expect(flamelink(basicConfig).nav.getItems(navRef, {})).resolves.toEqual([
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
        const navRef = 'get-items-ref';
        return expect(
          flamelink(basicConfig).nav.getItems(navRef, {
            fields: ['cssClass', 'title', 'url']
          })
        ).resolves.toEqual([
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

    test('should expose a "subscribeRaw" method', () => {
      const cb = jest.fn();
      flamelink(basicConfig).nav.subscribeRaw('ref', {}, cb);
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0].val()).toEqual('"on" called with event: "value"');
      flamelink(basicConfig).nav.subscribeRaw('ref', cb);
      expect(cb.mock.calls.length).toEqual(2);
      expect(cb.mock.calls[0][0].val()).toEqual('"on" called with event: "value"');
    });

    describe('"subscribe" Method', () => {
      test('should have a related "subscribeRaw" method', () => {
        const tests = [
          {
            args: [jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: [{}, jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['navRef', jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['navRef', {}, jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['navRef', { event: 'child_moved' }, jest.fn()],
            expect: '"on" called with event: "child_moved"'
          }
        ];

        tests.forEach(test => {
          flamelink(basicConfig).nav.subscribeRaw(...test.args);
          const cb = test.args.pop();
          expect(cb.mock.calls.length).toEqual(1);
          expect(cb.mock.calls[0][0].val()).toEqual(test.expect);
        });
      });

      test('should handle arguments in any of the acceptable orders', done => {
        // Callback automatically added as the last argument for each test
        const tests = [
          {
            args: [],
            expect: '"on" called with event: "value"'
          },
          {
            args: [{}],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['navRef'],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['navRef', {}],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['navRef', { event: 'child_moved' }],
            expect: '"on" called with event: "child_moved"'
          }
        ];

        tests.forEach((test, index) => {
          flamelink(basicConfig).nav.subscribe(...test.args, result => {
            expect(result).toEqual(null, test.expect);

            if (tests.length === index + 1) {
              done();
            }
          });
        });
      });

      test('should respect the "fields" option for a single menu', done => {
        const navRef = 'subscribe-nav-entry-ref';
        const options = { fields: ['brand', 'productCode', 'status', 'price'] };

        flamelink(basicConfig).nav.subscribe(navRef, options, result => {
          expect(result).toEqual(null, {
            brand: [1491679616700],
            price: '123.00',
            productCode: 'HG31685003',
            status: 'publish'
          });
          done();
        });
      });

      test('should respect the "fields" option for all menus', done => {
        const options = { fields: ['brand', 'productCode', 'status', 'price'] };

        flamelink(basicConfig).nav.subscribe(options, result => {
          expect(result).toEqual(null, {
            brand: [1491679616700],
            price: '123.00',
            productCode: 'HG31685003',
            status: 'publish'
          });
          done();
        });
      });
    });

    describe('"unsubscribe" Method', () => {
      test('should throw if called with incorrect number of arguments', () => {
        let message;

        try {
          flamelink(basicConfig).nav.unsubscribe();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          '[FLAMELINK] "unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
        );

        message = '';

        try {
          flamelink(basicConfig).nav.unsubscribe('ref', 'value', 'some-3rd-arg');
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          '[FLAMELINK] "unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
        );
      });

      test('should throw if called with invalid child event', () => {
        let message;
        const event = 'invalid-event';

        try {
          flamelink(basicConfig).nav.unsubscribe('ref', event);
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(`[FLAMELINK] "${event}" is not a valid child event`);
      });

      test('should unsubscribe all events for given nav ref', () => {
        expect(flamelink(basicConfig).nav.unsubscribe('ref')).toEqual(
          '"off" called with event: "undefined"'
        );
      });

      test('should unsubscribe given event for given nav ref', () => {
        const event = 'child_moved';
        expect(flamelink(basicConfig).nav.unsubscribe('ref', event)).toEqual(
          `"off" called with event: "${event}"`
        );
      });
    });

    test('should expose a "set" method', () => {
      const payload = { key: 'value' };
      const result = /"set" called with payload: "{"key":"value","__meta__":{"createdBy":"(.*)","createdDate":"(.*)"},"id":"ref"}"/;

      return expect(flamelink(basicConfig).nav.set('ref', payload)).resolves.toMatch(result);
    });

    test('should expose an "update" method', () => {
      const payload = { key: 'value' };
      const result = /"update" called with payload: "{"key":"value","__meta__\/lastModifiedBy":"(.*)","__meta__\/lastModifiedDate":"(.*)","id":"ref"}"/;

      return expect(flamelink(basicConfig).nav.update('ref', payload)).resolves.toMatch(result);
    });

    test('should expose a "remove" method', () => {
      const ref = 'choccie';
      return expect(flamelink(basicConfig).nav.remove(ref)).resolves.toEqual(
        `"remove" called for "/flamelink/environments/production/navigation/${ref}/en-US"`
      );
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

    test('should expose a "getRaw" method', () => {
      expect(flamelink(basicConfig).schemas.getRaw).toEqual(expect.any(Function));
    });

    describe('"get" method', () => {
      test('should be able to return a single schema', () => {
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

      test('should be able to return all schemas', () =>
        expect(flamelink(basicConfig).schemas.get()).resolves.toEqual(
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
        ));

      test('should respect the "fields" option for single schemas', () => {
        const ref = 'get-schema';
        return expect(
          flamelink(basicConfig).schemas.get(ref, {
            fields: ['description', 'id', 'title']
          })
        ).resolves.toEqual({
          description: expect.any(String),
          id: expect.any(String),
          title: expect.any(String)
        });
      });

      test('should respect the "fields" option for all schemas', () =>
        expect(
          flamelink(basicConfig).schemas.get({
            fields: ['description', 'id', 'title']
          })
        ).resolves.toEqual({
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
        }));
    });

    test('should expose a "getFieldsRaw" method', () => {
      expect(flamelink(basicConfig).schemas.getFieldsRaw).toEqual(expect.any(Function));
    });

    describe('"getFields" method', () => {
      test('should return the fields for a single schema', () => {
        const ref = 'get-entry-ref';
        return expect(flamelink(basicConfig).schemas.getFields(ref)).resolves.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              description: expect.any(String),
              key: expect.any(String),
              title: expect.any(String),
              type: expect.any(String)
            })
          ])
        );
      });

      test('should return the fields for all schemas', () =>
        expect(flamelink(basicConfig).schemas.getFields()).resolves.toEqual(
          expect.objectContaining({
            'about-us': expect.arrayContaining([
              expect.objectContaining({
                description: expect.any(String),
                key: expect.any(String),
                title: expect.any(String),
                type: expect.any(String)
              })
            ]),
            brands: expect.arrayContaining([
              expect.objectContaining({
                description: expect.any(String),
                key: expect.any(String),
                title: expect.any(String),
                type: expect.any(String)
              })
            ])
          })
        ));

      test('should respect the "fields" option for single schemas', () => {
        const ref = 'get-entry-ref';
        return expect(
          flamelink(basicConfig).schemas.getFields(ref, {
            fields: ['description', 'title']
          })
        ).resolves.toEqual(
          expect.arrayContaining([
            {
              description: expect.any(String),
              title: expect.any(String)
            }
          ])
        );
      });

      test('should respect the "fields" option for all schemas', () =>
        expect(
          flamelink(basicConfig).schemas.getFields({
            fields: ['description', 'title']
          })
        ).resolves.toEqual(
          expect.objectContaining({
            'about-us': expect.arrayContaining([
              {
                description: expect.any(String),
                title: expect.any(String)
              }
            ]),
            brands: expect.arrayContaining([
              {
                description: expect.any(String),
                title: expect.any(String)
              }
            ])
          })
        ));
    });

    test('should expose a "subscribeRaw" method', () => {
      const cb = jest.fn();
      flamelink(basicConfig).schemas.subscribeRaw('ref', {}, cb);
      expect(cb.mock.calls.length).toEqual(1);
      expect(cb.mock.calls[0][0].val()).toEqual('"on" called with event: "value"');
      flamelink(basicConfig).schemas.subscribeRaw('ref', cb);
      expect(cb.mock.calls.length).toEqual(2);
      expect(cb.mock.calls[0][0].val()).toEqual('"on" called with event: "value"');
    });

    describe('"subscribe" Method', () => {
      test('should have a related "subscribeRaw" method', () => {
        const tests = [
          {
            args: [jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: [{}, jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['schemaKey', jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['schemaKey', {}, jest.fn()],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['schemaKey', { event: 'child_moved' }, jest.fn()],
            expect: '"on" called with event: "child_moved"'
          }
        ];

        tests.forEach(test => {
          flamelink(basicConfig).schemas.subscribeRaw(...test.args);
          const cb = test.args.pop();
          expect(cb.mock.calls.length).toEqual(1);
          expect(cb.mock.calls[0][0].val()).toEqual(test.expect);
        });
      });

      test('should handle arguments in any of the acceptable orders', done => {
        // Callback automatically added as the last argument for each test
        const tests = [
          {
            args: [],
            expect: '"on" called with event: "value"'
          },
          {
            args: [{}],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['schemaKey'],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['schemaKey', {}],
            expect: '"on" called with event: "value"'
          },
          {
            args: ['schemaKey', { event: 'child_moved' }],
            expect: '"on" called with event: "child_moved"'
          }
        ];

        tests.forEach((test, index) => {
          flamelink(basicConfig).schemas.subscribe(...test.args, result => {
            expect(result).toEqual(null, test.expect);

            if (tests.length === index + 1) {
              done();
            }
          });
        });
      });

      test('should respect the "fields" option for a single schema', done => {
        const schemaKey = 'get-schema';
        const options = { fields: ['description', 'id', 'title'] };

        flamelink(basicConfig).schemas.subscribe(schemaKey, options, result => {
          expect(result).toEqual(null, {
            description: expect.any(String),
            id: expect.any(String),
            title: expect.any(String)
          });
          done();
        });
      });

      test('should respect the "fields" option for all schemas', done => {
        const options = { fields: ['description', 'id', 'title'] };

        flamelink(basicConfig).schemas.subscribe(options, result => {
          expect(result).toEqual(null, {
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
          done();
        });
      });
    });

    describe('"unsubscribe" Method', () => {
      test('should throw if called with incorrect number of arguments', () => {
        let message;

        try {
          flamelink(basicConfig).schemas.unsubscribe();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          '[FLAMELINK] "unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
        );

        message = '';

        try {
          flamelink(basicConfig).schemas.unsubscribe('ref', 'value', 'some-3rd-arg');
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          '[FLAMELINK] "unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
        );
      });

      test('should throw if called with invalid child event', () => {
        let message;
        const event = 'invalid-event';

        try {
          flamelink(basicConfig).schemas.unsubscribe('ref', event);
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(`[FLAMELINK] "${event}" is not a valid child event`);
      });

      test('should unsubscribe all events for given schema ref', () => {
        expect(flamelink(basicConfig).schemas.unsubscribe('ref')).toEqual(
          '"off" called with event: "undefined"'
        );
      });

      test('should unsubscribe given event for given schema ref', () => {
        const event = 'child_moved';
        expect(flamelink(basicConfig).schemas.unsubscribe('ref', event)).toEqual(
          `"off" called with event: "${event}"`
        );
      });
    });

    test('should expose a "set" method', () => {
      const payload = { key: 'value' };
      const result = /"set" called with payload: "{"key":"value","__meta__":{"createdBy":"(.*)","createdDate":"(.*)"},"id":"ref"}"/;

      return expect(flamelink(basicConfig).schemas.set('ref', payload)).resolves.toMatch(result);
    });

    test('should expose an "update" method', () => {
      const payload = { key: 'value' };
      const result = /"update" called with payload: "{"key":"value","__meta__\/lastModifiedBy":"(.*)","__meta__\/lastModifiedDate":"(.*)","id":"ref"}"/;

      return expect(flamelink(basicConfig).schemas.update('ref', payload)).resolves.toMatch(result);
    });

    test('should expose a "remove" method', () => {
      const ref = 'choccie';
      return expect(flamelink(basicConfig).schemas.remove(ref)).resolves.toEqual(
        `"remove" called for "/flamelink/environments/production/schemas/${ref}"`
      );
    });

    test('should expose a "transaction" method', () => {
      const updateFn = jest.fn();
      const completeFn = jest.fn();
      flamelink(basicConfig).schemas.transaction('ref', updateFn, completeFn);
      expect(updateFn.mock.calls.length).toEqual(1);
      expect(completeFn.mock.calls.length).toEqual(1);
      flamelink(basicConfig).schemas.transaction('ref', updateFn);
      expect(updateFn.mock.calls.length).toEqual(2);
      expect(completeFn.mock.calls.length).toEqual(1);
    });
  });

  describe('Storage', () => {
    describe('"ref" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.ref).toEqual(expect.any(Function));
      });

      test('should call the Storage service\'s "ref" method for files and "refFromURL" for URLs', () => {
        const filename = 'filename.jpg';

        expect(flamelink(basicConfig).storage.ref(filename)).toEqual(
          expect.objectContaining({
            TESTING: {
              method: 'Storage.ref'
            }
          })
        );

        const fileURL = 'gs://some-test-path/filename.jpg';

        expect(flamelink(basicConfig).storage.ref(fileURL)).toEqual(
          expect.objectContaining({
            TESTING: {
              method: 'Storage.refFromURL'
            }
          })
        );
      });
    });

    test('should expose a "fileRef" method', () => {
      expect(flamelink(basicConfig).storage.fileRef).toEqual(expect.any(Function));
    });

    test('should expose a "folderRef" method', () => {
      expect(flamelink(basicConfig).storage.folderRef).toEqual(expect.any(Function));
    });

    test('should expose a "mediaRef" method', () => {
      expect(flamelink(basicConfig).storage.mediaRef).toEqual(expect.any(Function));
    });

    describe('"getFile" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.getFile).toEqual(expect.any(Function));
      });

      test('should throw an error if no arguments are given', async () => {
        const app = flamelink(basicConfig);
        let message;

        try {
          await app.storage.getFile();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "storage.getFile()" should be called with at least the file ID`
        );
      });

      test('should respect the "fields" option', () => {
        const fileId = 123456789;
        const options = { fields: ['id', 'type'] };
        return expect(flamelink(basicConfig).storage.getFile(fileId, options)).resolves.toEqual({
          id: fileId,
          type: 'files'
        });
      });

      test('should pass through custom events', () => {
        const fileId = 123456789;
        return expect(
          flamelink(basicConfig).storage.getFileRaw(fileId, { event: 'child_added' })
        ).resolves.toEqual(
          expect.objectContaining({ TESTING: expect.objectContaining({ event: 'child_added' }) })
        );
      });
    });

    describe('"getFiles" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.getFiles).toEqual(expect.any(Function));
      });

      test('should return all files if no arguments are given', () =>
        expect(flamelink(basicConfig).storage.getFiles()).resolves.toEqual({
          '1507628932841': {
            contentType: 'application/octet-stream',
            file: '1507628932841',
            folderId: 1506860565172,
            id: 1507628932841,
            type: 'files'
          },
          '1507630687950': {
            contentType: 'application/pdf',
            file: '1507630687950_Authorise Transfer - .pdf',
            folderId: 1506860565172,
            id: 1507630687950,
            type: 'files'
          },
          '1507632454996': {
            contentType: 'image/jpeg',
            file: '1507632454996_image.jpg',
            folderId: 1506860565172,
            id: 1507632454996,
            sizes: [
              {
                height: 9999,
                width: 1024
              },
              {
                height: 9999,
                width: 240
              }
            ],
            type: 'images'
          },
          '1507655509430': {
            contentType: 'image/jpeg',
            file: '1507655509430_image.jpg',
            folderId: 1506860565172,
            id: 1507655509430,
            sizes: [
              {
                height: 9999,
                width: 1024
              },
              {
                height: 9999,
                width: 240
              }
            ],
            type: 'images'
          }
        }));

      test('should respect the "fields" option', () => {
        const options = { fields: ['id', 'type'] };
        return expect(flamelink(basicConfig).storage.getFiles(options)).resolves.toEqual({
          '1507628932841': {
            id: 1507628932841,
            type: 'files'
          },
          '1507630687950': {
            id: 1507630687950,
            type: 'files'
          },
          '1507632454996': {
            id: 1507632454996,
            type: 'images'
          },
          '1507655509430': {
            id: 1507655509430,
            type: 'images'
          }
        });
      });

      test('should pass through custom events', () =>
        expect(
          flamelink(basicConfig).storage.getFilesRaw({ event: 'child_added' })
        ).resolves.toEqual(
          expect.objectContaining({ TESTING: expect.objectContaining({ event: 'child_added' }) })
        ));

      test('should be able to retrieve all files for given media type', () => {
        const options = { mediaType: 'images' };
        return expect(flamelink(basicConfig).storage.getFiles(options)).resolves.toEqual({
          '1507632454996': {
            contentType: 'image/jpeg',
            file: '1507632454996_image.jpg',
            folderId: 1506860565172,
            id: 1507632454996,
            sizes: [
              {
                height: 9999,
                width: 1024
              },
              {
                height: 9999,
                width: 240
              }
            ],
            type: 'images'
          },
          '1507655509430': {
            contentType: 'image/jpeg',
            file: '1507655509430_image.jpg',
            folderId: 1506860565172,
            id: 1507655509430,
            sizes: [
              {
                height: 9999,
                width: 1024
              },
              {
                height: 9999,
                width: 240
              }
            ],
            type: 'images'
          }
        });
      });

      test('should be able to retrieve all files for folder', () => {
        const options = { folderName: 'products' };
        return expect(flamelink(basicConfig).storage.getFiles(options)).resolves.toEqual({
          '1507628932841': {
            contentType: 'application/octet-stream',
            file: '1507628932841',
            folderId: 1506860565172,
            id: 1507628932841,
            type: 'files'
          },
          '1507630687950': {
            contentType: 'application/pdf',
            file: '1507630687950_Authorise Transfer - .pdf',
            folderId: 1506860565172,
            id: 1507630687950,
            type: 'files'
          },
          '1507632454996': {
            contentType: 'image/jpeg',
            file: '1507632454996_image.jpg',
            folderId: 1506860565172,
            id: 1507632454996,
            sizes: [
              {
                height: 9999,
                width: 1024
              },
              {
                height: 9999,
                width: 240
              }
            ],
            type: 'images'
          },
          '1507655509430': {
            contentType: 'image/jpeg',
            file: '1507655509430_image.jpg',
            folderId: 1506860565172,
            id: 1507655509430,
            sizes: [
              {
                height: 9999,
                width: 1024
              },
              {
                height: 9999,
                width: 240
              }
            ],
            type: 'images'
          }
        });
      });
    });

    describe('"getURL" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.getURL).toEqual(expect.any(Function));
      });

      test('should throw an error if no arguments are given', async () => {
        const app = flamelink(basicConfig);
        let message;

        try {
          await app.storage.getURL();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "storage.getURL()" should be called with at least the file ID`
        );
      });

      test('should return the URL for a given file ID', () => {
        const fileId = 987654321;
        return expect(flamelink(basicConfig).storage.getURL(fileId)).resolves.toEqual(
          'https://firebasestorage.googleapis.com/v0/b/test-bucket.appspot.com/o/flamelink%2Fmedia%2Fsomething'
        );
      });

      // TODO: Figure out how to test this with a mocked out firebase library
      test.skip('should respect the "size" option', () => {
        const fileId = 987654321;
        const options = { size: '1024' };
        return expect(flamelink(basicConfig).storage.getURL(fileId, options)).resolves.toEqual(
          'https://firebasestorage.googleapis.com/v0/b/test-bucket.appspot.com/o/flamelink%2Fmedia%2Fsomething'
        );
      });

      // TODO: Figure out how to test this with a mocked out firebase library
      test.skip('should respect the "smart" "size" option', () => {
        global.devicePixelRatio = 2;
        global.screen.width = 512;
        global.screen.height = 480;

        const size = 1024; // Device resolution should be 1024 (2 x 512)
        const fileId = 987654321;
        const options = { size: 'smart' };
        return expect(flamelink(basicConfig).storage.getURL(fileId, options)).resolves.toEqual(
          'https://firebasestorage.googleapis.com/v0/b/test-bucket.appspot.com/o/flamelink%2Fmedia%2Fsomething'
        );
      });
    });

    describe('"getFolders" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.getFolders).toEqual(expect.any(Function));
      });

      test('should return all folders as a plain list if no arguments are given', () =>
        expect(flamelink(basicConfig).storage.getFolders()).resolves.toEqual(
          expect.arrayContaining([
            {
              id: expect.any(Number),
              name: expect.any(String),
              order: expect.any(Number),
              parentId: expect.any(Number)
            }
          ])
        ));
    });

    describe('"upload" method', () => {
      test('should be exposed on the "storage" public object', () => {
        expect(flamelink(basicConfig).storage.upload).toEqual(expect.any(Function));
      });

      test('should call the Firebase `putString` method if the file data is a raw string', () => {
        const string = 'This is a test string';
        return expect(flamelink(basicConfig).storage.upload(string)).resolves.toEqual(
          expect.objectContaining({
            TESTING: expect.objectContaining({
              string,
              stringEncoding: {
                customMetadata: {
                  flamelinkFileId: expect.any(String),
                  flamelinkFolderId: expect.any(String)
                }
              },
              method: 'putString'
            }),
            metadata: expect.any(Object)
          })
        );
      });

      test('should call the Firebase `putString` method if the file data is a base64 encoded string', () => {
        const string = '5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB';
        const options = {
          stringEncoding: 'base64'
        };
        return expect(flamelink(basicConfig).storage.upload(string, options)).resolves.toEqual(
          expect.objectContaining({
            TESTING: expect.objectContaining({
              string,
              stringEncoding: options.stringEncoding,
              method: 'putString'
            }),
            metadata: expect.any(Object)
          })
        );
      });

      test('should call the Firebase `put` method if the file data is not a string', () => {
        const bytes = new Uint8Array([
          0x48,
          0x65,
          0x6c,
          0x6c,
          0x6f,
          0x2c,
          0x20,
          0x77,
          0x6f,
          0x72,
          0x6c,
          0x64,
          0x21
        ]);
        const metadata = { name: 'file-name.jpg' };

        return expect(flamelink(basicConfig).storage.upload(bytes, { metadata })).resolves.toEqual(
          expect.objectContaining({
            TESTING: expect.objectContaining({
              file: bytes,
              options: metadata,
              method: 'put'
            }),
            metadata: expect.any(Object)
          })
        );
      });

      test('should always set `sizes` property to array with a default required value if no sizes are defined', () => {
        const app = flamelink(basicConfig);
        const spy = jest.spyOn(app.storage, '_createSizedImage');
        const file = mockFile();
        return app.storage.upload(file).then(file => {
          expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(String), { width: 240 });
        });
      });

      test('should always set `sizes` property to array with a default required value along with user specified values', () => {
        const app = flamelink(basicConfig);
        const spy = jest.spyOn(app.storage, '_createSizedImage');
        const file = mockFile();
        return app.storage
          .upload(file, { sizes: [{ width: 560, height: 9999, quality: 1 }], overwriteSizes: true })
          .then(file => {
            expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
              width: 240
            });
            expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(String), {
              width: 560,
              height: 9999,
              quality: 1,
              path: '560_9999_100'
            });
          });
      });

      test('should not try to create a resized image when invalid size is specified along with overwriteSizes as `true`', () => {
        const app = flamelink(basicConfig);
        const spy = jest.spyOn(app.storage, '_createSizedImage');
        const file = mockFile();
        return app.storage.upload(file, { sizes: 'wrong', overwriteSizes: true }).then(file => {
          expect(spy).not.toHaveBeenCalled();
        });
      });

      test('should throw an error if invalid size object is specified within the sizes array', async () => {
        const app = flamelink(basicConfig);
        const spy = jest.spyOn(window.console, 'warn');
        const file = mockFile();
        let message;

        try {
          await app.storage.upload(file, { sizes: [{ wrong: 'wrong' }] });
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] Invalid size object supplied - please refer to https://flamelink.github.io/flamelink/#/storage?id=upload for more details on upload options`
        );
      });
    });

    describe('"deleteFile" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.deleteFile).toEqual(expect.any(Function));
      });

      test('should throw an error if no arguments are given', async () => {
        const app = flamelink(basicConfig);
        let message;

        try {
          await app.storage.deleteFile();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "storage.deleteFile()" should be called with at least the file ID`
        );
      });

      test('should call the Firebase "delete" method', () => {
        const fileId = 123456789;
        return expect(flamelink(basicConfig).storage.deleteFile(fileId)).resolves.toEqual(
          `"remove" called for "/flamelink/media/files/${fileId}"`
        );
      });
    });

    describe('"getMetadata" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.getMetadata).toEqual(expect.any(Function));
      });

      test('should throw an error if no arguments are given', async () => {
        const app = flamelink(basicConfig);
        let message;

        try {
          await app.storage.getMetadata();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "storage.getMetadata()" should be called with at least the file ID`
        );
      });

      test('should call the Firebase "getMetadata" method', () => {
        const fileId = 123456789;
        return expect(flamelink(basicConfig).storage.getMetadata(fileId)).resolves.toEqual(
          expect.any(Object)
        );
      });
    });

    describe('"updateMetadata" method', () => {
      test('should be exposed on the `storage` object', () => {
        expect(flamelink(basicConfig).storage.updateMetadata).toEqual(expect.any(Function));
      });

      test('should throw an error if no arguments are given', async () => {
        const app = flamelink(basicConfig);
        let message;

        try {
          await app.storage.updateMetadata();
        } catch (error) {
          message = error.message;
        }

        expect(message).toMatch(
          `[FLAMELINK] "storage.updateMetadata()" should be called with at least the file ID`
        );
      });

      test('should call the Firebase "updateMetadata" method', () => {
        const fileId = 123456789;
        return expect(flamelink(basicConfig).storage.updateMetadata(fileId)).resolves.toEqual(
          expect.any(Object)
        );
      });
    });
  });
});
