import reduce from 'lodash/reduce';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import reduceRight from 'lodash/reduceRight';
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

export const AVAILABLE_FILTER_OPTIONS = ['limitToFirst', 'limitToLast', 'startAt', 'endAt', 'equalTo'];

export const applyFilters = (ref, opt = {}) => {
  if (!Object.keys(opt).length) {
    return ref;
  }

  return [...AVAILABLE_FILTER_OPTIONS].reduce((newRef, filter) => {
    if (!opt[filter]) {
      return newRef;
    }
    newRef = newRef[filter](opt[filter]);
    return newRef;
  }, ref);
};

const missingRefParam = () => {
  throw error('The reference, environment and locale arguments are all required');
};

export const getContentRefPath = (ref = missingRefParam(), env = missingRefParam(), locale = missingRefParam()) =>
  `/environments/${env}/content/${ref}/${locale}`;

export const getNavigationRefPath = (ref = missingRefParam(), env = missingRefParam(), locale = missingRefParam()) =>
  `/environments/${env}/navigation/${ref}/${locale}`;

export const getSchemasRefPath = (ref = missingRefParam(), env = missingRefParam(), locale = missingRefParam()) => `/schemas/${ref}`;

export const pluckResultFields = (resultSet, fields) => {
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
};

/**
 * Our own `compose` function that works on both synchronous and asynchronous functions combined.
 *
 * @param {*} functions Array of functions to compose
 * @returns {Function} Returns a function that takes a single argument for the input data that will be
 * passed through the composed functions and then returns a promise that will resolve to the result of
 * the input being applied to all the methods in sequence.
 */
export const compose = (...functions) => data => reduceRight(functions, (value, func) => value.then(func), Promise.resolve(data));
