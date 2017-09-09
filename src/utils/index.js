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

export const applyFilters = (ref, opt) => {
  if (!opt.filters) {
    return ref;
  }

  return Object.keys(opt.filters).reduce((newRef, filter) => {
    newRef = newRef[filter](opt.filters[filter]);
    return newRef;
  }, ref);
};

export const getContentRefPath = (ref, env, locale) => `${env ? `/environments/${env}/` : ''}content${ref ? `/${ref}` : ''}${locale ? `/${locale}` : ''}`;

export const getNavigationRefPath = (ref, env, locale) => `${env ? `/environments/${env}/` : ''}navigation${ref ? `/${ref}` : ''}${locale ? `/${locale}` : ''}`;
