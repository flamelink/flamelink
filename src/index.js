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

function flamelink(conf = {}) {
  let firebaseApp_ = null;
  let db_ = null;

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

  db_ = db_ || firebaseApp_.database();

  const schemasAPI = {
    /**
     * Establish and return a reference to schemas in firebase db
     *
     * @param {String} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      return db_.ref(getSchemasRefPath(ref, env_, locale_));
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

      return filtered.once('value');
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
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(ref, options = {}) {
      const ordered = applyOrderBy(this.ref(ref), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once('value');
    },

    /**
     * Get individual schema object for the given reference
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(ref, options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const snapshot = await this.getRaw(ref, options);
      const wrapValue = { [ref]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
      return pluckFields(wrapValue)[ref];
    },

    /**
     * Get an individual schema's fields and return snapshot response
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFieldsRaw(ref, options = {}) {
      const ordered = applyOrderBy(this.ref(`${ref}/fields`), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once('value');
    },

    /**
     * Get individual schema's fields array for the given reference
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFields(ref, options = {}) {
      const snapshot = await this.getFieldsRaw(ref, options);
      return pluckResultFields(options.fields, snapshot.val());
    }
  };

  const contentAPI = {
    /**
     * Establish and return a reference to section in firebase db
     *
     * @param {String} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      return db_.ref(getContentRefPath(ref, env_, locale_));
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getAllRaw(ref, options = {}) {
      const ordered = applyOrderBy(this.ref(ref), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once('value');
    },

    /**
     * Read value once from db
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getAll(ref, options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const populateFields = populateEntry(schemasAPI, contentAPI, ref, options.populate);
      const snapshot = await this.getAllRaw(ref, options);
      const result = await compose(populateFields, pluckFields)(snapshot.val());
      return result;
    },

    /**
     * Get individual content entry for given content reference and entry ID/reference and return raw snapshot
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getEntryRaw(contentRef, entryRef, options = {}) {
      const ordered = applyOrderBy(this.ref(contentRef).child(entryRef), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once('value');
    },

    /**
     * Get individual content entry for given content reference and entry ID/reference
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getEntry(contentRef, entryRef, options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const populateFields = populateEntry(schemasAPI, contentAPI, contentRef, options.populate);
      const snapshot = await this.getEntryRaw(contentRef, entryRef, options);
      const wrapValue = { [entryRef]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
      const result = await compose(populateFields, pluckFields)(wrapValue);
      return result[entryRef];
    },

    /**
     * Get individual content entry for given content reference and entry ID/reference and return raw snapshot
     *
     * @param {String} contentRef
     * @param {String} field
     * @param {String} value
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getByFieldRaw(contentRef, field, value, options = {}) {
      const opts = Object.assign({}, options, { orderByChild: field, equalTo: value });
      const ordered = applyOrderBy(this.ref(contentRef), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once('value');
    },

    /**
     * Read value once from db
     *
     * @param {String} contentRef
     * @param {String} field
     * @param {String} value
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getByField(contentRef, field, value, options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const populateFields = populateEntry(schemasAPI, contentAPI, contentRef, options.populate);
      const snapshot = await this.getByFieldRaw(contentRef, field, value, options);
      const result = await compose(populateFields, pluckFields)(snapshot.val());
      return result;
    },

    /**
     * Establish stream to read value consistently from db, returning the raw snapshot
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    onRaw(ref, options = {}, cb) {
      if (!cb) {
        cb = options;
        options = {};
      }

      const ordered = applyOrderBy(this.ref(ref), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on('value', cb);
    },

    /**
     * Establish stream to read value consistently from db, returning the processed value
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    on(ref, options = {}, cb) {
      if (!cb) {
        cb = options;
        options = {};
      }

      return this.onRaw(ref, options, snapshot => {
        cb(snapshot.val());
      });
    },

    /**
     * Detach listeners from given reference.
     *
     * @param {String} ref
     * @param {String} event
     * @returns {Promise}
     */
    off(ref, event) {
      if (event) {
        return this.ref(ref).off(event);
      }
      return this.ref(ref).off();
    },

    /**
     * Save data for a specific reference.
     * This overwrites data at the specified location, including any child nodes.
     *
     * @param {String} ref
     * @param {Object} payload
     * @returns {Promise}
     */
    set(ref, payload) {
      return this.ref(ref).set(payload);
    },

    /**
     * Simultaneously write to specific children of a node without overwriting other child nodes.
     *
     * @param {String} ref
     * @param {Object} payload
     * @returns {Promise}
     */
    update(ref, payload) {
      return this.ref(ref).update(payload);
    },

    /**
     * The simplest way to delete data for a given reference.
     *
     * @param {String} ref
     * @returns {Promise}
     */
    remove(ref) {
      return this.ref(ref).remove();
    },

    /**
     * Transactional operation
     * https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
     *
     * @param {any} ref
     * @param {any} updateFn
     * @param {any} [cb=() => {}]
     * @returns
     */
    transaction(ref, updateFn, cb = () => {}) {
      return this.ref(ref).transaction(updateFn, cb);
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
      return db_.ref(getNavigationRefPath(ref, env_, locale_));
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(ref, options = {}) {
      const ordered = applyOrderBy(this.ref(ref), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once('value');
    },

    /**
     * Read value once from db
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(ref, options = {}) {
      const snapshot = await this.getRaw(ref, options);
      const wrappedNav = await pluckResultFields(options.fields, { [ref]: snapshot.val() });
      const nav = wrappedNav[ref];

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
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getItemsRaw(ref, options = {}) {
      const ordered = applyOrderBy(this.ref(ref).child('items'), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once('value');
    },

    /**
     * Read value once from db
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getItems(ref, options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const structureItems = formatNavigationStructure(options.structure);
      const snapshot = await this.getItemsRaw(ref, options);
      return compose(structureItems, pluckFields)(snapshot.val());
    },

    /**
     * Establish stream to read value consistently from db, returning the raw snapshot
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    onRaw(ref, options = {}, cb) {
      if (!cb) {
        cb = options;
        options = {};
      }

      const ordered = applyOrderBy(this.ref(ref), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on('value', cb);
    },

    /**
     * Establish stream to read value consistently from db, returning the processed value
     *
     * @param {String} ref
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    on(ref, options = {}, cb) {
      if (!cb) {
        cb = options;
        options = {};
      }

      return this.onRaw(ref, options, snapshot => {
        cb(snapshot.val());
      });
    },

    /**
     * Detach listeners from given reference.
     *
     * @param {String} ref
     * @param {String} event
     * @returns {Promise}
     */
    off(ref, event) {
      if (event) {
        return this.ref(ref).off(event);
      }
      return this.ref(ref).off();
    },

    /**
     * Save data for a specific reference.
     * This overwrites data at the specified location, including any child nodes.
     *
     * @param {String} ref
     * @param {Object} payload
     * @returns {Promise}
     */
    set(ref, payload) {
      return this.ref(ref).set(payload);
    },

    /**
     * Simultaneously write to specific children of a node without overwriting other child nodes.
     *
     * @param {String} ref
     * @param {Object} payload
     * @returns {Promise}
     */
    update(ref, payload) {
      return this.ref(ref).update(payload);
    },

    /**
     * The simplest way to delete data for a given reference.
     *
     * @param {String} ref
     * @returns {Promise}
     */
    remove(ref) {
      return this.ref(ref).remove();
    },

    /**
     * Transactional operation
     * https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
     *
     * @param {any} ref
     * @param {any} updateFn
     * @param {any} [cb=() => {}]
     * @returns
     */
    transaction(ref, updateFn, cb = () => {}) {
      return this.ref(ref).transaction(updateFn, cb);
    }
  };

  // Public API
  return {
    firebaseApp: firebaseApp_,

    /**
     * Sets the locale to be used for the flamelink app
     *
     * @param {String} locale The locale to set
     * @returns {Promise} Resolves to given locale if it is a supported locale, otherwise it rejects
     */
    setLocale(locale = locale_) {
      return new Promise((resolve, reject) => {
        db_
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
        db_
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
