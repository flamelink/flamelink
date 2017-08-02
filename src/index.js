import './polyfills';
import * as firebase from 'firebase';

const DEFAULT_CONFIG = {
  env: 'production',
  lang: 'en-US'
};

let firebaseApp_ = null;

function flamelink(conf = {}) {
  const config = Object.assign({}, DEFAULT_CONFIG, conf);

  // Set flamelink specific properties
  let env_ = config.env;
  let lang_ = config.lang;

  // Init firebaseApp if not set of provided
  if (config.firebaseApp) {
    firebaseApp_ = config.firebaseApp;
  } else if (!firebaseApp_) {
    const { apiKey, authDomain, databaseURL, storageBucket } = config;

    if (!apiKey || !authDomain || !databaseURL) {
      throw new Error('[FLAMELINK] The following config properties are mandatory: "apiKey", "authDomain", "databaseURL"');
    }

    firebaseApp_ = firebase.initializeApp({
      apiKey,
      authDomain,
      databaseURL,
      storageBucket
    });
  }

  const applyOrderBy = (ref, opt) => {
    switch ((opt.orderBy || '').toUpperCase()) {
      case 'CHILD':
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

  // Public API
  return {
    firebaseApp: firebaseApp_,

    setLanguage(lang = lang_) {
      lang_ = lang;
    },

    setEnv(env = env_) {
      env_ = env;
    },

    content: {
      /**
       * Establish and return a reference to section in firebase db
       *
       * @param {String} ref
       * @returns {Object} Ref object
       */
      ref(ref) {
        return firebaseApp_.database().ref(`${env_ ? `/${env_}` : ''}content${ref ? `/${ref}` : ''}${lang_ ? `/${lang_}` : ''}`);
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
       * @returns {Promise} Resolves to snapshot of query
       */
      onRaw(ref, options = {}) {
        const ref_ = this.ref(ref);
        const ordered = applyOrderBy(ref_, options);
        const filtered = applyFilters(ordered, options);

        return filtered.on('value');
      },

      on(ref, options = {}) {},

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

      set() {},

      remove() {}
    },

    nav: {
      get() {},
      on() {},
      off() {},
      set() {},
      remove() {}
    }
  };
}

flamelink.VERSION = __PACKAGE_VERSION__;

export default flamelink;
