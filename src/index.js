import './polyfills';
import error from './utils/error';
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

  const applyOrderBy = (ref, opt) => {
    switch ((opt.orderBy || '').toUpperCase()) {
      case 'CHILD':
        if (typeof opt.orderByValue === 'undefined') {
          throw error('"orderByValue" is also required when using `orderBy: "CHILD"`');
        }
        return ref.orderByChild(opt.orderByValue);

      case 'VALUE':
        return ref.orderByValue();

      case 'KEY':
        return ref.orderByKey();

      default:
        return ref;
    }
  };

  const applyFilters = (ref, opt) => {
    if (!opt.filters) {
      return ref;
    }

    return Object.keys(opt.filters).reduce((newRef, filter) => {
      newRef = newRef[filter](opt.filters[filter]);
      return newRef;
    }, ref);
  };

  const getContentRefPath = ref => `${env_ ? `/environments/${env_}/` : ''}content${ref ? `/${ref}` : ''}${locale_ ? `/${locale_}` : ''}`;
  const getNavigationRefPath = ref => `${env_ ? `/environments/${env_}/` : ''}navigation${ref ? `/${ref}` : ''}${locale_ ? `/${locale_}` : ''}`;

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
        return db_.ref(getContentRefPath(ref));
      },

      /**
       * Read value once from db and return raw snapshot
       *
       * @param {String} ref
       * @param {Object} [options={}]
       * @returns {Promise} Resolves to snapshot of query
       */
      getRaw(ref, options = {}) {
        const ref_ = this.ref(ref);
        const ordered = applyOrderBy(ref_, options);
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
              // TODO: put any additional massaging or cleaning up of the data we want to expose here
              resolve(snapshot.val());
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

        const ref_ = this.ref(ref);
        const ordered = applyOrderBy(ref_, options);
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
        return this.onRaw(ref, options, snapshot => {
          cb(snapshot.val());
        });
      },

      /**
       * Detach listeners from given reference. By default, it will detach listeners for `value` event.
       *
       * @param {String} ref
       * @param {String} [event='value']
       * @returns {Promise}
       */
      off(ref, event = 'value') {
        if (!!event) {
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
        return db_.ref(getNavigationRefPath(ref));
      },

      /**
       * Read value once from db and return raw snapshot
       *
       * @param {String} ref
       * @param {Object} [options={}]
       * @returns {Promise} Resolves to snapshot of query
       */
      getRaw(ref, options = {}) {
        const ref_ = this.ref(ref);
        const ordered = applyOrderBy(ref_, options);
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
              // TODO: put any additional massaging or cleaning up of the data we want to expose here
              resolve(snapshot.val());
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

        const ref_ = this.ref(ref);
        const ordered = applyOrderBy(ref_, options);
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
        return this.onRaw(ref, options, snapshot => {
          cb(snapshot.val());
        });
      },

      /**
       * Detach listeners from given reference. By default, it will detach listeners for `value` event.
       *
       * @param {String} ref
       * @param {String} [event='value']
       * @returns {Promise}
       */
      off(ref, event = 'value') {
        if (!!event) {
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
    }
  };
}

flamelink.VERSION = __PACKAGE_VERSION__;

export default flamelink;
