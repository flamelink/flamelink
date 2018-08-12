// Type definitions for Flamelink JavaScript SDK
import * as firebase from 'firebase';

// Global export outside of module loader environment
export as namespace flamelink;

// Export for build systems (module loaders)
export = flamelink;

declare function flamelink(conf?: flamelink.FlamelinkConfig): flamelink.App;

declare namespace flamelink {
  interface ConfigOption1 {
    env?: string;
    locale?: string;
    isAdmin?: boolean;
    firebaseApp: firebase.app.App;
  }

  interface ConfigOption2 {
    env?: string;
    locale?: string;
    isAdmin?: boolean;
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    storageBucket: string;
    projectId: string;
    messagingSenderId?: string | number;
  }

  export type FlamelinkConfig = ConfigOption1 | ConfigOption2;

  interface ContentAPI {
    ref(ref: string): firebase.database.Reference;
    getRaw(contentRef: string, entryRef: string | number, options?: object): Promise<firebase.database.DataSnapshot>;
    getRaw(contentRef: string, options?: object): Promise<firebase.database.DataSnapshot>;
    get(contentRef: string, entryRef: string | number, options?: object): Promise<object | null>;
    get(contentRef: string, options?: object): Promise<object | null>;
    getByFieldRaw(contentRef: string, field: string, value: any, options?: object): Promise<firebase.database.DataSnapshot>;
    getByField(contentRef: string, field: string, value: any, options?: object): Promise<object | null>;
    subscribeRaw(contentRef: string, entryRef: string, cb: () => any): Promise<any>;
    subscribeRaw(contentRef: string, entryRef: string, options: object, cb: () => any): Promise<any>;
    subscribe(contentRef: string, entryRef: string, cb: () => any): Promise<any>;
    subscribe(contentRef: string, entryRef: string, options: object, cb: () => any): Promise<any>;
    unsubscribe(contentRef: string, entryRef?: string, event?: string): Promise<any>;
    set(contentRef: string, entryRef: string, payload: any): Promise<any>;
    set(contentRef: string, payload: any): Promise<any>;
    update(contentRef: string, entryRef: string | number, payload: any): Promise<any>;
    update(contentRef: string, payload: any): Promise<any>;
    remove(contentRef: string, entryRef: string | number): Promise<any>;
    transaction(contentRef: string, entryRef: string | number, updateFn: () => any, cb?: () => any): any;
  }

  interface NavigationAPI {
    ref(ref: string): firebase.database.Reference;
    getRaw(navRef: string, options?: any): Promise<firebase.database.DataSnapshot>;
    get(navRef?: string, options?: any): Promise<any>;
    getItemsRaw(navRef: string, options?: any): Promise<any>;
    getItems(navRef: string, options?: any): Promise<any>;
    subscribeRaw(cb: () => any): Promise<any>;
    subscribeRaw(navRef: string, cb: () => any): Promise<any>;
    subscribeRaw(options: object, cb: () => any): Promise<any>;
    subscribeRaw(navRef: string, options: any, cb: () => any): Promise<any>;
    subscribe(cb: () => any): Promise<any>;
    subscribe(navRef: string, cb: () => any): Promise<any>;
    subscribe(options: any, cb: () => any): Promise<any>;
    subscribe(navRef: string, options: any, cb: () => any): Promise<any>;
    unsubscribe(...args: any[]): Promise<any>;
    set(navRef: string, payload: any): Promise<any>;
    update(navRef: string, payload: any): Promise<any>;
    remove(navRef: string): Promise<any>;
    transaction(navRef: string, updateFn: () => any, cb?: () => any): any;
  }

  interface SchemasAPI {
    ref(schemaRef: string): firebase.database.Reference;
    getRaw(schemaRef?: string, options?: any): Promise<firebase.database.DataSnapshot>;
    get(schemaRef: string, options?: any): Promise<any>;
    getFieldsRaw(schemaRef: string, options?: any): Promise<any>;
    getFields(schemaRef: string, options?: any): Promise<any>;
    subscribeRaw(cb: () => any): Promise<any>;
    subscribeRaw(schemaKey: string, cb: () => any): Promise<any>;
    subscribeRaw(options: any, cb: () => any): Promise<any>;
    subscribeRaw(schemaKey: string, options: any, cb: () => any): Promise<any>;
    subscribe(cb: () => any): Promise<any>;
    subscribe(schemaKey: string, cb: () => any): Promise<any>;
    subscribe(options: any, cb: () => any): Promise<any>;
    subscribe(schemaKey: string, options: any, cb: () => any): Promise<any>;
    unsubscribe(...args: any[]): Promise<any>;
    set(schemaKey: string, payload: any): Promise<any>;
    update(schemaKey: string, payload: any): Promise<any>;
    remove(schemaKey: string): Promise<any>;
    transaction(schemaKey: string, updateFn: () => any, cb?: () => any): any;
  }

  interface StorageAPI {
    _getFolderId(folderName?: string, fallback?: string): string;
    _getFolderIdFromOptions(options?: any): Promise<any>;
    _setFile(payload?: any): Promise<any>;
    _createSizedImage(file: File, filename: string, options?: any): Promise<any>;
    ref(
      filename: string,
      options?: {
        [x: string]: any;
      }
    ): firebase.storage.Reference;
    folderRef(folderID: string): firebase.database.Reference;
    fileRef(fileId: string): firebase.database.Reference;
    mediaRef(mediaRef?: string): firebase.database.Reference;
    getRaw(mediaRef?: string, options?: any): Promise<firebase.database.DataSnapshot>;
    get(mediaRef: string, options?: any): Promise<any>;
    subscribeRaw(cb: () => any): Promise<any>;
    subscribeRaw(mediaKey: string, cb: () => any): Promise<any>;
    subscribeRaw(options: any, cb: () => any): Promise<any>;
    subscribeRaw(mediaKey: string, options: any, cb: () => any): Promise<any>;
    subscribe(cb: () => any): Promise<any>;
    subscribe(mediaKey: string, cb: () => any): Promise<any>;
    subscribe(options: any, cb: () => any): Promise<any>;
    subscribe(mediaKey: string, options: any, cb: () => any): Promise<any>;
    unsubscribe(...args: any[]): Promise<any>;
    getFoldersRaw(options?: any): Promise<any>;
    getFolders(options?: any): Promise<any>;
    getFileRaw(fileId: string, options?: any): Promise<any>;
    getFile(fileId: string, options?: any): Promise<any>;
    getFilesRaw(options?: any): Promise<any>;
    getFiles(options?: any): Promise<any>;
    getURL(fileId: string, options?: any): Promise<any>;
    getMetadata(
      fileId: string | number,
      options?: {
        [x: string]: any;
      }
    ): Promise<any>;
    updateMetadata(fileId: string | number, payload?: any): Promise<any>;
    deleteFile(
      fileId: string | number,
      options?: {
        [x: string]: any;
      }
    ): Promise<any>;
    upload(fileData: string | File | Blob | Uint8Array, options?: any): any;
  }

  interface SettingsAPI {
    ref(ref: string): firebase.database.Reference;
    getRaw(settingsRef: string, options?: any): Promise<firebase.database.DataSnapshot>;
    get(settingsRef: string, options?: any): Promise<any>;
    setLocale(locale?: string): Promise<string>;
    getLocale(): Promise<string>;
    setEnvironment(env?: string): Promise<string>;
    getEnvironment(): Promise<string>;
    getImageSizes(options?: { [x: string]: any }): Promise<any>;
    getDefaultPermissionsGroup(options?: { [x: string]: any }): Promise<any>;
    getGlobals(options?: { [x: string]: any }): Promise<any>;
  }

  export interface App {
    name: string;
    firebaseApp: firebase.app.App;
    databaseService: firebase.database.Database;
    storageService: firebase.storage.Storage;
    authService: firebase.auth.Auth;
    firestoreService: firebase.firestore.Firestore;
    setLocale(locale?: string): Promise<string>;
    setEnv(env?: string): Promise<string>;
    getLocale(): Promise<string>;
    getEnv(): Promise<string>;
    content: ContentAPI;
    nav: NavigationAPI;
    schemas: SchemasAPI;
    storage: StorageAPI;
    settings: SettingsAPI;
  }

  export const VERSION: string;
}
