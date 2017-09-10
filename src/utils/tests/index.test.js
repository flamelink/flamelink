import * as utils from '../';

describe('Flamelink SDK > Utils', () => {
  describe('Reference methods', () => {
    let missingRefError = null;

    beforeAll(() => {
      missingRefError = '[FLAMELINK] The reference, environment and locale arguments are all required';
    });

    afterAll(() => {
      missingRefError = null;
    });

    describe('"getContentRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const ref = 'my-reference';
        const env = 'my-environment';
        const locale = 'my-locale';
        expect(utils.getContentRefPath(ref, env, locale)).toBe(`/environments/${env}/content/${ref}/${locale}`);

        try {
          utils.getContentRefPath(ref, env);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }

        try {
          utils.getContentRefPath(ref, undefined, locale);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }

        try {
          utils.getContentRefPath(undefined, env, locale);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }
      });
    });

    describe('"getNavigationRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const ref = 'my-reference';
        const env = 'my-environment';
        const locale = 'my-locale';
        expect(utils.getNavigationRefPath(ref, env, locale)).toBe(`/environments/${env}/navigation/${ref}/${locale}`);

        try {
          utils.getNavigationRefPath(ref, env);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }

        try {
          utils.getNavigationRefPath(ref, undefined, locale);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }

        try {
          utils.getNavigationRefPath(undefined, env, locale);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }
      });
    });

    describe('"getSchemasRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const ref = 'my-reference';
        const env = 'my-environment';
        const locale = 'my-locale';
        expect(utils.getSchemasRefPath(ref, env, locale)).toBe(`/schemas/${ref}`);

        try {
          utils.getSchemasRefPath(ref, env);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }

        try {
          utils.getSchemasRefPath(ref, undefined, locale);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }

        try {
          utils.getSchemasRefPath(undefined, env, locale);
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }
      });
    });
  });

  describe('"AVAILABLE_FILTER_OPTIONS"', () => {
    test('should return all the possible firebase filter options', () => {
      expect(utils.AVAILABLE_FILTER_OPTIONS).toEqual(['limitToFirst', 'limitToLast', 'startAt', 'endAt', 'equalTo']);
    });
  });

  describe('"applyFilters"', () => {
    let ref;

    beforeEach(() => {
      ref = {
        limitToFirst: jest.fn(() => ref),
        limitToLast: jest.fn(() => ref),
        startAt: jest.fn(() => ref),
        endAt: jest.fn(() => ref),
        equalTo: jest.fn(() => ref),
        randomFunctionName: jest.fn(() => ref)
      };
    });

    afterEach(() => {
      ref = null;
    });

    test('should return the reference as-is if no options are passed in', () => {
      expect(utils.applyFilters(ref)).toBe(ref);
    });

    test('should call the `limitToFirst` method if that option is passed in', () => {
      utils.applyFilters(ref, { limitToFirst: 10 });
      expect(ref.limitToFirst.mock.calls.length).toBe(1);
      expect(ref.limitToLast.mock.calls.length).toBe(0);
      expect(ref.startAt.mock.calls.length).toBe(0);
      expect(ref.endAt.mock.calls.length).toBe(0);
      expect(ref.equalTo.mock.calls.length).toBe(0);
      expect(ref.randomFunctionName.mock.calls.length).toBe(0);
    });

    test('should call the `limitToLast` method if that option is passed in', () => {
      utils.applyFilters(ref, { limitToLast: 10 });
      expect(ref.limitToFirst.mock.calls.length).toBe(0);
      expect(ref.limitToLast.mock.calls.length).toBe(1);
      expect(ref.startAt.mock.calls.length).toBe(0);
      expect(ref.endAt.mock.calls.length).toBe(0);
      expect(ref.equalTo.mock.calls.length).toBe(0);
      expect(ref.randomFunctionName.mock.calls.length).toBe(0);
    });

    test('should call the `startAt` method if that option is passed in', () => {
      utils.applyFilters(ref, { startAt: 10 });
      expect(ref.limitToFirst.mock.calls.length).toBe(0);
      expect(ref.limitToLast.mock.calls.length).toBe(0);
      expect(ref.startAt.mock.calls.length).toBe(1);
      expect(ref.endAt.mock.calls.length).toBe(0);
      expect(ref.equalTo.mock.calls.length).toBe(0);
      expect(ref.randomFunctionName.mock.calls.length).toBe(0);
    });

    test('should call the `endAt` method if that option is passed in', () => {
      utils.applyFilters(ref, { endAt: 10 });
      expect(ref.limitToFirst.mock.calls.length).toBe(0);
      expect(ref.limitToLast.mock.calls.length).toBe(0);
      expect(ref.startAt.mock.calls.length).toBe(0);
      expect(ref.endAt.mock.calls.length).toBe(1);
      expect(ref.equalTo.mock.calls.length).toBe(0);
      expect(ref.randomFunctionName.mock.calls.length).toBe(0);
    });

    test('should call the `equalTo` method if that option is passed in', () => {
      utils.applyFilters(ref, { equalTo: 10 });
      expect(ref.limitToFirst.mock.calls.length).toBe(0);
      expect(ref.limitToLast.mock.calls.length).toBe(0);
      expect(ref.startAt.mock.calls.length).toBe(0);
      expect(ref.endAt.mock.calls.length).toBe(0);
      expect(ref.equalTo.mock.calls.length).toBe(1);
      expect(ref.randomFunctionName.mock.calls.length).toBe(0);
    });

    test('should apply all valid filters passed in', () => {
      utils.applyFilters(ref, {
        limitToFirst: 10,
        limitToLast: 10,
        startAt: 10,
        endAt: 10,
        equalTo: 10,
        randomFunctionName: 10
      });
      expect(ref.limitToFirst.mock.calls.length).toBe(1);
      expect(ref.limitToLast.mock.calls.length).toBe(1);
      expect(ref.startAt.mock.calls.length).toBe(1);
      expect(ref.endAt.mock.calls.length).toBe(1);
      expect(ref.equalTo.mock.calls.length).toBe(1);
      expect(ref.randomFunctionName.mock.calls.length).toBe(0);
    });
  });

  describe('"applyOrderBy"', () => {
    test('should return the reference as-is if no options are passed in', () => {
      const ref = {
        hello: 'there'
      };
      expect(utils.applyOrderBy(ref)).toBe(ref);
    });

    test('should call the `orderByKey` method if that option is passed in', () => {
      const ref = {
        orderByKey: jest.fn()
      };
      utils.applyOrderBy(ref, { orderByKey: true });
      expect(ref.orderByKey.mock.calls.length).toBe(1);
    });

    test('should call the `orderByValue` method if that option is passed in', () => {
      const ref = {
        orderByValue: jest.fn()
      };
      utils.applyOrderBy(ref, { orderByValue: true });
      expect(ref.orderByValue.mock.calls.length).toBe(1);
    });

    test('should call the `orderByChild` method if that option is passed in', () => {
      const ref = {
        orderByChild: jest.fn()
      };
      utils.applyOrderBy(ref, { orderByChild: 'child' });
      expect(ref.orderByChild.mock.calls.length).toBe(1);
    });

    test('should throw an error if the `orderByChild` option is passed in but not a string', async () => {
      expect.assertions(1);
      const ref = {
        orderByChild: jest.fn()
      };
      let message;

      try {
        await utils.applyOrderBy(ref, { orderByChild: true });
      } catch (error) {
        message = error.message;
      }

      expect(message).toMatch('[FLAMELINK] "orderByChild" should specify the child key to order by');
    });
  });
});
