import 'regenerator-runtime/runtime';
import * as firebase from 'firebase';
import './polyfills';
import error from './utils/error';
import {
  applyOrderBy,
  applyFilters,
  getContentRefPath,
  getNavigationRefPath,
  getSchemasRefPath,
  pluckResultFields,
  populateEntry,
  formatNavigationStructure,
  compose
} from './utils';

const DEFAULT_CONFIG = {
  env: 'production',
  locale: 'en-US'
};

const ALLOWED_CHILD_EVENTS = [
  'value',
  'child_added',
  'child_removed',
  'child_changed',
  'child_moved'
];

function flamelink(conf = {}) {
  let firebaseApp_ = null;
  let databaseService_ = null;
  let storageService_ = null;
  let authService_ = null;

  const config = Object.assign({}, DEFAULT_CONFIG, conf);

  // Set flamelink specific properties
  let env_ = config.env;
  let locale_ = config.locale;

  // Init firebaseApp if not set of provided
  if (config.firebaseApp) {
    firebaseApp_ = config.firebaseApp;
  } else if (!firebaseApp_) {
    const { apiKey, authDomain, databaseURL, storageBucket } = config;

    if (!apiKey || !authDomain || !databaseURL) {
      throw error(
        'The following config properties are mandatory: "apiKey", "authDomain", "databaseURL"'
      );
    }

    firebaseApp_ = firebase.initializeApp({
      apiKey,
      authDomain,
      databaseURL,
      storageBucket
    });
  }

  const getService = (service, serviceName) =>
    service || typeof firebaseApp_[serviceName] === 'function' ? firebaseApp_[serviceName]() : null;

  databaseService_ = getService(databaseService_, 'database');
  storageService_ = getService(storageService_, 'storage');
  authService_ = getService(authService_, 'auth');

  const schemasAPI = {
    /**
     * Establish and return a reference to schemas in firebase db
     *
     * @param {String} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      return databaseService_.ref(getSchemasRefPath(ref, env_, locale_));
    },

    /**
     * Read all schemas from the db and return snapshot response
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getAllRaw(options = {}) {
      const ordered = applyOrderBy(this.ref(''), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Get all schemas and return the processed value
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getAll(options = {}) {
      const snapshot = await this.getAllRaw(options);
      return pluckResultFields(options.fields, snapshot.val());
    },

    /**
     * Read an individual schema from the db and return snapshot response
     *
     * @param {String} schemaRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(schemaRef, options = {}) {
      const ordered = applyOrderBy(this.ref(schemaRef), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Get individual schema object for the given reference
     *
     * @param {String} schemaRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(schemaRef = '', options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const snapshot = await this.getRaw(schemaRef, options);
      const wrapValue = { [schemaRef]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
      return pluckFields(wrapValue)[schemaRef];
    },

    /**
     * Get an individual schema's fields and return snapshot response
     *
     * @param {String} schemaRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFieldsRaw(schemaRef, options = {}) {
      const ordered = applyOrderBy(this.ref(`${schemaRef}/fields`), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Get individual schema's fields array for the given reference
     *
     * @param {String} schemaRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFields(schemaRef, options = {}) {
      const snapshot = await this.getFieldsRaw(schemaRef, options);
      return pluckResultFields(options.fields, snapshot.val());
    }
  };

  const contentAPI = {
    /**
     * @description Establish and return a reference to section in firebase db
     * @param {String} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      return databaseService_.ref(getContentRefPath(ref, env_, locale_));
    },

    /**
     * @description Read entries/entry for given content type and optional entry reference and return raw snapshot
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(contentRef, entryRef, options = {}) {
      // Is single entry query?
      if (['string', 'number'].includes(typeof entryRef)) {
        const ordered = applyOrderBy(this.ref(contentRef).child(entryRef), options);
        const filtered = applyFilters(ordered, options);

        return filtered.once(options.event || 'value');
      }

      // Query all entries for given content type
      const opts = entryRef; // second param is then the options

      const ordered = applyOrderBy(this.ref(contentRef), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once(opts.event || 'value');
    },

    /**
     * @description Get entries/entry for given content type and optional entry ID/reference
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(contentRef, entryRef, options = {}) {
      // Is single entry query?
      if (['string', 'number'].includes(typeof entryRef)) {
        const pluckFields = pluckResultFields(options.fields);
        const populateFields = populateEntry(schemasAPI, contentAPI, contentRef, options.populate);
        const snapshot = await this.getRaw(contentRef, entryRef, options);
        const wrapValue = { [entryRef]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
        const result = await compose(populateFields, pluckFields)(wrapValue);
        return result[entryRef];
      }

      // Query all entries for given content type
      const opts = entryRef; // second param is then the options

      const pluckFields = pluckResultFields(opts.fields);
      const populateFields = populateEntry(schemasAPI, contentAPI, contentRef, opts.populate);
      const snapshot = await this.getRaw(contentRef, opts);
      const result = await compose(populateFields, pluckFields)(snapshot.val());
      return result;
    },

    /**
     * Get an entry for a given content reference, field and value.
     *
     * @param {String} contentRef
     * @param {String} field
     * @param {String} value
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getByFieldRaw(contentRef, field, value, options = {}) {
      const opts = Object.assign({}, options, { orderByChild: field, equalTo: value });
      return this.getRaw(contentRef, opts);
    },

    /**
     * Get an entry for a given content reference, field and value.
     *
     * @param {String} contentRef
     * @param {String} field
     * @param {String} value
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    getByField(contentRef, field, value, options = {}) {
      const opts = Object.assign({}, options, { orderByChild: field, equalTo: value });
      return this.get(contentRef, opts);
    },

    /**
     * Establish stream to read value consistently from db, returning the raw snapshot
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    subscribeRaw(contentRef, entryRef, options = {}, cb) {
      // Is single entry subscription?
      if (['string', 'number'].includes(typeof entryRef)) {
        if (!cb) {
          cb = options;
          options = {};
        }

        const ordered = applyOrderBy(this.ref(contentRef).child(entryRef), options);
        const filtered = applyFilters(ordered, options);

        return filtered.on(options.event || 'value', cb);
      }

      // Subscribe to all entries for given content type
      if (typeof entryRef === 'object') {
        cb = options; // third param is then the callback
        options = entryRef; // second param is then the options
      } else if (typeof entryRef === 'function') {
        cb = entryRef; // second param is then the callback
        options = {}; // set default options
      } else {
        throw error('Check out the docs for the required parameters for this method');
      }

      const ordered = applyOrderBy(this.ref(contentRef), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on(options.event || 'value', cb);
    },

    /**
     * Establish stream to read value consistently from db, returning the processed value
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    subscribe(contentRef, entryRef, options = {}, cb) {
      try {
        // Is single entry subscription?
        if (['string', 'number'].includes(typeof entryRef)) {
          if (!cb) {
            cb = options;
            options = {};
          }

          const pluckFields = pluckResultFields(options.fields);
          const populateFields = populateEntry(
            schemasAPI,
            contentAPI,
            contentRef,
            options.populate
          );

          return this.subscribeRaw(contentRef, entryRef, options, async snapshot => {
            const wrapValue = { [entryRef]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
            const result = await compose(populateFields, pluckFields)(wrapValue);
            cb(null, result[entryRef]); // Error-first callback
          });
        }

        // Subscribe to all entries for given content type
        if (typeof entryRef === 'object') {
          cb = options; // third param is then the callback
          options = entryRef; // second param is then the options
        } else if (typeof entryRef === 'function') {
          cb = entryRef; // second param is then the callback
          options = {}; // set default options
        } else {
          throw error('Check out the docs for the required parameters for this method');
        }

        const pluckFields = pluckResultFields(options.fields);
        const populateFields = populateEntry(schemasAPI, contentAPI, contentRef, options.populate);

        return this.subscribeRaw(contentRef, options, async snapshot => {
          const result = await compose(populateFields, pluckFields)(snapshot.val());
          cb(null, result); // Error-first callback
        });
      } catch (err) {
        return cb(err);
      }
    },

    /**
     * Detach event listeners from given reference.
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {String} event
     * @returns {Promise}
     */
    unsubscribe(...args) {
      if (args.length === 3) {
        // args[0] = contentRef
        // args[1] = entryRef
        // args[2] = event
        return this.ref(args[0])
          .child(args[1])
          .off(args[2]);
      }

      if (args.length === 2) {
        // Is second arg a valid firebase child event?
        if (ALLOWED_CHILD_EVENTS.includes(args[1])) {
          // args[0] = contentRef
          // args[1] = event
          return this.ref(args[0]).off(args[1]);
        }

        // args[0] = contentRef
        // args[1] = entryRef
        return this.ref(args[0])
          .child(args[1])
          .off();
      }

      if (args.length === 1) {
        return this.ref(args[0]).off();
      }

      throw error(
        '"unsubscribe" method needs to be called with min 1 argument and max 3 arguments'
      );
    },

    /**
     * Save data for a specific content type's entry.
     * This overwrites data at the specified location, including any child nodes.
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} payload
     * @returns {Promise}
     */
    set(contentRef, entryRef, payload) {
      if (
        typeof contentRef !== 'string' ||
        typeof entryRef !== 'string' ||
        (typeof payload !== 'object' && payload !== null)
      ) {
        throw error('"set" called with the incorrect arguments. Check the docs for details.');
      }

      return this.ref(contentRef)
        .child(entryRef)
        .set(payload);
    },

    /**
     * Simultaneously write to specific children of a node without overwriting other child nodes.
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} payload
     * @returns {Promise}
     */
    update(contentRef, entryRef, payload) {
      if (
        typeof contentRef !== 'string' ||
        typeof entryRef !== 'string' ||
        (typeof payload !== 'object' && payload !== null)
      ) {
        throw error('"update" called with the incorrect arguments. Check the docs for details.');
      }

      return this.ref(contentRef)
        .child(entryRef)
        .update(payload);
    },

    /**
     * The simplest way to delete data for a given reference.
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @returns {Promise}
     */
    remove(contentRef, entryRef) {
      if (typeof contentRef !== 'string' || typeof entryRef !== 'string') {
        throw error('"remove" called with the incorrect arguments. Check the docs for details.');
      }
      return this.ref(contentRef)
        .child(entryRef)
        .remove();
    },

    /**
     * Transactional operation
     * https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Function} updateFn
     * @param {Function} [cb=() => {}]
     * @returns
     */
    transaction(contentRef, entryRef, updateFn, cb = () => {}) {
      if (
        typeof contentRef !== 'string' ||
        typeof entryRef !== 'string' ||
        typeof updateFn !== 'function'
      ) {
        throw error(
          '"transaction" called with the incorrect arguments. Check the docs for details.'
        );
      }

      return this.ref(contentRef)
        .child(entryRef)
        .transaction(updateFn, cb);
    }
  };

  const navigationAPI = {
    /**
     * Establish and return a reference to section in firebase db
     *
     * @param {String} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      return databaseService_.ref(getNavigationRefPath(ref, env_, locale_));
    },

    /**
     * @description Get snapshot for given navigation ID/reference
     * @param {String} navRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(navRef, options = {}) {
      if (!navRef) {
        throw error('"getRaw" method requires a navigation reference');
      }

      const ordered = applyOrderBy(this.ref(navRef), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * @description Get navigation object for given navigation ID/reference
     * @param {String} navRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(navRef, options = {}) {
      if (!navRef) {
        throw error('"get" method requires a navigation reference');
      }

      const snapshot = await this.getRaw(navRef, options);
      const wrappedNav = await pluckResultFields(options.fields, { [navRef]: snapshot.val() });
      const nav = wrappedNav[navRef];

      // Only try and structure items if items weren't plucked out
      if (nav && nav.hasOwnProperty('items')) {
        return Object.assign({}, nav, {
          items: formatNavigationStructure(options.structure, nav.items)
        });
      }

      return nav;
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {String} navRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getItemsRaw(navRef, options = {}) {
      if (!navRef) {
        throw error('"getItemsRaw" method requires a navigation reference');
      }

      const ordered = applyOrderBy(this.ref(navRef).child('items'), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Read value once from db
     *
     * @param {String} navRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getItems(navRef, options = {}) {
      if (!navRef) {
        throw error('"getItems" method requires a navigation reference');
      }

      const pluckFields = pluckResultFields(options.fields);
      const structureItems = formatNavigationStructure(options.structure);
      const snapshot = await this.getItemsRaw(navRef, options);
      return compose(pluckFields, structureItems)(snapshot.val());
    },

    /**
     * Establish stream to read value consistently from db, returning the raw snapshot
     *
     * @param {String} navRef
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    subscribeRaw(navRef, options = {}, cb) {
      if (!cb) {
        cb = options; // second param is then the callback
        options = {}; // set default options
      }

      const ordered = applyOrderBy(this.ref(navRef), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on(options.event || 'value', cb);
    },

    /**
     * Establish stream to read value consistently from db, returning the processed value
     *
     * @param {String} navRef
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    subscribe(navRef, options = {}, cb) {
      try {
        if (!cb || typeof options === 'function') {
          cb = options; // second param is then the callback
          options = {}; // set default options
        }

        const pluckFields = pluckResultFields(options.fields);

        return this.subscribeRaw(navRef, options, async snapshot => {
          const result = await compose(pluckFields)(snapshot.val());
          cb(null, result); // Error-first callback
        });
      } catch (err) {
        return cb(err);
      }
    },

    /**
     * Detach listeners from given reference.
     *
     * @param {String} navRef
     * @param {String} event
     * @returns {Promise}
     */
    unsubscribe(...args) {
      if (args.length === 2) {
        // Is second arg a valid firebase child event?
        if (ALLOWED_CHILD_EVENTS.includes(args[1])) {
          // args[0] = navRef
          // args[1] = event
          return this.ref(args[0]).off(args[1]);
        }

        throw error(`"${args[1]}" is not a valid child event`);
      }

      if (args.length === 1) {
        return this.ref(args[0]).off();
      }

      throw error(
        '"unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
      );
    },

    /**
     * Save data for a specific navigation entry/menu.
     * This overwrites data at the specified location, including any child nodes.
     *
     * @param {String} navRef
     * @param {Object} payload
     * @returns {Promise}
     */
    set(navRef, payload) {
      if (typeof navRef !== 'string' || (typeof payload !== 'object' && payload !== null)) {
        throw error('"set" called with the incorrect arguments. Check the docs for details.');
      }

      return this.ref(navRef).set(payload);
    },

    /**
     * Simultaneously write to specific children of a node without overwriting other child nodes.
     *
     * @param {String} navRef
     * @param {Object} payload
     * @returns {Promise}
     */
    update(navRef, payload) {
      if (typeof navRef !== 'string' || (typeof payload !== 'object' && payload !== null)) {
        throw error('"update" called with the incorrect arguments. Check the docs for details.');
      }

      return this.ref(navRef).update(payload);
    },

    /**
     * The simplest way to delete data for a given reference.
     *
     * @param {String} navRef
     * @returns {Promise}
     */
    remove(navRef) {
      if (typeof navRef !== 'string') {
        throw error('"remove" called with the incorrect arguments. Check the docs for details.');
      }
      return this.ref(navRef).remove();
    },

    /**
     * Transactional operation
     * https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
     *
     * @param {String} navRef
     * @param {Function} updateFn
     * @param {Function} [cb=() => {}]
     * @returns
     */
    transaction(navRef, updateFn, cb = () => {}) {
      if (typeof navRef !== 'string' || typeof updateFn !== 'function') {
        throw error(
          '"transaction" called with the incorrect arguments. Check the docs for details.'
        );
      }

      return this.ref(navRef).transaction(updateFn, cb);
    }
  };

  // Public API
  return {
    firebaseApp: firebaseApp_,

    databaseService: databaseService_,

    storageService: storageService_,

    authService: authService_,

    /**
     * Sets the locale to be used for the flamelink app
     *
     * @param {String} locale The locale to set
     * @returns {Promise} Resolves to given locale if it is a supported locale, otherwise it rejects
     */
    setLocale(locale = locale_) {
      return new Promise((resolve, reject) => {
        databaseService_
          .ref('/settings/locales')
          .once('value')
          .then(snapshot => {
            const supportedLocales_ = snapshot.val();

            if (!supportedLocales_) {
              return reject(error('No supported locales found.'));
            }

            if (!supportedLocales_.includes(locale)) {
              return reject(
                error(
                  `"${locale}" is not a supported locale. Supported Locales: ${supportedLocales_.join(
                    ', '
                  )}`
                )
              );
            }

            locale_ = locale;

            return resolve(locale_);
          })
          .catch(reject);
      });
    },

    /**
     * Sets the environment to be used for the flamelink app
     *
     * @param {String} env The environment to set
     * @returns {Promise} Resolves to given environment if it is a supported environment, otherwise it rejects
     */
    setEnv(env = env_) {
      return new Promise((resolve, reject) => {
        databaseService_
          .ref('/settings/environments')
          .once('value')
          .then(snapshot => {
            const supportedEnvironments_ = snapshot.val();

            if (!supportedEnvironments_) {
              return reject(error(`No supported environments found.`));
            }

            if (!supportedEnvironments_.includes(env)) {
              return reject(
                error(
                  `"${env}" is not a supported environment. Supported Environments: ${supportedEnvironments_.join(
                    ', '
                  )}`
                )
              );
            }

            env_ = env;

            return resolve(env_);
          })
          .catch(reject);
      });
    },

    /**
     * Returns the set locale for the flamelink app
     *
     * @returns {Promise} Resolves with locale (just using promise for consistency and allowing us to make this async in the future)
     */
    getLocale() {
      return Promise.resolve(locale_);
    },

    /**
     * Returns the set environment for the flamelink app
     *
     * @returns {Promise} Resolves with environment (just using promise for consistency and allowing us to make this async in the future)
     */
    getEnv() {
      return Promise.resolve(env_);
    },

    content: contentAPI,

    nav: navigationAPI,

    schemas: schemasAPI
  };
}

flamelink.VERSION = __PACKAGE_VERSION__;

export default flamelink;
