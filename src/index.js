import * as firebase from 'firebase';
import pkg from '../package.json';

const DEFAULT_CONFIG = {
  env: 'production',
  lang: 'en-US'
};

let fb_ = null;
let lang_ = '';
let env_ = '';

function flamelink(conf = {}) {
  const config = Object.assign({}, DEFAULT_CONFIG, conf);

  if (config.firebaseApp) {
    fb_ = config.firebaseApp;
  } else if (!fb_) {
    const { apiKey, authDomain, databaseURL, storageBucket } = config;

    if (!apiKey || !authDomain || !databaseURL) {
      throw new Error('[FLAMELINK] The following config properties are mandatory: "apiKey", "authDomain", "databaseURL"');
    }

    fb_ = firebase.initializeApp({
      apiKey: 'AIzaSyAxlh-gBxcRkQWbxC0L10S5Qo3Su6xRs8E',
      authDomain: 'fir-editor.firebaseapp.com',
      databaseURL: 'https://fir-editor.firebaseio.com',
      storageBucket: 'fir-editor.appspot.com'
    });
  }

  return {
    firebaseApp: fb_,
    setLanguage(lang = lang_) {
      lang_ = lang;
    },
    setEnv(env = env_) {
      env_ = env;
    },
    content: {
      /**
       * Read value once from db and return raw snapshot
       *
       * @param {String} ref
       * @param {Object} [options={}]
       * @returns {Promise} Resolves to snapshot of query
       */
      getRaw(ref, options = {}) {
        let orderBy;
        switch ((options.orderBy || '').toUpperCase()) {
          case 'CHILD':
            orderBy = 'orderByChild';
            break;

          case 'VALUE':
            orderBy = 'orderByValue';
            break;

          case 'KEY':
          default:
            orderBy = 'orderByKey';
        }

        return new Promise((resolve, reject) => {
          fb_
            .database()
            .ref(`content${ref ? `/${ref}` : ''}`)
            // [orderBy]()
            // .equalTo('1')
            .once('value')
            .then(resolve)
            .catch(reject);
        });
      },

      /**
       * Read value once from db
       *
       * @param {String} ref
       * @param {Object} [options={}]
       * @returns {Promise} Resolves to value of query
       */
      get(ref, options = {}) {
        let orderBy;
        switch ((options.orderBy || '').toUpperCase()) {
          case 'CHILD':
            orderBy = 'orderByChild';
            break;

          case 'VALUE':
            orderBy = 'orderByValue';
            break;

          case 'KEY':
          default:
            orderBy = 'orderByKey';
        }

        return new Promise((resolve, reject) => {
          fb_
            .database()
            .ref(`content${ref ? `/${ref}` : ''}`)
            // [orderBy]()
            // .equalTo('1')
            .once('value')
            .then(snapshot => {
              const value = snapshot.val();
              console.log(value);
              resolve(value);
            })
            .catch(reject);
        });
      },
      on() {},
      off() {},
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

flamelink.VERSION = pkg.version;

export default flamelink;
