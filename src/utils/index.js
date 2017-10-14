import reduce from 'lodash/reduce';
import curry from 'lodash/curry';
import cloneDeep from 'lodash/cloneDeep';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import pick from 'lodash/fp/pick';
import compose from 'compose-then';
import error from './error';

export const applyOrderBy = (ref, opt = {}) => {
  if (opt.orderByChild) {
    if (typeof opt.orderByChild !== 'string' || opt.orderByChild === '') {
      throw error('"orderByChild" should specify the child key to order by');
    }
    return ref.orderByChild(opt.orderByChild);
  }

  if (opt.orderByValue) {
    return ref.orderByValue();
  }

  if (opt.orderByKey) {
    return ref.orderByKey();
  }

  return ref;
};

export const AVAILABLE_FILTER_OPTIONS = [
  'limitToFirst',
  'limitToLast',
  'startAt',
  'endAt',
  'equalTo'
];

export const applyFilters = (ref, opt = {}) => {
  if (!Object.keys(opt).length) {
    return ref;
  }

  return [...AVAILABLE_FILTER_OPTIONS].reduce((newRef, filter) => {
    if (!opt[filter]) {
      return newRef;
    }
    return newRef[filter](opt[filter]);
  }, ref);
};

const missingRefParam = () => {
  throw error('The reference, environment and locale arguments are all required');
};

export const getContentRefPath = (
  ref = missingRefParam(),
  env = missingRefParam(),
  locale = missingRefParam()
) => `/environments/${env}/content/${ref}/${locale}`;

export const getNavigationRefPath = (
  ref = missingRefParam(),
  env = missingRefParam(),
  locale = missingRefParam()
) => `/environments/${env}/navigation/${ref ? `${ref}/${locale}` : ''}`;

export const getSchemasRefPath = (ref = missingRefParam(), env = missingRefParam()) =>
  `/environments/${env}/schemas/${ref || ''}`;

/**
 * @description Return the reference path for the given file in the Cloud Storage Bucket
 * @param {String} filename
 * @param {Object} options
 */
export const getStorageRefPath = (filename = missingRefParam(), { width } = {}) =>
  `/flamelink/media/${width ? `sized/${width}/` : ''}${filename}`;

/**
 * @description Return the reference path for the given file in the realtime db
 * @param {String} fileID
 */
export const getFileRefPath = fileID => `/media/files/${fileID || ''}`;

/**
 * @description Return the reference path for the given folder in the realtime db
 * @param {String} folderID
 */
export const getFolderRefPath = folderID => `/media/folders/${folderID || ''}`;

export const filterByFolderId = curry((folderId, files) => {
  if (!folderId) {
    return files;
  }

  return reduce(
    files,
    (result, val, key) => {
      if (val.folderId === folderId) {
        return Object.assign({}, result, { [key]: val });
      }
      return result;
    },
    {}
  );
});

export const pluckResultFields = curry((fields, resultSet) => {
  if (!resultSet || !isArray(fields)) {
    return resultSet;
  }

  // TODO: Write our own "pick" that can work with an array of strings or an array of objects for nested objects
  const pickFields = pick(fields);

  // If resultSet is an array of objects, we just pluck the given fields from each object
  if (isArray(resultSet)) {
    return reduce(resultSet, (result, val) => result.concat(pickFields(val)), []);
  }

  // If resultSet is a POJO, we assume each first-level property is the child from which fields need to be plucked
  if (isPlainObject(resultSet)) {
    return reduce(
      resultSet,
      (result, val, key) => Object.assign({}, result, { [key]: pickFields(val) }),
      {}
    );
  }

  return resultSet;
});

/**
 * Ensure that the passed in `populate` property is returning an array of objects
 * required by other populate functions.
 * @param {Array} populate
 * @returns {Array}
 */
export const prepPopulateFields = populate => {
  if (!populate || !isArray(populate)) {
    return [];
  }

  return populate.map(option => {
    if (typeof option === 'string') {
      return {
        field: option
      };
    }

    return option;
  });
};

/**
 * Curried helper function that takes in an entry's object and then populates the given
 * properties recursively.
 */
export const populateEntry = curry(async (schemasAPI, contentAPI, contentType, populate, entry) => {
  if (!entry) {
    return entry;
  }

  const entryKeys = Object.keys(entry);

  if (entryKeys.length === 0) {
    throw error('"populateEntry" should be called with an object of objects');
  }

  const entries = await Promise.all(
    entryKeys.map(async entryKey => {
      const preppedPopulateFields = prepPopulateFields(populate);

      if (!preppedPopulateFields[0]) {
        return entry;
      }

      const schemaFields = await schemasAPI.getFields(contentType);
      // TODO: Update logic here to handle `image` types as well
      const fieldsToPopulate = preppedPopulateFields.reduce((fields, preppedField) => {
        const schemaField =
          schemaFields && schemaFields.find(field => field.key === preppedField.field);
        if (schemaField && schemaField.relation) {
          return fields.concat([
            Object.assign({}, preppedField, { contentType: schemaField.relation })
          ]);
        }
        return fields;
      }, []);

      if (!fieldsToPopulate[0]) {
        return entry;
      }

      const populatedFields = await Promise.all(
        fieldsToPopulate.map(async populateField => {
          const { field, contentType: innerContentType } = populateField;

          // if it exists, the entry value for this field should be an array
          if (entry[entryKey].hasOwnProperty(field)) {
            const relationalEntries = entry[entryKey][field];

            if (!isArray(relationalEntries)) {
              throw error(
                `The "${field}" field does not seem to be a relational property for the "${contentType}" content type.`
              );
            }

            const populatedRelationsEntries = await Promise.all(
              relationalEntries.map(async innerEntryKey => {
                const pluckFields = pluckResultFields(populateField.fields);
                const populateFields = populateEntry(
                  schemasAPI,
                  contentAPI,
                  innerContentType,
                  innerEntryKey,
                  populateField.populate
                );

                const snapshot = await contentAPI.getRaw(
                  innerContentType,
                  innerEntryKey,
                  populateField
                );
                const wrapValue = { [innerEntryKey]: snapshot.val() };
                const result = await compose(populateFields, pluckFields)(wrapValue);
                return result[innerEntryKey];
              })
            );

            return populatedRelationsEntries;
          }

          return null;
        })
      );

      return fieldsToPopulate.reduce((populatedEntry, populateField, index) => {
        const { field } = populateField;
        if (populatedEntry[entryKey].hasOwnProperty(field)) {
          populatedEntry[entryKey][field] = populatedFields[index]; // eslint-disable-line no-param-reassign
        }
        return populatedEntry;
      }, cloneDeep(entry));
    })
  );

  return entryKeys.reduce(
    (populatedEntries, entryKey, index) =>
      Object.assign({}, populatedEntries, { [entryKey]: entries[index][entryKey] }),
    {}
  );
});

export const formatStructure = curry((structure, options, items) => {
  const { idProperty = 'id', parentProperty = 'parentId' } = options || {};

  if (!isArray(items)) {
    throw error('"formatStructure" should be called with an array of items');
  }

  if (structure === 'nested' || structure === 'tree') {
    const mapChildren = (levelItems, previousId = 0) =>
      levelItems
        .map(item =>
          Object.assign({}, item, {
            children: items.filter(innerItem => innerItem[parentProperty] === item[idProperty])
          })
        )
        .filter(item => item[parentProperty] === previousId)
        .map(item => {
          if (item.children.length === 0) {
            return item;
          }
          return Object.assign({}, item, {
            children: mapChildren(item.children, item[idProperty])
          });
        });

    return mapChildren(items, 0);
  }

  return items;
});

/**
 * @description Find the current device's screen resolution
 */
export const getScreenResolution = () => {
  const pixelRatio = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;
  return Math.max(window.screen.width, window.screen.height) * pixelRatio;
};
