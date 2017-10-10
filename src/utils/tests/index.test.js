import * as utils from '../';

describe('Flamelink SDK > Utils', () => {
  describe('Reference methods', () => {
    let missingRefError = null;

    beforeAll(() => {
      missingRefError =
        '[FLAMELINK] The reference, environment and locale arguments are all required';
    });

    afterAll(() => {
      missingRefError = null;
    });

    describe('"getContentRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const ref = 'my-reference';
        const env = 'my-environment';
        const locale = 'my-locale';
        expect(utils.getContentRefPath(ref, env, locale)).toBe(
          `/environments/${env}/content/${ref}/${locale}`
        );

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
        expect(utils.getNavigationRefPath(ref, env, locale)).toBe(
          `/environments/${env}/navigation/${ref}/${locale}`
        );

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
        expect(utils.getSchemasRefPath(ref, env, locale)).toBe(
          `/environment/${env}/schemas/${ref}`
        );

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

    describe('"getStorageRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const filename = 'image.jpg';
        const width = '1024';

        expect(utils.getStorageRefPath(filename)).toBe(`/flamelink/media/${filename}`);

        expect(utils.getStorageRefPath(filename, { width })).toBe(
          `/flamelink/media/sized/${width}/${filename}`
        );

        try {
          utils.getStorageRefPath();
        } catch (error) {
          expect(error.message).toBe(missingRefError);
        }
      });
    });

    describe('"getFileRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const fileID = '1506860602196';

        expect(utils.getFileRefPath(fileID)).toBe(`/media/files/${fileID}`);

        expect(utils.getFileRefPath()).toBe(`/media/files/`);
      });
    });

    describe('"getFolderRefPath"', () => {
      test('should return the correct reference string for the given properties', () => {
        const folderID = '1505670341980';

        expect(utils.getFolderRefPath(folderID)).toBe(`/media/folders/${folderID}`);

        expect(utils.getFolderRefPath()).toBe(`/media/folders/`);
      });
    });
  });

  describe('"AVAILABLE_FILTER_OPTIONS"', () => {
    test('should return all the possible firebase filter options', () => {
      expect(utils.AVAILABLE_FILTER_OPTIONS).toEqual([
        'limitToFirst',
        'limitToLast',
        'startAt',
        'endAt',
        'equalTo'
      ]);
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
        await utils.applyOrderBy(ref, {
          orderByChild: true
        });
      } catch (error) {
        message = error.message;
      }

      expect(message).toMatch(
        '[FLAMELINK] "orderByChild" should specify the child key to order by'
      );
    });
  });

  describe('"pluckResultFields"', () => {
    test('should return the given results as-is if no fields are passed in', () => {
      const testArray = [
        {
          a: 1,
          b: 1
        },
        {
          a: 2,
          b: 2
        },
        {
          a: 3,
          b: 3
        }
      ];
      expect(utils.pluckResultFields(undefined, testArray)).toEqual(testArray);
      const testObject = {
        a: {
          a: 1,
          b: 1
        },
        b: {
          a: 2,
          b: 2
        },
        c: {
          a: 3,
          b: 3
        }
      };
      expect(utils.pluckResultFields(undefined, testObject)).toEqual(testObject);
    });

    test('should filter an array of objects based on passed in fields', () => {
      const testArray = [
        {
          a: 1,
          b: 1
        },
        {
          a: 2,
          b: 2
        },
        {
          a: 3,
          b: 3
        }
      ];
      const testFields = ['a', 'c'];
      const expectedResults = [
        {
          a: 1
        },
        {
          a: 2
        },
        {
          a: 3
        }
      ];
      expect(utils.pluckResultFields(testFields, testArray)).toEqual(expectedResults);
    });

    test('should filter an objects based on passed in fields', () => {
      const testObject = {
        a: {
          a: 1,
          b: 1
        },
        b: {
          a: 2,
          b: 2
        },
        c: {
          a: 3,
          b: 3
        }
      };
      const testFields = ['a', 'c'];
      const expectedResults = {
        a: {
          a: 1
        },
        b: {
          a: 2
        },
        c: {
          a: 3
        }
      };
      expect(utils.pluckResultFields(testFields, testObject)).toEqual(expectedResults);
    });

    test('should return the result set as-is if it is not an array or object', () => {
      const testString = 'flamelink';
      const testFields = ['a', 'c'];
      expect(utils.pluckResultFields(testFields, testString)).toEqual(testString);
    });
  });

  describe('"prepPopulateFields"', () => {
    test('should return an empty array if called with no arguments', () => {
      expect(utils.prepPopulateFields()).toEqual([]);
    });

    test('should return an empty array if called with something other than an array', () => {
      expect(utils.prepPopulateFields('a')).toEqual([]);
      expect(utils.prepPopulateFields({ key: 'value' })).toEqual([]);
      expect(utils.prepPopulateFields(123)).toEqual([]);
    });

    test('should convert an array of strings into an array of objects', () => {
      expect(utils.prepPopulateFields(['a', 'b', 'c'])).toEqual([
        { field: 'a' },
        { field: 'b' },
        { field: 'c' }
      ]);
    });

    test('should keep all additional properties passed as options', () => {
      expect(
        utils.prepPopulateFields([
          { field: 'a' },
          { field: 'b', fields: ['id', 'title', 'description'], someOtherKey: 123456 },
          'c'
        ])
      ).toEqual([
        { field: 'a' },
        { field: 'b', fields: ['id', 'title', 'description'], someOtherKey: 123456 },
        { field: 'c' }
      ]);
    });
  });

  describe('"populateEntry"', () => {
    test('should return the entry if no "populate" attributes are passed in', () => {
      const schemasAPI = {};
      const contentAPI = {};
      const contentType = {};
      const populate = {};
      const entry = { key: 'value' };
      return expect(
        utils.populateEntry(schemasAPI, contentAPI, contentType, populate, entry)
      ).resolves.toEqual(entry);
    });
  });

  describe('"formatNavigationStructure"', () => {
    test('should return the given items as-is if structure is "flat"', () => {
      const structure = 'flat';
      const items = [{ a: 1, b: 2 }];
      expect(utils.formatNavigationStructure(structure, items)).toEqual(items);
    });

    test('should return the given items in a nested structure if structure is "nested"', () => {
      const structure = 'nested';
      const items = [
        {
          id: 1505670612291,
          order: 0,
          parentIndex: 0,
          title: 'Home',
          url: '/',
          uuid: 1505670612291
        },
        {
          id: 1505670636997,
          order: 1,
          parentIndex: 0,
          title: 'About',
          url: '/about',
          uuid: 1505670636997
        },
        {
          id: 1505670681965,
          order: 2,
          parentIndex: 1505670636997,
          title: 'Our Mission',
          url: '/our-mission',
          uuid: 1505670681965
        },
        {
          id: 1505670681966,
          order: 2,
          parentIndex: 1505670681965,
          title: 'Our Values',
          url: '/our-values',
          uuid: 1505670681966
        },
        {
          id: 1505670798697,
          order: 3,
          parentIndex: 0,
          title: 'Contact Us',
          url: '/contact',
          uuid: 1505670798697
        }
      ];
      const expectedOutput = [
        {
          id: 1505670612291,
          order: 0,
          parentIndex: 0,
          title: 'Home',
          url: '/',
          uuid: 1505670612291,
          children: []
        },
        {
          id: 1505670636997,
          order: 1,
          parentIndex: 0,
          title: 'About',
          url: '/about',
          uuid: 1505670636997,
          children: [
            {
              id: 1505670681965,
              order: 2,
              parentIndex: 1505670636997,
              title: 'Our Mission',
              url: '/our-mission',
              uuid: 1505670681965,
              children: [
                {
                  id: 1505670681966,
                  order: 2,
                  parentIndex: 1505670681965,
                  title: 'Our Values',
                  url: '/our-values',
                  uuid: 1505670681966,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 1505670798697,
          order: 3,
          parentIndex: 0,
          title: 'Contact Us',
          url: '/contact',
          uuid: 1505670798697,
          children: []
        }
      ];
      expect(utils.formatNavigationStructure(structure, items)).toEqual(expectedOutput);
    });
  });
});
