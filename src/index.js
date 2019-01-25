import 'regenerator-runtime/runtime';
import * as firebase from 'firebase';
import validate from 'validate.js';
import compose from 'compose-then';
import values from 'lodash/values';
import keys from 'lodash/keys';
import find from 'lodash/find';
import get from 'lodash/get';
import set from 'lodash/set';
import isArray from 'lodash/isArray';
import pick from 'lodash/fp/pick';
import resizeImage from 'browser-image-resizer';
import './polyfills';
import error from './utils/error';
import deprecate from './utils/deprecate';
import {
  applyOrderBy,
  applyFilters,
  getContentRefPath,
  getNavigationRefPath,
  getSchemasRefPath,
  getStorageRefPath,
  getSettingsRefPath,
  getFileRefPath,
  getFolderRefPath,
  getMediaRefPath,
  pluckResultFields,
  populateEntry,
  filterByFolderId,
  formatStructure,
  getScreenResolution,
  hasNonCacheableOptions,
  prepConstraintsForValidate
} from './utils';
import { DEFAULT_CONFIG, ALLOWED_CHILD_EVENTS, DEFAULT_REQUIRED_IMAGE_SIZE } from './constants';

const CACHE = {};

function flamelink(conf = {}) {
  let firebaseApp_ = null;
  let databaseService_ = null;
  let storageService_ = null;
  let authService_ = null;
  let firestoreService_ = null;
  let isAdminApp_ = false;

  const config = Object.assign({}, DEFAULT_CONFIG, conf);

  // Set flamelink specific properties
  let env_ = config.env;
  let locale_ = config.locale;

  // Init firebaseApp if not set or provided
  if (config.firebaseApp) {
    firebaseApp_ = config.firebaseApp;

    // Is the Firebase app instance an admin app instance?
    if (config.isAdminApp) {
      isAdminApp_ = true;
    }
  } else if (!firebaseApp_) {
    const { apiKey, authDomain, databaseURL, storageBucket, projectId } = config;

    if (!apiKey || !authDomain || !databaseURL || !projectId) {
      throw error(
        'The following config properties are mandatory: "apiKey", "authDomain", "databaseURL", "projectId"'
      );
    }

    firebaseApp_ = firebase.initializeApp(
      {
        apiKey,
        authDomain,
        databaseURL,
        storageBucket,
        projectId
      },
      projectId
    );
  }

  const getService = (service, serviceName) =>
    service || typeof firebaseApp_[serviceName] === 'function' ? firebaseApp_[serviceName]() : null;

  databaseService_ = getService(databaseService_, 'database');
  storageService_ = getService(storageService_, 'storage');
  authService_ = getService(authService_, 'auth');
  firestoreService_ = getService(firestoreService_, 'firestore');

  const schemasAPI = {
    /**
     * Establish and return a reference to schemas in firebase db
     *
     * @param {String} schemaRef
     * @returns {Object} Ref object
     */
    ref(schemaRef) {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      return databaseService_.ref(getSchemasRefPath(schemaRef || null, env_, locale_));
    },

    /**
     * Read all or an individual schema from the db and return snapshot response
     *
     * @param {String} [schemaRef] The schema's key in the db
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(schemaRef, options = {}) {
      const ref = typeof schemaRef === 'string' ? schemaRef : null;
      const opts = typeof schemaRef === 'string' ? options : schemaRef || {};
      const ordered = applyOrderBy(schemasAPI.ref(ref), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once(opts.event || 'value');
    },

    /**
     * Get all schemas or an individual schema object for the given reference
     *
     * @param {String} schemaRef The schema's key in the db
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(schemaRef, options = {}) {
      if (typeof schemaRef === 'string') {
        // Single Schema
        const pluckFields = pluckResultFields(options.fields);

        let schema = get(CACHE, `schemas[${env_}].${schemaRef}`);

        if (!schema || hasNonCacheableOptions(options)) {
          const snapshot = await schemasAPI.getRaw(schemaRef, options);
          schema = snapshot.val();
        }
        const wrapValue = { [schemaRef]: schema }; // Wrapping value to create the correct structure for our filtering to work
        return pluckFields(wrapValue)[schemaRef];
      }

      // All Schemas
      options = schemaRef || {};

      let schemas = get(CACHE, `schemas[${env_}]`);

      if (!schemas || hasNonCacheableOptions(options)) {
        const snapshot = await schemasAPI.getRaw(null, options);
        schemas = snapshot.val();
      }
      const pluckFields = pluckResultFields(options.fields);
      return pluckFields(schemas);
    },

    /**
     * Get all schemas' or an individual schema's fields and return snapshot response
     *
     * @param {String} schemaRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFieldsRaw(schemaRef, options = {}) {
      const ref = typeof schemaRef === 'string' ? `${schemaRef}/fields` : null;
      const opts = typeof schemaRef === 'string' ? options : schemaRef || {};
      const ordered = applyOrderBy(schemasAPI.ref(ref), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once(opts.event || 'value');
    },

    /**
     * Get all schemas' or an individual schema's fields array for the given reference
     *
     * @param {String} schemaRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFields(schemaRef, options = {}) {
      if (typeof schemaRef === 'string') {
        // Single schema
        const schemaCache = get(CACHE, `schemas[${env_}].${schemaRef}`);
        let fields = schemaCache ? schemaCache.fields : null;

        if (!fields || hasNonCacheableOptions(options)) {
          const snapshot = await schemasAPI.getFieldsRaw(schemaRef, options);
          fields = snapshot.val();
        }

        return pluckResultFields(options.fields, fields);
      }

      // All schemas
      const opts = schemaRef || {};
      let schemas = get(CACHE, `schemas[${env_}]`);

      if (!schemas || hasNonCacheableOptions(opts)) {
        const snapshot = await schemasAPI.getFieldsRaw(opts);
        schemas = snapshot.val();
      }

      return keys(schemas).reduce(
        (result, key) =>
          Object.assign({}, result, {
            [key]: pluckResultFields(opts.fields, schemas[key].fields)
          }),
        {}
      );
    },

    /**
     * @description Establish stream to read value consistently from db, returning the raw snapshot
     * @param {String} [schemaKey]
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    subscribeRaw(schemaKey, options = {}, cb) {
      // Single schema
      if (typeof schemaKey === 'string') {
        if (!cb) {
          cb = options; // second param is then the callback
          options = {}; // set default options
        }

        const ordered = applyOrderBy(schemasAPI.ref(schemaKey), options);
        const filtered = applyFilters(ordered, options);

        return filtered.on(options.event || 'value', cb);
      }

      // All schemas
      cb = options;
      options = schemaKey || {};

      if (typeof cb === 'object') {
        cb = schemaKey; // first param is then the callback
        options = {}; // set default options
      }

      const ordered = applyOrderBy(schemasAPI.ref(null), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on(options.event || 'value', cb);
    },

    /**
     * @description Establish stream to read value consistently from db, returning the processed value
     * @param {String} [schemaKey]
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    subscribe(schemaKey, options = {}, cb) {
      try {
        // Single schema
        if (typeof schemaKey === 'string') {
          if (!cb || typeof options === 'function') {
            cb = options; // second param is then the callback
            options = {}; // set default options
          }

          const pluckFields = pluckResultFields(options.fields);

          return schemasAPI.subscribeRaw(schemaKey, options, async snapshot => {
            const wrappedSchema = await compose(pluckFields)({ [schemaKey]: snapshot.val() });
            const schema = wrappedSchema[schemaKey];
            return cb(null, schema); // Error-first callback
          });
        }

        // All schemas
        cb = options;
        options = schemaKey || {};

        if (typeof cb === 'object') {
          cb = schemaKey; // first param is then the callback
          options = {}; // set default options
        }

        const pluckFields = pluckResultFields(options.fields);

        return schemasAPI.subscribeRaw(options, async snapshot => {
          const pluckedSchemas = await compose(pluckFields)(snapshot.val());

          cb(null, pluckedSchemas); // Error-first callback
        });
      } catch (err) {
        return cb(err);
      }
    },

    /**
     * @description Detach listeners from given reference.
     * @param {String} schemaKey
     * @param {String} event
     * @returns {Promise}
     */
    unsubscribe(...args) {
      if (args.length === 2) {
        // Is second arg a valid firebase child event?
        if (ALLOWED_CHILD_EVENTS.includes(args[1])) {
          // args[0] = schemaKey
          // args[1] = event
          return schemasAPI.ref(args[0]).off(args[1]);
        }

        throw error(`"${args[1]}" is not a valid child event`);
      }

      if (args.length === 1) {
        return schemasAPI.ref(args[0]).off();
      }

      throw error(
        '"unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
      );
    },

    /**
     * @description Save data for a specific schema.
     * This overwrites data at the specified location, including any child nodes.
     * @param {String} schemaKey
     * @param {Object} payload
     * @returns {Promise}
     */
    set(schemaKey, payload) {
      if (typeof schemaKey !== 'string' || (typeof payload !== 'object' && payload !== null)) {
        throw error('"set" called with the incorrect arguments. Check the docs for details.');
      }

      const payload_ =
        typeof payload === 'object'
          ? Object.assign({}, payload, {
              __meta__: {
                createdBy: get(authService_, 'currentUser.uid', 'UNKNOWN'),
                createdDate: new Date().toISOString()
              },
              id: schemaKey
            })
          : payload;

      return schemasAPI.ref(schemaKey).set(payload_);
    },

    /**
     * @description Simultaneously write to specific children of a node without overwriting other child nodes.
     * @param {String} schemaKey
     * @param {Object} payload
     * @returns {Promise}
     */
    update(schemaKey, payload) {
      if (typeof schemaKey === 'number') {
        schemaKey = schemaKey.toString();
      }

      if (typeof schemaKey !== 'string' || (typeof payload !== 'object' && payload !== null)) {
        throw error('"update" called with the incorrect arguments. Check the docs for details.');
      }

      const payload_ =
        typeof payload === 'object'
          ? Object.assign({}, payload, {
              '__meta__/lastModifiedBy': get(authService_, 'currentUser.uid', 'UNKNOWN'),
              '__meta__/lastModifiedDate': new Date().toISOString(),
              id: schemaKey
            })
          : payload;

      return schemasAPI.ref(schemaKey).update(payload_);
    },

    /**
     * @description The simplest way to delete a schema.
     * @param {String} schemaKey
     * @returns {Promise}
     */
    remove(schemaKey) {
      if (typeof schemaKey === 'number') {
        schemaKey = schemaKey.toString();
      }

      if (typeof schemaKey !== 'string') {
        throw error('"remove" called with the incorrect arguments. Check the docs for details.');
      }
      return schemasAPI.ref(schemaKey).remove();
    },

    /**
     * @description Transactional operation
     * https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction
     * @param {String} schemaKey
     * @param {Function} updateFn
     * @param {Function} [cb=() => {}]
     * @returns
     */
    transaction(schemaKey, updateFn, cb = () => {}) {
      if (typeof schemaKey === 'number') {
        schemaKey = schemaKey.toString();
      }

      if (typeof schemaKey !== 'string' || typeof updateFn !== 'function') {
        throw error(
          '"transaction" called with the incorrect arguments. Check the docs for details.'
        );
      }

      return schemasAPI.ref(schemaKey).transaction(updateFn, cb);
    }
  };

  const settingsAPI = {
    /**
     * Establish and return a reference to section in firebase db
     *
     * @param {String} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      return databaseService_.ref(getSettingsRefPath(ref));
    },

    /**
     * @description Get snapshot for given settings reference
     * @param {String} settingsRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(settingsRef, options = {}) {
      const ref = typeof settingsRef === 'string' ? settingsRef : null;
      const opts = typeof settingsRef === 'string' ? options : settingsRef || {};
      const ordered = applyOrderBy(settingsAPI.ref(ref), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once(opts.event || 'value');
    },

    /**
     * Read value once from db
     *
     * @param {String} settingsRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(settingsRef, options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const snapshot = await settingsAPI.getRaw(settingsRef, options);
      const value = options.needsWrap ? { [settingsRef]: snapshot.val() } : snapshot.val();
      const result = await compose(pluckFields)(value);
      return options.needsWrap ? result[settingsRef] : result;
    },

    /**
     * Sets the locale to be used for the flamelink app
     *
     * @param {String} locale The locale to set
     * @returns {Promise} Resolves to given locale if it is a supported locale, otherwise it rejects
     */
    async setLocale(locale = locale_) {
      const snapshot = await databaseService_.ref('/flamelink/settings/locales').once('value');
      const supportedLocales_ = snapshot.val();

      if (!supportedLocales_) {
        throw error('No supported locales found.');
      }

      if (!supportedLocales_.includes(locale)) {
        throw error(
          `"${locale}" is not a supported locale. Supported Locales: ${supportedLocales_.join(
            ', '
          )}`
        );
      }

      locale_ = locale;

      return locale_;
    },

    /**
     * Returns the set locale for the flamelink app
     *
     * @returns {Promise} Resolves with locale (just using promise for consistency and allowing us to make this async in the future)
     */
    async getLocale() {
      return locale_;
    },

    /**
     * Sets the environment to be used for the flamelink app
     *
     * @param {String} env The environment to set
     * @returns {Promise} Resolves to given environment if it is a supported environment, otherwise it rejects
     */
    async setEnvironment(env = env_) {
      const snapshot = await databaseService_.ref('/flamelink/settings/environments').once('value');
      const supportedEnvironments_ = snapshot.val();

      if (!supportedEnvironments_) {
        throw error(`No supported environments found.`);
      }

      if (
        (isArray(supportedEnvironments_) && !supportedEnvironments_.includes(env)) ||
        (!isArray(supportedEnvironments_) && !keys(supportedEnvironments_).includes(env))
      ) {
        throw error(
          `"${env}" is not a supported environment. Supported Environments: ${supportedEnvironments_.join(
            ', '
          )}`
        );
      }

      env_ = env;

      return env_;
    },

    /**
     * Returns the set environment for the flamelink app
     *
     * @returns {Promise} Resolves with environment (just using promise for consistency and allowing us to make this async in the future)
     */
    async getEnvironment() {
      return env_;
    },

    /**
     * Returns the set image sizes for the flamelink app
     *
     * @returns {Promise} Resolves with array of image size objects
     */
    async getImageSizes(options = {}) {
      return settingsAPI.get('general/imageSizes', options);
    },

    /**
     * Returns the ID of the default permissions group for the flamelink app
     *
     * @returns {Promise} Resolves with ID of permissions group
     */
    async getDefaultPermissionsGroup(options = {}) {
      return settingsAPI.get('general/defaultPermissionsGroup', options);
    },

    /**
     * Returns the global meta data for the flamelink app
     *
     * @returns {Promise} Resolves with globals object
     */
    async getGlobals(options = {}) {
      return settingsAPI.get('globals', Object.assign({}, options, { needsWrap: true }));
    }
  };

  const storageAPI = {
    /**
     * @description Get the folder ID for a given folder name using an optional fallback folder name
     * @param {string} [folderName='']
     * @param {string} [fallback='Root']
     * @returns {string} folderId
     * @private
     */
    async _getFolderId(folderName = '', fallback = 'Root') {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      const foldersSnapshot = await databaseService_.ref(getFolderRefPath()).once('value');
      const folders = foldersSnapshot.val();
      const folder = find(folders, { name: folderName });

      if (!folder) {
        const fallbackFolder = find(folders, { name: fallback }) || {};
        return fallbackFolder.id;
      }

      return folder.id;
    },

    /**
     * @description Get the folder ID for a given options object. If the ID is given it is simply returned, otherwise it
     * try and deduce it from a given folder name or falling back to the ID for the "Root" directory
     * @param {any} [options={}]
     * @returns {promise} Resolves to the folder ID
     * @private
     */
    async _getFolderIdFromOptions(options = {}) {
      const { folderId, folderName, folderFallback } = options;

      if (folderId) {
        return folderId;
      }

      return storageAPI._getFolderId(folderName, folderFallback);
    },

    /**
     * @description Writes the file meta to the Firebase real-time db. Not intended as a public method.
     * Used internally by the `upload` method.
     * @param {object} [payload={}]
     * @returns {promise}
     * @private
     */
    _setFile(payload = {}) {
      const payload_ =
        typeof payload === 'object'
          ? Object.assign({}, payload, {
              __meta__: {
                createdBy: get(authService_, 'currentUser.uid', 'UNKNOWN'),
                createdDate: new Date().toISOString()
              }
            })
          : payload;

      return storageAPI.fileRef(payload.id).set(payload_);
    },

    /**
     * @description Resizes a given file to the size provided in the options config. Not for public use.
     * User internally by the `upload` method.
     * @param {File} file
     * @param {string} filename
     * @param {object} options
     * @returns {promise}
     * @private
     */
    async _createSizedImage(file, filename, options = {}) {
      if (options && (options.path || options.width || options.maxWidth)) {
        const resizedImage = await resizeImage(file, options);
        return storageAPI
          .ref(filename, { path: options.path, width: options.width || options.maxWidth })
          .put(resizedImage);
      }
      throw error(
        `Invalid size object supplied - please refer to https://flamelink.github.io/flamelink/#/storage?id=upload for more details on upload options.\nImage upload for supplied size skipped for file: ${filename}`
      );
    },

    /**
     * @description Establish and return a reference to section in cloud storage bucket
     * @param {String} filename
     * @returns {Object} Ref object
     */
    ref(filename, options = {}) {
      if (!storageService_) {
        throw error(
          'The Storage service is not available. Make sure the "storageBucket" property is provided.'
        );
      }

      // Check if the filename is a URL (contains "://")
      if (/:\/\//.test(filename)) {
        if (isAdminApp_) {
          throw error('Retrieving files from URL is not supported for the admin SDK');
        }
        return storageService_.refFromURL(filename);
      }
      return isAdminApp_
        ? storageService_.bucket().file(getStorageRefPath(filename, options))
        : storageService_.ref(getStorageRefPath(filename, options));
    },

    /**
     * @description Establish and return a reference to a folder in the real-time db
     * @param {String} folderID
     */
    folderRef(folderID) {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      return databaseService_.ref(getFolderRefPath(folderID));
    },

    /**
     * @description Establish and return a reference to a file in the real-time db
     * @param {String} fileId
     */
    fileRef(fileId) {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      return databaseService_.ref(getFileRefPath(fileId));
    },

    /**
     * @description Establish and return a reference to the media directory in the real-time db
     * @param {String} [mediaRef] Optional media reference
     */
    mediaRef(mediaRef) {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      return databaseService_.ref(getMediaRefPath(mediaRef));
    },

    /**
     * Read all or an individual media from the db and return snapshot response
     *
     * @param {String} [mediaRef] The media's key in the db
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(mediaRef, options = {}) {
      const ref = typeof mediaRef === 'string' ? mediaRef : null;
      const opts = typeof mediaRef === 'string' ? options : mediaRef || {};
      const ordered = applyOrderBy(storageAPI.mediaRef(ref), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once(opts.event || 'value');
    },

    /**
     * Get all medias or an individual media object for the given reference
     *
     * @param {String} mediaRef The media's key in the db
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(mediaRef, options = {}) {
      if (typeof mediaRef === 'string') {
        // Single media
        const pluckFields = pluckResultFields(options.fields);

        const snapshot = await storageAPI.getRaw(mediaRef, options);
        const media = snapshot.val();
        const wrapValue = { [mediaRef]: media }; // Wrapping value to create the correct structure for our filtering to work
        return pluckFields(wrapValue)[mediaRef];
      }

      // All medias
      options = mediaRef || {};

      const pluckFields = pluckResultFields(options.fields);
      const snapshot = await storageAPI.getRaw(null, options);
      const media = snapshot.val();
      return pluckFields(media);
    },

    /**
     * @description Establish stream to read value consistently from db, returning the raw snapshot
     * @param {String} [mediaKey]
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    subscribeRaw(mediaKey, options = {}, cb) {
      // Single media
      if (typeof mediaKey === 'string') {
        if (!cb) {
          cb = options; // second param is then the callback
          options = {}; // set default options
        }

        const ordered = applyOrderBy(storageAPI.mediaRef(mediaKey), options);
        const filtered = applyFilters(ordered, options);

        return filtered.on(options.event || 'value', cb);
      }

      // All medias
      cb = options;
      options = mediaKey || {};

      if (typeof cb === 'object') {
        cb = mediaKey; // first param is then the callback
        options = {}; // set default options
      }

      const ordered = applyOrderBy(storageAPI.mediaRef(null), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on(options.event || 'value', cb);
    },

    /**
     * @description Establish stream to read value consistently from db, returning the processed value
     * @param {String} [mediaKey]
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    subscribe(mediaKey, options = {}, cb) {
      try {
        // Single media
        if (typeof mediaKey === 'string') {
          if (!cb || typeof options === 'function') {
            cb = options; // second param is then the callback
            options = {}; // set default options
          }

          const pluckFields = pluckResultFields(options.fields);

          return storageAPI.subscribeRaw(mediaKey, options, async snapshot => {
            const wrappedMedia = await compose(pluckFields)({ [mediaKey]: snapshot.val() });
            const media = wrappedMedia[mediaKey];
            return cb(null, media); // Error-first callback
          });
        }

        // All medias
        cb = options;
        options = mediaKey || {};

        if (typeof cb === 'object') {
          cb = mediaKey; // first param is then the callback
          options = {}; // set default options
        }

        const pluckFields = pluckResultFields(options.fields);

        return storageAPI.subscribeRaw(options, async snapshot => {
          const pluckedMedia = await compose(pluckFields)(snapshot.val());

          cb(null, pluckedMedia); // Error-first callback
        });
      } catch (err) {
        return cb(err);
      }
    },

    /**
     * @description Detach listeners from given reference.
     * @param {String} mediaKey
     * @param {String} event
     * @returns {Promise}
     */
    unsubscribe(...args) {
      if (args.length === 2) {
        // Is second arg a valid firebase child event?
        if (ALLOWED_CHILD_EVENTS.includes(args[1])) {
          // args[0] = mediaKey
          // args[1] = event
          return storageAPI.mediaRef(args[0]).off(args[1]);
        }

        throw error(`"${args[1]}" is not a valid child event`);
      }

      if (args.length === 1) {
        return storageAPI.mediaRef(args[0]).off();
      }

      throw error(
        '"unsubscribe" method needs to be called with min 1 argument and max 2 arguments'
      );
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFoldersRaw(options = {}) {
      const ordered = applyOrderBy(storageAPI.folderRef(), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Read value once from db
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFolders(options = {}) {
      const pluckFields = pluckResultFields(options.fields);
      const structureItems = formatStructure(options.structure, {
        idProperty: 'id',
        parentProperty: 'parentId'
      });
      const snapshot = await storageAPI.getFoldersRaw(options);
      return compose(pluckFields, structureItems, values)(snapshot.val());
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {String} fileId
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFileRaw(fileId, options = {}) {
      if (!fileId) {
        throw error('"storage.getFileRaw()" should be called with at least the file ID');
      }
      const ordered = applyOrderBy(storageAPI.fileRef(fileId), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * @description Read the file object from the database
     * @param {String} fileId
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFile(fileId, options = {}) {
      if (!fileId) {
        throw error('"storage.getFile()" should be called with at least the file ID');
      }
      const pluckFields = pluckResultFields(options.fields);
      const snapshot = await storageAPI.getFileRaw(fileId, options);
      const wrapValue = { [fileId]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
      const file = await compose(pluckFields)(wrapValue);
      return file[fileId];
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFilesRaw(options = {}) {
      const ordered = applyOrderBy(storageAPI.fileRef(), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Read value once from db
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFiles(options = {}) {
      const defaultOptions = { folderFallback: null };
      const opts = Object.assign(
        defaultOptions,
        options,
        options.mediaType
          ? {
              orderByChild: 'type',
              equalTo: options.mediaType
            }
          : {}
      );
      const folderId = await storageAPI._getFolderIdFromOptions(opts);
      const filterFolders = filterByFolderId(folderId);
      const pluckFields = pluckResultFields(opts.fields);
      const snapshot = await storageAPI.getFilesRaw(opts);
      return compose(pluckFields, filterFolders)(snapshot.val());
    },

    /**
     * @description Given a fileId, return the download URL
     * @param {String} fileId
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to download URL string
     */
    async getURL(fileId, options = {}) {
      if (!fileId) {
        throw error('"storage.getURL()" should be called with at least the file ID');
      }
      const { size } = options;
      const file = await storageAPI.getFile(fileId, options);

      if (!file) {
        return file;
      }
      const { file: filename, sizes: availableFileSizes } = file || {};
      const storageRefArgs = [filename];

      const getImagePathByClosestSize = minSize => {
        const smartWidth = availableFileSizes
          .map(
            availableSize =>
              Object.assign({}, availableSize, {
                width: parseInt(availableSize.width || availableSize.maxWidth, 10)
              }),
            []
          )
          .sort((a, b) => a.width - b.width) // sort widths ascending
          .find(availableSize => availableSize.width >= minSize);

        if (smartWidth) {
          storageRefArgs.push(smartWidth);
        } else {
          console.warn(
            `[FLAMELINK]: The provided size (${size}) has been ignored because it did not match any of the given file's available sizes.\nAvailable sizes: ${availableFileSizes
              .map(availableSize => availableSize.width)
              .join(', ')}`
          );
        }
      };

      if (typeof size === 'object') {
        const { width, height, quality } = size;

        if (
          typeof width !== 'undefined' &&
          typeof height !== 'undefined' &&
          typeof quality !== 'undefined'
        ) {
          size.path = `${width}_${height}_${Math.round(parseFloat(quality, 10) * 100)}`;
        }

        // For images with `path` value
        if (size.path && availableFileSizes && get(availableFileSizes, '[0].path')) {
          if (availableFileSizes.find(({ path: filePath }) => filePath === size.path)) {
            storageRefArgs.push({ path: size.path });
          } else {
            console.warn(
              `[FLAMELINK]: The provided path (${size.path}) has been ignored because it did not match any of the given file's available paths.\nAvailable paths: ${availableFileSizes
                .map(availableSize => availableSize.path)
                .join(', ')}`
            );
          }
        } else if (width && availableFileSizes && availableFileSizes.length) {
          getImagePathByClosestSize(width);
        }
      } else if (size && availableFileSizes && availableFileSizes.length) {
        // This part is for the special 'device' use case and for the legacy width setting
        const minSize = size === 'device' ? getScreenResolution() : size;
        getImagePathByClosestSize(minSize);
      }

      const fileRef = await storageAPI.ref(...storageRefArgs);

      if (isAdminApp_) {
        const signedUrls = await fileRef.getSignedUrl({
          action: 'read',
          expires: '01-01-2500' // Just expire at some very far time in the future
        });
        return get(signedUrls, '[0]', '');
      }
      return fileRef.getDownloadURL();
    },

    /**
     * @description Get the Google Cloud Storage Bucket metadata for a given file
     * @param {String|Number} fileId
     * @returns {Promise}
     */
    async getMetadata(fileId, options = {}) {
      if (!fileId) {
        throw error('"storage.getMetadata()" should be called with at least the file ID');
      }

      const file = await storageAPI.getFile(fileId, options);

      if (!file) {
        throw error(`There is no file for File ID: "${fileId}"`);
      }

      const { file: filename } = file;

      return storageAPI.ref(filename).getMetadata();
    },

    /**
     * @description Update the Google Cloud Storage Bucket metadata for a given file
     * @param {String|Number} fileId
     * @param {Object|Null} payload
     * @returns {Promise}
     */
    async updateMetadata(fileId, payload = {}) {
      if (!fileId) {
        throw error('"storage.updateMetadata()" should be called with at least the file ID');
      }

      const file = await storageAPI.getFile(fileId);

      if (!file) {
        throw error(`There is no file for File ID: "${fileId}"`);
      }

      const { file: filename } = file;

      return storageAPI.ref(filename).updateMetadata(payload);
    },

    /**
     * @description Delete a given file from the Cloud Storage Bucket as well as the real-time db
     * @param {String|Number} fileId
     * @returns {Promise}
     */
    async deleteFile(fileId, options = {}) {
      if (isAdminApp_) {
        throw error('"storage.deleteFile()" is not currently supported for server-side use.');
      }

      if (!fileId) {
        throw error('"storage.deleteFile()" should be called with at least the file ID');
      }

      const file = await storageAPI.getFile(fileId, options);

      if (!file) {
        return file;
      }

      const { file: filename, sizes } = file;
      const storageRef = storageAPI.ref(filename);

      // Delete original file from storage bucket
      await storageRef.delete();

      // If sizes are set, delete all the resized images here
      if (Array.isArray(sizes)) {
        await Promise.all(
          sizes.map(async size => {
            const width = size.width || size.maxWidth;
            const { path } = size;

            if (!width && !path) {
              return Promise.resolve();
            }

            return storageAPI.ref(filename, { width, path }).delete();
          })
        );
      }

      // Delete file entry from the real-time db
      return storageAPI.fileRef(fileId).remove();
    },

    /**
     * @description Upload a given file to the Cloud Storage Bucket as well as the real-time db
     * @param {String|File|Blob|Uint8Array} fileData
     * @param {Object} [options={}]
     * @returns {Object} UploadTask instance, which is similar to a Promise and an Observable
     */
    async upload(fileData, options = {}) {
      if (isAdminApp_) {
        throw error('"storage.upload()" is not currently supported for server-side use.');
      }
      const { sizes: userSizes, overwriteSizes } = options;
      const settingsImageSizes = await settingsAPI.getImageSizes();

      if (!userSizes && !overwriteSizes) {
        set(options, 'sizes', settingsImageSizes || []);
      } else if (userSizes && userSizes.length && !overwriteSizes) {
        set(options, 'sizes', [...settingsImageSizes, ...userSizes] || []);
      }

      // Ensure image size with width DEFAULT_REQUIRED_IMAGE_SIZE exists
      // Flamelink CMS expects file to reside in `240` folder, so size if only `width: 240` should be passed
      if (
        !options.sizes ||
        ((options.sizes && options.sizes.length === 0) ||
          (Array.isArray(options.sizes) &&
            options.sizes.filter(
              size =>
                (size.width === DEFAULT_REQUIRED_IMAGE_SIZE ||
                  size.maxWidth === DEFAULT_REQUIRED_IMAGE_SIZE) &&
                !size.height &&
                !size.quality
            ).length === 0))
      ) {
        if (Array.isArray(options.sizes)) {
          options.sizes.push({ width: DEFAULT_REQUIRED_IMAGE_SIZE });
        } else {
          set(options, 'sizes', [{ width: DEFAULT_REQUIRED_IMAGE_SIZE }]);
        }
      }

      const id = Date.now().toString();
      const metadata = get(options, 'metadata', {});
      const filename =
        (typeof fileData === 'object' && fileData.name) || typeof metadata.name === 'string'
          ? `${id}_${metadata.name || fileData.name}`
          : id;
      const storageRef = storageAPI.ref(filename, options);
      const updateMethod = typeof fileData === 'string' ? 'putString' : 'put';
      const args = [fileData];

      let folderId = await storageAPI._getFolderIdFromOptions(options);

      if (typeof folderId === 'number') {
        folderId = folderId.toString();
      }

      set(options, 'metadata.customMetadata.flamelinkFileId', id);
      set(options, 'metadata.customMetadata.flamelinkFolderId', folderId);
      args.push(options.metadata);

      // TODO: Test and verify how the Firebase SDK handles string uploads with encoding and metadata
      // Is it the second argument then or should it be passed along with the metadata object?
      if (updateMethod === 'putString' && options.stringEncoding) {
        args.splice(1, 0, options.stringEncoding);
      }

      // Upload original file to storage bucket
      const uploadTask = storageRef[updateMethod](...args);
      const snapshot = await uploadTask;

      const mediaType = /^image\//.test(get(snapshot, 'metadata.contentType')) ? 'images' : 'files';
      const filePayload = {
        id,
        file: get(snapshot, 'metadata.name', ''),
        folderId,
        type: mediaType,
        contentType: get(snapshot, 'metadata.contentType', '')
      };

      // If mediaType === 'images', file is resizeable and sizes/widths are set, resize images here
      if (mediaType === 'images' && updateMethod === 'put' && Array.isArray(options.sizes)) {
        filePayload.sizes = options.sizes.map(size => {
          const { width, height, quality } = size;
          if (
            typeof width !== 'undefined' &&
            typeof height !== 'undefined' &&
            typeof quality !== 'undefined'
          ) {
            return Object.assign({}, size, {
              path: `${width}_${height}_${Math.round(quality * 100)}`
            });
          }
          return size;
        });

        await Promise.all(
          filePayload.sizes.map(size => storageAPI._createSizedImage(fileData, filename, size))
        );
      }

      // Write to db
      await storageAPI._setFile(filePayload);

      return uploadTask;
    }
  };

  const contentAPI = {
    /**
     * @description Establish and return a reference to section in firebase db
     * @param {String|String[]} ref
     * @returns {Object} Ref object
     */
    ref(ref) {
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

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
        const ordered = applyOrderBy(contentAPI.ref([`${contentRef}`, `${entryRef}`]), options);
        const filtered = applyFilters(ordered, options);

        return filtered.once(options.event || 'value');
      }

      // Query all entries for given content type
      const ref = typeof contentRef === 'string' ? contentRef : null;
      const opts = typeof contentRef === 'string' ? entryRef || {} : contentRef || {};

      const ordered = applyOrderBy(contentAPI.ref(ref), opts);
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
        const populateFields = populateEntry(
          schemasAPI,
          contentAPI,
          storageAPI,
          contentRef,
          options.populate
        );
        const snapshot = await contentAPI.getRaw(contentRef, entryRef, options);
        const wrapValue = { [entryRef]: snapshot.val() }; // Wrapping value to create the correct structure for our filtering to work
        const result = await compose(populateFields, pluckFields)(wrapValue);
        return result[entryRef];
      }

      const schema = await schemasAPI.get(contentRef);
      const isSingleType = schema && schema.type === 'single';

      // Query all entries for given content type
      const ref = typeof contentRef === 'string' ? contentRef : null;
      const opts = typeof contentRef === 'string' ? entryRef || {} : contentRef || {};

      const pluckFields = pluckResultFields(opts.fields);
      const populateFields = populateEntry(
        schemasAPI,
        contentAPI,
        storageAPI,
        contentRef,
        opts.populate
      );
      const snapshot = await contentAPI.getRaw(ref, opts);
      // If content type is a single, we need to wrap the object for filters to work correctly
      if (ref) {
        const value = isSingleType ? { [ref]: snapshot.val() } : snapshot.val();
        const result = await compose(populateFields, pluckFields)(value);
        return isSingleType ? result[ref] : result;
      }

      const withLocales = snapshot.val();
      const currentLocale = locale_; // TODO: Look at getting from API method

      const withoutLocales = keys(withLocales).reduce(
        (menus, key) => Object.assign({}, menus, { [key]: withLocales[key][currentLocale] }),
        {}
      );

      const result = await compose(populateFields, pluckFields)(withoutLocales);
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
      return contentAPI.getRaw(contentRef, opts);
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
      return contentAPI.get(contentRef, opts);
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

        const ordered = applyOrderBy(contentAPI.ref(contentRef).child(entryRef), options);
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
      } else if (typeof contentRef === 'function') {
        cb = contentRef; // first param is then the callback
        options = {}; // set default options
        contentRef = null;
      } else {
        throw error('Check out the docs for the required parameters for this method');
      }

      const ordered = applyOrderBy(contentAPI.ref(contentRef), options);
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
    async subscribe(contentRef, entryRef, options = {}, cb) {
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
            storageAPI,
            contentRef,
            options.populate
          );

          return contentAPI.subscribeRaw(contentRef, entryRef, options, async snapshot => {
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
        } else if (typeof contentRef === 'function') {
          cb = contentRef; // first param is then the callback
          options = {}; // set default options
          contentRef = null;
        } else {
          throw error('Check out the docs for the required parameters for this method');
        }

        const schema = await schemasAPI.get(contentRef);
        const isSingleType = schema && schema.type === 'single';
        const pluckFields = pluckResultFields(options.fields);
        const populateFields = populateEntry(
          schemasAPI,
          contentAPI,
          storageAPI,
          contentRef,
          options.populate
        );

        return contentAPI.subscribeRaw(contentRef, options, async snapshot => {
          // If content type is a single, we need to wrap the object for filters to work correctly
          if (contentRef) {
            const value = isSingleType ? { [contentRef]: snapshot.val() } : snapshot.val();
            const result = await compose(populateFields, pluckFields)(value);
            cb(null, isSingleType ? result[contentRef] : result); // Error-first callback
            return;
          }

          const withLocales = snapshot.val();
          const currentLocale = locale_; // TODO: Look at getting from API method

          const withoutLocales = keys(withLocales).reduce(
            (menus, key) => Object.assign({}, menus, { [key]: withLocales[key][currentLocale] }),
            {}
          );

          const result = await compose(populateFields, pluckFields)(withoutLocales);
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
        return contentAPI
          .ref(args[0])
          .child(args[1])
          .off(args[2]);
      }

      if (args.length === 2) {
        // Is second arg a valid firebase child event?
        if (ALLOWED_CHILD_EVENTS.includes(args[1])) {
          // args[0] = contentRef
          // args[1] = event
          return contentAPI.ref(args[0]).off(args[1]);
        }

        // args[0] = contentRef
        // args[1] = entryRef
        return contentAPI
          .ref(args[0])
          .child(args[1])
          .off();
      }

      if (args.length === 1) {
        return contentAPI.ref(args[0]).off();
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
     * @param {String} [entryRef]
     * @param {Object} payload
     * @returns {Promise}
     */
    async set(contentRef, entryRef, payload) {
      const schema = await schemasAPI.get(contentRef);
      const isSingleType = schema && schema.type === 'single';

      let payload_ = isSingleType ? entryRef : payload;

      if (
        (isSingleType &&
          (typeof contentRef !== 'string' ||
            (typeof payload_ !== 'object' && payload_ !== null))) ||
        (!isSingleType &&
          (typeof contentRef !== 'string' ||
            typeof entryRef !== 'string' ||
            (typeof payload_ !== 'object' && payload_ !== null)))
      ) {
        throw error('"set" called with the incorrect arguments. Check the docs for details.');
      }

      const { fields = [] } = schema;
      const constraints = fields.reduce(
        (rules, field) =>
          Object.assign({}, rules, { [field.key]: prepConstraintsForValidate(field.constraints) }),
        {}
      );
      const validationErrors = validate(payload_, constraints);

      if (validationErrors) {
        return Promise.reject(validationErrors);
      }

      const fieldKeys = fields.map(field => field.key);
      const pickFields = pick(fieldKeys);

      if (typeof payload_ === 'object') {
        payload_ = Object.assign({}, pickFields(payload_), {
          __meta__: {
            createdBy: get(authService_, 'currentUser.uid', 'UNKNOWN'),
            createdDate: new Date().toISOString()
          },
          id: isSingleType ? contentRef : entryRef
        });
      }

      if (isSingleType) {
        return contentAPI.ref(contentRef).set(payload_);
      }

      return contentAPI
        .ref(contentRef)
        .child(entryRef)
        .set(payload_);
    },

    /**
     * Simultaneously write to specific children of a node without overwriting other child nodes.
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @param {Object} payload
     * @returns {Promise}
     */
    async update(contentRef, entryRef, payload) {
      if (typeof entryRef === 'number') {
        entryRef = entryRef.toString();
      }

      const schema = await schemasAPI.get(contentRef);
      const isSingleType = schema && schema.type === 'single';

      let payload_ = isSingleType ? entryRef : payload;

      if (
        (isSingleType &&
          (typeof contentRef !== 'string' ||
            (typeof payload_ !== 'object' && payload_ !== null))) ||
        (!isSingleType &&
          (typeof contentRef !== 'string' ||
            typeof entryRef !== 'string' ||
            (typeof payload_ !== 'object' && payload_ !== null)))
      ) {
        throw error('"update" called with the incorrect arguments. Check the docs for details.');
      }

      const { fields = [] } = schema;

      const constraints = fields.reduce(
        (rules, field) =>
          Object.assign({}, rules, { [field.key]: prepConstraintsForValidate(field.constraints) }),
        {}
      );

      const validationErrors = keys(payload_).reduce((errors_, attr) => {
        const error_ = validate.single(payload_[attr], constraints[attr]);
        if (error_) {
          return Object.assign({}, errors_, { [attr]: error_ });
        }

        return errors_;
      }, {});

      const fieldKeys = fields.map(field => field.key);
      const pickFields = pick(fieldKeys);

      if (keys(validationErrors).length) {
        return Promise.reject(validationErrors);
      }

      if (typeof payload_ === 'object') {
        payload_ = Object.assign({}, pickFields(payload_), {
          '__meta__/lastModifiedBy': get(authService_, 'currentUser.uid', 'UNKNOWN'),
          '__meta__/lastModifiedDate': new Date().toISOString(),
          id: isSingleType ? contentRef : entryRef
        });
      }

      if (isSingleType) {
        return contentAPI.ref(contentRef).update(payload_);
      }

      return contentAPI
        .ref(contentRef)
        .child(entryRef)
        .update(payload_);
    },

    /**
     * The simplest way to delete data for a given reference.
     *
     * @param {String} contentRef
     * @param {String} entryRef
     * @returns {Promise}
     */
    remove(contentRef, entryRef) {
      if (typeof entryRef === 'number') {
        entryRef = entryRef.toString();
      }

      if (typeof contentRef !== 'string' || typeof entryRef !== 'string') {
        throw error('"remove" called with the incorrect arguments. Check the docs for details.');
      }
      return contentAPI
        .ref(contentRef)
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
      if (typeof entryRef === 'number') {
        entryRef = entryRef.toString();
      }

      if (
        typeof contentRef !== 'string' ||
        typeof entryRef !== 'string' ||
        typeof updateFn !== 'function'
      ) {
        throw error(
          '"transaction" called with the incorrect arguments. Check the docs for details.'
        );
      }

      return contentAPI
        .ref(contentRef)
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
      if (!databaseService_) {
        throw error(
          'The Database service is not available. Make sure the "databaseURL" property is provided.'
        );
      }

      return databaseService_.ref(getNavigationRefPath(ref, env_, locale_));
    },

    /**
     * @description Get snapshot for given navigation ID/reference
     * @param {String} navRef
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getRaw(navRef, options = {}) {
      const ref = typeof navRef === 'string' ? navRef : null;
      const opts = typeof navRef === 'string' ? options : navRef || {};
      const ordered = applyOrderBy(navigationAPI.ref(ref), opts);
      const filtered = applyFilters(ordered, opts);

      return filtered.once(opts.event || 'value');
    },

    /**
     * @description Get navigation object for given navigation ID/reference
     * @param {String} [navRef]
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async get(navRef, options = {}) {
      if (typeof navRef === 'string') {
        // Single menu
        const snapshot = await navigationAPI.getRaw(navRef, options);
        const wrappedNav = await pluckResultFields(options.fields, { [navRef]: snapshot.val() });
        const nav = wrappedNav[navRef];

        // Only try and structure items if items weren't plucked out
        if (nav && nav.hasOwnProperty('items')) {
          return Object.assign({}, nav, {
            items: formatStructure(
              options.structure,
              {
                idProperty: 'uuid',
                parentProperty: 'parentIndex'
              },
              nav.items
            )
          });
        }

        return nav;
      }

      // All menus
      const opts = navRef || {};
      const snapshot = await navigationAPI.getRaw(opts);

      const withLocales = snapshot.val();
      const currentLocale = locale_; // TODO: Look at getting from API method

      const withoutLocales = keys(withLocales).reduce(
        (menus, key) => Object.assign({}, menus, { [key]: withLocales[key][currentLocale] }),
        {}
      );

      const pluckedMenus = await pluckResultFields(opts.fields, withoutLocales);

      return keys(pluckedMenus).reduce((menus, key) => {
        const nav = pluckedMenus[key];

        // Only try and structure items if items weren't plucked out
        if (nav && nav.hasOwnProperty('items')) {
          const structuredNav = Object.assign({}, nav, {
            items: formatStructure(
              opts.structure,
              {
                idProperty: 'uuid',
                parentProperty: 'parentIndex'
              },
              nav.items
            )
          });

          return Object.assign({}, menus, { [key]: structuredNav });
        }

        return Object.assign({}, menus, { [key]: nav });
      }, {});
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

      const ordered = applyOrderBy(navigationAPI.ref(navRef).child('items'), options);
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
      const structureItems = formatStructure(options.structure, {
        idProperty: 'uuid',
        parentProperty: 'parentIndex'
      });
      const snapshot = await navigationAPI.getItemsRaw(navRef, options);
      return compose(pluckFields, structureItems)(snapshot.val());
    },

    /**
     * @description Establish stream to read value consistently from db, returning the raw snapshot
     * @param {String} [navRef]
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to snapshot of query
     */
    subscribeRaw(navRef, options = {}, cb) {
      // Single menu
      if (typeof navRef === 'string') {
        if (!cb) {
          cb = options; // second param is then the callback
          options = {}; // set default options
        }

        const ordered = applyOrderBy(navigationAPI.ref(navRef), options);
        const filtered = applyFilters(ordered, options);

        return filtered.on(options.event || 'value', cb);
      }

      // All menus
      cb = options;
      options = navRef;

      if (typeof cb === 'object') {
        cb = navRef; // first param is then the callback
        options = {}; // set default options
      }

      const ordered = applyOrderBy(navigationAPI.ref(null), options);
      const filtered = applyFilters(ordered, options);

      return filtered.on(options.event || 'value', cb);
    },

    /**
     * @description Establish stream to read value consistently from db, returning the processed value
     * @param {String} [navRef]
     * @param {Object} [options={}]
     * @param {Function} cb
     * @returns {Promise} Resolves to value of query
     */
    subscribe(navRef, options = {}, cb) {
      try {
        // Single Menu
        if (typeof navRef === 'string') {
          if (!cb || typeof options === 'function') {
            cb = options; // second param is then the callback
            options = {}; // set default options
          }

          const pluckFields = pluckResultFields(options.fields);

          return navigationAPI.subscribeRaw(navRef, options, async snapshot => {
            const wrappedNav = await compose(pluckFields)({ [navRef]: snapshot.val() });
            const nav = wrappedNav[navRef];

            // Only try and structure items if items weren't plucked out
            if (nav && nav.hasOwnProperty('items')) {
              nav.items = formatStructure(
                options.structure,
                {
                  idProperty: 'uuid',
                  parentProperty: 'parentIndex'
                },
                nav.items
              );
            }

            return cb(null, nav); // Error-first callback
          });
        }

        // All menus
        cb = options;
        options = navRef;

        if (typeof cb === 'object') {
          cb = navRef; // first param is then the callback
          options = {}; // set default options
        }

        const pluckFields = pluckResultFields(options.fields);

        return navigationAPI.subscribeRaw(options, async snapshot => {
          const withLocales = snapshot.val();
          const currentLocale = locale_; // TODO: Look at getting from API method

          const withoutLocales = keys(withLocales).reduce(
            (menus, key) => Object.assign({}, menus, { [key]: withLocales[key][currentLocale] }),
            {}
          );

          const pluckedMenus = await compose(pluckFields)(withoutLocales);

          const result = keys(pluckedMenus).reduce((menus, key) => {
            const nav = pluckedMenus[key];

            // Only try and structure items if items weren't plucked out
            if (nav && nav.hasOwnProperty('items')) {
              const structuredNav = Object.assign({}, nav, {
                items: formatStructure(
                  options.structure,
                  {
                    idProperty: 'uuid',
                    parentProperty: 'parentIndex'
                  },
                  nav.items
                )
              });

              return Object.assign({}, menus, { [key]: structuredNav });
            }

            return Object.assign({}, menus, { [key]: nav });
          }, {});

          cb(null, result); // Error-first callback
        });
      } catch (err) {
        return cb(err);
      }
    },

    /**
     * @description Detach listeners from given reference.
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
          return navigationAPI.ref(args[0]).off(args[1]);
        }

        throw error(`"${args[1]}" is not a valid child event`);
      }

      if (args.length === 1) {
        return navigationAPI.ref(args[0]).off();
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

      const payload_ =
        typeof payload === 'object'
          ? Object.assign({}, payload, {
              __meta__: {
                createdBy: get(authService_, 'currentUser.uid', 'UNKNOWN'),
                createdDate: new Date().toISOString()
              },
              id: navRef
            })
          : payload;

      return navigationAPI.ref(navRef).set(payload_);
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

      const payload_ =
        typeof payload === 'object'
          ? Object.assign({}, payload, {
              '__meta__/lastModifiedBy': get(authService_, 'currentUser.uid', 'UNKNOWN'),
              '__meta__/lastModifiedDate': new Date().toISOString(),
              id: navRef
            })
          : payload;

      return navigationAPI.ref(navRef).update(payload_);
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
      return navigationAPI.ref(navRef).remove();
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

      return navigationAPI.ref(navRef).transaction(updateFn, cb);
    }
  };

  // Setup listener to get app schemas and cache it
  const start = () => {
    schemasAPI.subscribe(null, (err, schemas) => {
      if (err) {
        return console.error(err);
      }
      return set(CACHE, `schemas[${env_}]`, schemas);
    });
  };

  start();

  // Public API
  return {
    name: firebaseApp_.name,

    firebaseApp: firebaseApp_,

    databaseService: databaseService_,

    storageService: storageService_,

    authService: authService_,

    firestoreService: firestoreService_,

    /**
     * Sets the locale to be used for the flamelink app
     *
     * @param {String} locale The locale to set
     * @returns {Promise} Resolves to given locale if it is a supported locale, otherwise it rejects
     * @deprecated
     */
    setLocale(locale = locale_) {
      deprecate('app.setLocale()', 'Use the "app.settings.setLocale()" method instead.');
      return new Promise((resolve, reject) => {
        databaseService_
          .ref('/flamelink/settings/locales')
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
     * @deprecated
     */
    setEnv(env = env_) {
      deprecate('app.setEnv()', 'Use the "app.settings.setEnv()" method instead.');
      return new Promise((resolve, reject) => {
        databaseService_
          .ref('/flamelink/settings/environments')
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
     * @deprecated
     */
    getLocale() {
      deprecate('app.getLocale()', 'Use the "app.settings.getLocale()" method instead.');
      return Promise.resolve(locale_);
    },

    /**
     * Returns the set environment for the flamelink app
     *
     * @returns {Promise} Resolves with environment (just using promise for consistency and allowing us to make this async in the future)
     * @deprecated
     */
    getEnv() {
      deprecate('app.getEnv()', 'Use the "app.settings.getEnv()" method instead.');
      return Promise.resolve(env_);
    },

    content: contentAPI,

    nav: navigationAPI,

    schemas: schemasAPI,

    storage: storageAPI,

    settings: settingsAPI
  };
}

flamelink.VERSION = __PACKAGE_VERSION__;

// Need to use `module.exports` instead of `export default`, otherwise library is available as { default: flamelink }
module.exports = flamelink;
