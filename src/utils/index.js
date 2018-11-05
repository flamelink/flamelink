import reduce from 'lodash/reduce';
import curry from 'lodash/curry';
import cloneDeep from 'lodash/cloneDeep';
import isArray from 'lodash/isArray';
import memoize from 'lodash/memoize';
import isPlainObject from 'lodash/isPlainObject';
import pick from 'lodash/fp/pick';
import compose from 'compose-then';
import error from './error';

// Create empty memo object to which we can write for memoization
const memo = {};

export const AVAILABLE_FILTER_OPTIONS = [
  'limitToFirst',
  'limitToLast',
  'startAt',
  'endAt',
  'equalTo'
];

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

export const applyFilters = (ref, opt = {}) => {
  if (!Object.keys(opt).length) {
    return ref;
  }

  return [...AVAILABLE_FILTER_OPTIONS].reduce((newRef, filter) => {
    if (typeof opt[filter] === 'undefined') {
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
) => `/flamelink/environments/${env}/content/${ref ? `${ref}/${locale}` : ''}`;

export const getNavigationRefPath = (
  ref = missingRefParam(),
  env = missingRefParam(),
  locale = missingRefParam()
) => `/flamelink/environments/${env}/navigation/${ref ? `${ref}/${locale}` : ''}`;

export const getSchemasRefPath = (ref = missingRefParam(), env = missingRefParam()) =>
  `/flamelink/environments/${env}/schemas/${ref || ''}`;

export const getSettingsRefPath = ref => `/flamelink/settings/${ref || ''}`;

/**
 * @description Return the reference path for the given file in the Cloud Storage Bucket
 * @param {String} filename
 * @param {Object} options
 */
export const getStorageRefPath = (filename = missingRefParam(), { width, path } = {}) => {
  if (path) {
    return `/flamelink/media/sized/${path}/${filename}`;
  }
  return `/flamelink/media/${width ? `sized/${width}/` : ''}${filename}`;
};

/**
 * @description Return the reference path for the given file in the realtime db
 * @param {String} fileID
 */
export const getFileRefPath = fileID => `/flamelink/media/files/${fileID || ''}`;

/**
 * @description Return the reference path for the given folder in the realtime db
 * @param {String} folderID
 */
export const getFolderRefPath = folderID => `/flamelink/media/folders/${folderID || ''}`;

/**
 * @description Return the reference path for the media directory in the realtime db
 * @param {String} [mediaRef]
 */
export const getMediaRefPath = mediaRef => `/flamelink/media/${mediaRef || ''}`;

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
 * @param {Array} `populate` Can be an array of strings, objects or a mix
 * @returns {Array} Always an array of objects in the format `{ field: nameOfFieldToPopulate, ...otherOptions }`
 */
export const prepPopulateFields = populate => {
  if (typeof memo.prepPopulateFields === 'undefined') {
    memo.prepPopulateFields = memoize(
      fields => {
        if (!fields || !isArray(fields)) {
          return [];
        }

        return fields.map(option => {
          if (typeof option === 'string') {
            return {
              field: option
            };
          }

          return option;
        });
      },
      fields => JSON.stringify(fields)
    );
  }

  return memo.prepPopulateFields(populate);
};

const getPopulateFieldsForSchema = async (schemasAPI, schemaFields) =>
  schemaFields.reduce(async (chain, field) => {
    switch (field.type) {
      case 'media':
        return chain.then(result => result.concat({ field: field.key }));

      case 'select-relational':
      case 'tree-relational':
        return chain.then(async result =>
          result.concat({
            field: field.key,
            populate: await getPopulateFieldsForSchema(
              schemasAPI,
              await schemasAPI.getFields(field.relation)
            )
          })
        );

      case 'fieldset':
      case 'repeater':
        return chain.then(async result =>
          result.concat({
            field: field.key,
            subFields: await getPopulateFieldsForSchema(schemasAPI, field.options)
          })
        );

      default:
        return chain;
    }
  }, Promise.resolve([]));

/**
 * Curried helper function that takes in an entry's object and then populates the given
 * properties recursively.
 * @param {Object} `schemasAPI` The schemas API hash with all API methods
 * @param {Object} `contentAPI` The content API hash with all API methods
 * @param {Object} `storageAPI` The storage API hash with all API methods
 * @param {String} `contentType` The name of the schema/content type as set up in CMS
 * @param {Array} `populate` The array of fields to try and populate for the given entry
 * @param {Object|Null} `originalEntry` The actual content entry on which the populate functionality should be run
 *                                      Can be `null` when run recursively.
 */
export const populateEntry = curry(
  async (schemasAPI, contentAPI, storageAPI, contentType, populate, originalEntry) => {
    if (!originalEntry) {
      return originalEntry;
    }

    const entryKeys = Object.keys(originalEntry);

    if (entryKeys.length === 0) {
      throw error('"populateEntry" should be called with an object of objects');
    }

    const processEntry = curry(async (entry, schemaFields, preppedPopulateFields, entryKey) => {
      if (!preppedPopulateFields[0]) {
        return entry;
      }

      const fieldsToPopulate = preppedPopulateFields.reduce((fields, preppedField) => {
        const schemaField =
          schemaFields && schemaFields.find(field => field.key === preppedField.field);

        // Relational Fields
        if (schemaField && schemaField.relation) {
          return fields.concat([
            Object.assign({}, preppedField, {
              contentType: schemaField.relation,
              populateType: 'relational'
            })
          ]);
        }

        // Media Fields
        if (schemaField && schemaField.type === 'media') {
          return fields.concat([Object.assign({}, preppedField, { populateType: 'media' })]);
        }

        // Repeater Fields
        if (schemaField && schemaField.type === 'repeater' && isArray(preppedField.subFields)) {
          return fields.concat([Object.assign({}, preppedField, { populateType: 'repeater' })]);
        }

        // Fieldset Fields
        if (schemaField && schemaField.type === 'fieldset' && isArray(preppedField.subFields)) {
          return fields.concat([Object.assign({}, preppedField, { populateType: 'fieldset' })]);
        }

        return fields;
      }, []);

      if (!fieldsToPopulate[0]) {
        return entry;
      }

      const populatedFields = await Promise.all(
        fieldsToPopulate.map(async populateField => {
          const { field, subFields, contentType: innerContentType, populateType } = populateField;

          switch (populateType) {
            case 'media':
              // if it exists, the entry value for this field should be an array
              if (entry[entryKey] && entry[entryKey].hasOwnProperty(field)) {
                const mediaEntries = entry[entryKey][field] || [];

                if (!isArray(mediaEntries)) {
                  throw error(`The "${field}" field does not seem to be a valid media property.`);
                }

                return Promise.all(
                  mediaEntries.map(async innerEntryKey => {
                    const pluckFields = pluckResultFields(populateField.fields);
                    const populateFields = populateEntry(
                      schemasAPI,
                      contentAPI,
                      storageAPI,
                      innerContentType,
                      populateField.populate
                    );

                    const [fileObject, fileURL] = await Promise.all([
                      storageAPI.getFile(innerEntryKey, populateField),
                      storageAPI.getURL(innerEntryKey, populateField)
                    ]);
                    const wrapValue = {
                      [innerEntryKey]: Object.assign({}, fileObject, { url: fileURL })
                    };

                    const result = await compose(
                      populateFields,
                      pluckFields
                    )(wrapValue);
                    return result[innerEntryKey];
                  })
                );
              }

              return null;

            case 'relational':
              // if it exists, the entry value for this field should be an array
              if (entry[entryKey] && entry[entryKey].hasOwnProperty(field)) {
                let relationalEntries = entry[entryKey][field];

                relationalEntries = isArray(relationalEntries)
                  ? relationalEntries
                  : [relationalEntries];

                return Promise.all(
                  relationalEntries.map(async innerEntryKey => {
                    const pluckFields = pluckResultFields(populateField.fields);
                    const populateFields = populateEntry(
                      schemasAPI,
                      contentAPI,
                      storageAPI,
                      innerContentType,
                      populateField.populate
                    );

                    const snapshot = await contentAPI.getRaw(
                      innerContentType,
                      innerEntryKey,
                      populateField
                    );
                    const wrapValue = { [innerEntryKey]: snapshot.val() };

                    const result = await compose(
                      populateFields,
                      pluckFields
                    )(wrapValue);
                    return result[innerEntryKey];
                  })
                );
              }

              return null;

            case 'repeater':
              // if it exists, the entry value for this field should be an array
              if (entry[entryKey] && entry[entryKey].hasOwnProperty(field)) {
                const repeaterFields = entry[entryKey][field] || [];

                if (!isArray(repeaterFields)) {
                  throw error(`The "${field}" field does not seem to be a valid repeater field.`);
                }

                const schemaField = schemaFields && schemaFields.find(f => f.key === field);

                return Promise.all(
                  repeaterFields.map(async (repeaterField, repeaterIndex) => {
                    const processedRepeaterField = await processEntry(
                      { [repeaterIndex]: repeaterField },
                      schemaField.options || [],
                      prepPopulateFields(subFields),
                      repeaterIndex
                    );

                    return processedRepeaterField[repeaterIndex];
                  })
                );
              }

              return null;

            case 'fieldset':
              // if it exists, the entry value for this field should be an object
              if (entry[entryKey] && entry[entryKey].hasOwnProperty(field)) {
                const fieldsetFields = entry[entryKey][field];

                if (!isPlainObject(fieldsetFields)) {
                  throw error(`The "${field}" field does not seem to be a valid fieldset field.`);
                }

                const schemaField = schemaFields && schemaFields.find(f => f.key === field);

                const processedFieldsetFields = await Promise.all(
                  Object.keys(fieldsetFields).map(async (fieldsetKey, fieldsetIndex) => {
                    const processedFieldsetField = await processEntry(
                      { [fieldsetIndex]: { [fieldsetKey]: fieldsetFields[fieldsetKey] } }, // entry
                      schemaField.options || [], // schemaFields
                      prepPopulateFields(subFields), // populate fields
                      fieldsetIndex // entry key
                    );

                    return processedFieldsetField[fieldsetIndex];
                  })
                );

                return processedFieldsetFields.reduce(
                  (sum, fieldsetField) => Object.assign({}, sum, fieldsetField),
                  {}
                );
              }

              return null;

            default:
              return entry[entryKey][field];
          }
        })
      );

      return fieldsToPopulate.reduce((populatedEntry, populateField, index) => {
        const { field } = populateField;
        if (populatedEntry[entryKey] && populatedEntry[entryKey].hasOwnProperty(field)) {
          populatedEntry[entryKey][field] = populatedFields[index]; // eslint-disable-line no-param-reassign
        }
        return populatedEntry;
      }, cloneDeep(entry));
    });

    const schemaFields = await schemasAPI.getFields(contentType);

    if (populate === true) {
      populate = await getPopulateFieldsForSchema(schemasAPI, schemaFields);
    }

    const preppedPopulateFields = prepPopulateFields(populate);
    const entries = await Promise.all(
      entryKeys.map(processEntry(originalEntry, schemaFields, preppedPopulateFields))
    );

    return entryKeys.reduce(
      (populatedEntries, entryKey, index) =>
        Object.assign({}, populatedEntries, { [entryKey]: entries[index][entryKey] }),
      {}
    );
  }
);

export const formatStructure = curry((structure, options, items) => {
  const { idProperty = 'id', parentProperty = 'parentId' } = options || {};

  const formattedItems = isArray(items) ? items : Object.keys(items).map(key => items[key]);

  if (!isArray(formattedItems)) {
    throw error('"formatStructure" should be called with an array of items');
  }

  if (structure === 'nested' || structure === 'tree') {
    const mapChildren = (levelItems, previousId = 0) =>
      levelItems
        .map(item =>
          Object.assign({}, item, {
            children: formattedItems.filter(
              innerItem => innerItem[parentProperty] === item[idProperty]
            )
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

    return mapChildren(formattedItems, 0);
  }

  return formattedItems;
});

/**
 * @description Find the current device's screen resolution
 */
export const getScreenResolution = () => {
  const pixelRatio = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;
  return Math.max(window.screen.width, window.screen.height) * pixelRatio;
};

export const hasNonCacheableOptions = (options = {}) => {
  const keys = Object.keys(options);
  return keys.some(key =>
    ['noCache', 'event', 'orderByValue', 'orderByChild', ...AVAILABLE_FILTER_OPTIONS].includes(key)
  );
};

export const prepConstraintsForValidate = constraints => {
  if (isArray(constraints)) {
    return constraints.reduce(
      (rules, entry) => Object.assign({}, rules, { [entry.rule]: entry.ruleValue }),
      {}
    );
  }

  if (isPlainObject(constraints)) {
    return constraints;
  }

  return {};
};
