import 'regenerator-runtime/runtime';
import * as firebase from 'firebase';
import compose from 'compose-then';
import find from 'lodash/find';
import resizeImage from 'browser-image-resizer';
import './polyfills';
import error from './utils/error';
import {
  applyOrderBy,
  applyFilters,
  getContentRefPath,
  getNavigationRefPath,
  getSchemasRefPath,
  getStorageRefPath,
  getFileRefPath,
  getFolderRefPath,
  pluckResultFields,
  populateEntry,
  filterByFolderId,
  formatStructure,
  getScreenResolution
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
  let firestoreService_ = null;

  const config = Object.assign({}, DEFAULT_CONFIG, conf);

  // Set flamelink specific properties
  let env_ = config.env;
  let locale_ = config.locale;

  // Init firebaseApp if not set of provided
  if (config.firebaseApp) {
    firebaseApp_ = config.firebaseApp;
  } else if (!firebaseApp_) {
    const { apiKey, authDomain, databaseURL, storageBucket, appName } = config;

    if (!apiKey || !authDomain || !databaseURL) {
      throw error(
        'The following config properties are mandatory: "apiKey", "authDomain", "databaseURL"'
      );
    }

    const initArgs = [
      {
        apiKey,
        authDomain,
        databaseURL,
        storageBucket
      }
    ];

    if (appName) {
      initArgs.push(appName);
    }

    firebaseApp_ = firebase.initializeApp(...initArgs);
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
      const opts = entryRef || {}; // second param is then the options

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
      const ref = typeof navRef === 'string' ? navRef : null;
      const opts = typeof navRef === 'string' ? options : navRef || {};
      const ordered = applyOrderBy(this.ref(ref), opts);
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
        const snapshot = await this.getRaw(navRef, options);
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
      const snapshot = await this.getRaw(opts);

      const withLocales = snapshot.val();
      const currentLocale = locale_; // TODO: Look at getting from API method

      const withoutLocales = Object.keys(withLocales).reduce(
        (menus, key) => Object.assign({}, menus, { [key]: withLocales[key][currentLocale] }),
        {}
      );

      const pluckedMenus = await pluckResultFields(opts.fields, withoutLocales);

      return Object.keys(pluckedMenus).reduce((menus, key) => {
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
      const structureItems = formatStructure(options.structure, {
        idProperty: 'uuid',
        parentProperty: 'parentIndex'
      });
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

  const storageAPI = {
    /**
     * @description Get the folder ID for a given folder name using an optional fallback folder name
     *
     * @param {string} [folderName='']
     * @param {string} [fallback='Root']
     * @returns {string} folderId
     * @private
     */
    async _getFolderId(folderName = '', fallback = 'Root') {
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
     *
     * @param {any} [options={}]
     * @returns {promise} Resolves to the folder ID
     * @private
     */
    async _getFolderIdFromOptions(options = {}) {
      const { folderId, folderName, folderFallback } = options;

      if (folderId) {
        return folderId;
      }

      return this._getFolderId(folderName, folderFallback);
    },

    /**
     * @description Writes the file meta to the Firebase real-time db. Not intended as a public method.
     * Used internally by the `upload` method.
     *
     * @param {object} [payload={}]
     * @returns {promise}
     * @private
     */
    _setFile(payload = {}) {
      return this.fileRef(payload.id).set(payload);
    },

    /**
     * @description Resizes a given file to the size provided in the options config. Not for public use.
     * User internally by the `upload` method.
     *
     * @param {File} file
     * @param {string} filename
     * @param {object} options
     * @returns {promise}
     * @private
     */
    async _createSizedImage(file, filename, options) {
      const resizedImage = await resizeImage(file, options);
      return this.ref(filename, { width: options.width || options.maxWidth || 'wrong_size' }).put(
        resizedImage
      );
    },

    /**
     * @description Establish and return a reference to section in cloud storage bucket
     * @param {String} filename
     * @returns {Object} Ref object
     */
    ref(filename, options = {}) {
      // Check if the filename is a URL (contains "://")
      if (/:\/\//.test(filename)) {
        return storageService_.refFromURL(filename);
      }
      return storageService_.ref(getStorageRefPath(filename, options));
    },

    /**
     * @description Establish and return a reference to a folder in the real-time db
     * @param {String} folderID
     */
    folderRef(folderID) {
      return databaseService_.ref(getFolderRefPath(folderID));
    },

    /**
     * Read value once from db and return raw snapshot
     *
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to snapshot of query
     */
    getFoldersRaw(options = {}) {
      const ordered = applyOrderBy(this.folderRef(), options);
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
      const snapshot = await this.getFoldersRaw(options);
      return compose(pluckFields, structureItems, Object.values)(snapshot.val());
    },

    /**
     * @description Establish and return a reference to a file in the real-time db
     * @param {String} fileId
     */
    fileRef(fileId) {
      return databaseService_.ref(getFileRefPath(fileId));
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
      const ordered = applyOrderBy(this.fileRef(fileId), options);
      const filtered = applyFilters(ordered, options);

      return filtered.once(options.event || 'value');
    },

    /**
     * Read value once from db
     *
     * @param {String} fileId
     * @param {Object} [options={}]
     * @returns {Promise} Resolves to value of query
     */
    async getFile(fileId, options = {}) {
      if (!fileId) {
        throw error('"storage.getFile()" should be called with at least the file ID');
      }
      const pluckFields = pluckResultFields(options.fields);
      const snapshot = await this.getFileRaw(fileId, options);
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
      const ordered = applyOrderBy(this.fileRef(), options);
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
      const folderId = await this._getFolderIdFromOptions(opts);
      const filterFolders = filterByFolderId(folderId);
      const pluckFields = pluckResultFields(opts.fields);
      const snapshot = await this.getFilesRaw(opts);
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
      const file = await this.getFile(fileId, options);
      const { file: filename, sizes } = file;
      const storageRefArgs = [filename];

      if (size && sizes && sizes.length) {
        const minSize = size === 'device' ? getScreenResolution() : size;
        const smartWidth = sizes
          .reduce((widths, s) => {
            const width = s.maxWidth || s.width;
            if (width) {
              widths.push(parseInt(width, 10));
            }
            return widths;
          }, [])
          .sort((a, b) => a - b) // sort widths ascending
          .find(width => width >= minSize);

        if (smartWidth) {
          storageRefArgs.push({ width: smartWidth });
        }
      }
      const fileRef = await this.ref(...storageRefArgs);
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

      const file = await this.getFile(fileId, options);

      if (!file) {
        throw error(`There is no file for File ID: "${fileId}"`);
      }

      const { file: filename } = file;

      return this.ref(filename).getMetadata();
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

      const file = await this.getFile(fileId);

      if (!file) {
        throw error(`There is no file for File ID: "${fileId}"`);
      }

      const { file: filename } = file;

      return this.ref(filename).updateMetadata(payload);
    },

    /**
     * @description Delete a given file from the Cloud Storage Bucket as well as the real-time db
     * @param {String|Number} fileId
     * @returns {Promise}
     */
    async deleteFile(fileId, options = {}) {
      if (!fileId) {
        throw error('"storage.deleteFile()" should be called with at least the file ID');
      }

      const file = await this.getFile(fileId, options);

      if (!file) {
        return;
      }

      const { file: filename, sizes } = file;
      const storageRef = this.ref(filename);

      // Delete original file from storage bucket
      await storageRef.delete();

      // If sizes are set, delete all the resized images here
      if (Array.isArray(sizes)) {
        await Promise.all(
          sizes.map(async size => {
            const width = size.width || size.maxWidth;

            if (!width) {
              return Promise.resolve();
            }

            return this.ref(filename, { width }).delete();
          })
        );
      }

      // Delete file entry from the real-time db
      return this.fileRef(fileId).remove();
    },

    /**
     * @description Upload a given file to the Cloud Storage Bucket as well as the real-time db
     * @param {String|File|Blob|Uint8Array} fileData
     * @param {Object} [options={}]
     * @returns {Object} UploadTask instance, which is similar to a Promise and an Observable
     */
    async upload(fileData, options = {}) {
      const id = Date.now();
      const metadata = options.metadata || {};
      const filename =
        (typeof fileData === 'object' && fileData.name) || typeof metadata.name === 'string'
          ? `${id}_${metadata.name || fileData.name}`
          : id;
      const storageRef = this.ref(filename, options);
      const updateMethod = typeof fileData === 'string' ? 'putString' : 'put';
      const args = [fileData];

      if (options.metadata) {
        args.push(options.metadata);
      }

      // TODO: Test and verify how the Firebase SDK handles string uploads with encoding and metadata
      // Is it the second argument then or should it be passed along with the metadata object?
      if (updateMethod === 'putString' && options.stringEncoding) {
        args.splice(1, 0, options.stringEncoding);
      }

      // Upload original file to storage bucket
      const uploadTask = storageRef[updateMethod](...args);
      const snapshot = await uploadTask;

      const mediaType = /^image\//.test(snapshot.metadata.contentType) ? 'images' : 'files';
      const folderId = await this._getFolderIdFromOptions(options);
      const filePayload = {
        id,
        file: snapshot.metadata.name,
        folderId,
        type: mediaType,
        contentType: snapshot.metadata.contentType
      };

      // If mediaType === 'images', file is resizeable and sizes/widths are set, resize images here
      if (mediaType === 'images' && updateMethod === 'put' && Array.isArray(options.sizes)) {
        filePayload.sizes = options.sizes;

        await Promise.all(
          options.sizes.map(size => this._createSizedImage(fileData, filename, size))
        );
      }

      // Write to real-time db
      await this._setFile(filePayload);

      return uploadTask;
    }
  };

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

    schemas: schemasAPI,

    storage: storageAPI
  };
}

flamelink.VERSION = __PACKAGE_VERSION__;

// Need to use `module.exports` instead of `export default`, otherwise library is available as { default: flamelink }
module.exports = flamelink;
