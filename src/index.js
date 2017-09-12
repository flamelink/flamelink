import 'regenerator-runtime/runtime';
import './polyfills';
import error from './utils/error';
import { applyOrderBy, applyFilters, getContentRefPath, getNavigationRefPath, getSchemasRefPath, pluckResultFields } from './utils';
import * as firebase from 'firebase';

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
      throw error('The following config properties are mandatory: "apiKey", "authDomain", "databaseURL"');
    }

    firebaseApp_ = firebase.initializeApp({
      apiKey,
      authDomain,
      databaseURL,
      storageBucket
    });
  }

  db_ = db_ || firebaseApp_.database();

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
            let supportedLocales_ = snapshot.val();

            if (!supportedLocales_) {
              return reject(error('No supported locales found.'));
            }

            if (!supportedLocales_.includes(locale)) {
              return reject(error(`"${locale}" is not a supported locale. Supported Locales: ${supportedLocales_.join(', ')}`));
            }

            locale_ = locale;

            resolve(locale_);
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
            let supportedEnvironments_ = snapshot.val();

            if (!supportedEnvironments_) {
              return reject(error(`No supported environments found.`));
            }

            if (!supportedEnvironments_.includes(env)) {
              return reject(error(`"${env}" is not a supported environment. Supported Environments: ${supportedEnvironments_.join(', ')}`));
            }

            env_ = env;

            resolve(env_);
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

    content: {
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
      get(ref, options = {}) {
        return new Promise((resolve, reject) => {
          this.getRaw(ref, options)
            .then(snapshot => {
              resolve(pluckResultFields(snapshot.val(), options.fields));
            })
            .catch(reject);
        });
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
    },

    nav: {
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
      get(ref, options = {}) {
        return new Promise((resolve, reject) => {
          this.getRaw(ref, options)
            .then(snapshot => {
              resolve(pluckResultFields(snapshot.val(), options.fields));
            })
            .catch(reject);
        });
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
      getItems(ref, options = {}) {
        return new Promise((resolve, reject) => {
          this.getItemsRaw(ref, options)
            .then(snapshot => {
              resolve(pluckResultFields(snapshot.val(), options.fields));
            })
            .catch(reject);
        });
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
    },

    schemas: {
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
       * Read value once from db
       *
       * @param {Object} [options={}]
       * @returns {Promise} Resolves to value of query
       */
      getAll(options = {}) {
        return new Promise((resolve, reject) => {
          this.getAllRaw(options)
            .then(snapshot => {
              resolve(pluckResultFields(snapshot.val(), options.fields));
            })
            .catch(reject);
        });
      }
    }
  };
}

flamelink.VERSION = __PACKAGE_VERSION__;

export default flamelink;
