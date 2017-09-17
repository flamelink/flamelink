import reduce from 'lodash/reduce';
import curry from 'lodash/curry';
import cloneDeep from 'lodash/cloneDeep';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import pick from 'lodash/fp/pick';
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
) => `/environments/${env}/navigation/${ref}/${locale}`;

export const getSchemasRefPath = (
  ref = missingRefParam(),
  env = missingRefParam(),
  locale = missingRefParam()
) => `/schemas/${ref}`;

export const pluckResultFields = curry((fields, resultSet) => {
  if (!resultSet || !isArray(fields)) {
    return resultSet;
  }

  const pickFields = pick(fields);

  // If resultSet is an array of objects, we just pluck the given fields from each object
  if (isArray(resultSet)) {
    return reduce(resultSet, (result, val) => result.concat(pickFields(val)), []);
  }

  // If resultSet is a POJO, we assume each first-level property is the child from which fields need to be plucked
  if (isPlainObject(resultSet)) {
    return reduce(
      resultSet,
      (result, val, key) => {
        result[key] = pickFields(val);
        return result;
      },
      {}
    );
  }

  return resultSet;
});

/**
 * Our own `compose` function that works on both synchronous and asynchronous functions combined.
 *
 * @param {*} functions Array of functions to compose
 * @returns {Function} Returns a function that takes a single argument for the input data that will be
 * passed through the composed functions and then returns a promise that will resolve to the result of
 * the input being applied to all the methods in sequence.
 */
export const compose = (...functions) => input =>
  functions.reduceRight((chain, func) => chain.then(func), Promise.resolve(input));

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
export const populateEntry = curry(
  async (schemasAPI, contentAPI, contentType, entryKey, populate, entry) => {
    const preppedPopulateFields = prepPopulateFields(populate);

    if (!preppedPopulateFields[0]) {
      return entry;
    }

    const schemaFields = await schemasAPI.getFields(contentType);
    // TODO: Update logic here to handle `image` types as well
    const fieldsToPopulate = preppedPopulateFields.reduce((fields, preppedField) => {
      const schemaField = schemaFields.find(field => field.key === preppedField.field);
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

              const snapshot = await contentAPI.getEntryRaw(
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
  }
);
