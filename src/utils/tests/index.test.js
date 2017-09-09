import * as utils from '../';

describe('Flamelink SDK > Utils', () => {
  describe('"getContentRefPath"', () => {
    test('should return the correct reference string for the given properties', () => {
      const ref = 'my-reference';
      const env = 'my-environment';
      const locale = 'my-locale';
      expect(utils.getContentRefPath(ref, env, locale)).toBe(`/environments/${env}/content/${ref}/${locale}`);
    });
  });

  describe('"getNavigationRefPath"', () => {
    test('should return the correct reference string for the given properties', () => {
      const ref = 'my-reference';
      const env = 'my-environment';
      const locale = 'my-locale';
      expect(utils.getNavigationRefPath(ref, env, locale)).toBe(`/environments/${env}/navigation/${ref}/${locale}`);
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
