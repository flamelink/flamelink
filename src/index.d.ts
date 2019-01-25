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
    isAdminApp?: boolean;
    firebaseApp: any;
  }

  interface ConfigOption2 {
    env?: string;
    locale?: string;
    isAdminApp?: boolean;
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    storageBucket: string;
    projectId: string;
    messagingSenderId?: string | number;
  }

  export type FlamelinkConfig = ConfigOption1 | ConfigOption2;

  interface content {
    ref(ref: string | string[]): firebase.database.Reference;
    getRaw(schemaKey: string, entryKey: string | number, options?: object): Promise<firebase.database.DataSnapshot>;
    getRaw(schemaKey: string, options?: object): Promise<firebase.database.DataSnapshot>;
    get(schemaKey: string, entryKey: string | number, options?: object): Promise<object | null>;
    get(schemaKey: string, options?: object): Promise<object | null>;
    getByFieldRaw(schemaKey: string, field: string, value: any, options?: object): Promise<firebase.database.DataSnapshot>;
    getByField(schemaKey: string, field: string, value: any, options?: object): Promise<object | null>;
    subscribeRaw(schemaKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(schemaKey: string, options: object, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(schemaKey: string, entryKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(schemaKey: string, entryKey: string, options: object, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(schemaKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(schemaKey: string, options: object, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(schemaKey: string, entryKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(schemaKey: string, entryKey: string, options: object, callbackFn: (error: any, result: any) => any): Promise<any>;
    unsubscribe(schemaKey: string, entryKey?: string, event?: string): Promise<any>;
    set(schemaKey: string, entryKey: string, payload: object | null): Promise<any>;
    set(schemaKey: string, payload: object | null): Promise<any>;
    update(schemaKey: string, entryKey: string | number, payload: object | null): Promise<any>;
    update(schemaKey: string, payload: object | null): Promise<any>;
    remove(schemaKey: string, entryKey: string | number): Promise<any>;
    transaction(schemaKey: string, entryKey: string | number, updateFn: () => any, callbackFn?: () => any): any;
  }

  interface nav {
    ref(ref: string): firebase.database.Reference;
    getRaw(navigationKey?: string, options?: object): Promise<firebase.database.DataSnapshot>;
    getRaw(options: object): Promise<firebase.database.DataSnapshot>;
    get(navigationKey?: string, options?: object): Promise<any>;
    get(options: object): Promise<any>;
    getItemsRaw(navigationKey: string, options?: object): Promise<firebase.database.DataSnapshot>;
    getItems(navigationKey: string, options?: object): Promise<any>;
    subscribeRaw(callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(navigationKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(options: object, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(navigationKey: string, options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(navigationKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(navigationKey: string, options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    unsubscribe(navigationKey: string, event?: string): Promise<any>;
    set(navigationKey: string, payload: object | null): Promise<any>;
    update(navigationKey: string, payload: object | null): Promise<any>;
    remove(navigationKey: string): Promise<any>;
    transaction(navigationKey: string, updateFn: () => any, callbackFn?: () => any): any;
  }

  interface schemas {
    ref(ref: string): firebase.database.Reference;
    getRaw(options?: object): Promise<firebase.database.DataSnapshot>;
    getRaw(schemaKey?: string, options?: object): Promise<firebase.database.DataSnapshot>;
    get(options?: object): Promise<any>;
    get(schemaKey?: string, options?: object): Promise<any>;
    getFieldsRaw(options?: object): Promise<firebase.database.DataSnapshot>;
    getFieldsRaw(schemaKey?: string, options?: object): Promise<firebase.database.DataSnapshot>;
    getFields(options?: object): Promise<any>;
    getFields(schemaKey?: string, options?: object): Promise<any>;
    subscribeRaw(callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(schemaKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(schemaKey: string, options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(schemaKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(schemaKey: string, options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    unsubscribe(schemaKey: string, event?: string): Promise<any>;
    set(schemaKey: string, payload: object | null): Promise<any>;
    update(schemaKey: string, payload: object | null): Promise<any>;
    remove(schemaKey: string): Promise<any>;
    transaction(schemaKey: string, updateFn: () => any, callbackFn?: () => any): any;
  }

  interface storage {
    // _getFolderId(folderName?: string, fallback?: string): string;
    // _getFolderIdFromOptions(options?: object): Promise<any>;
    // _setFile(payload?: any): Promise<any>;
    // _createSizedImage(file: File, filename: string, options?: object): Promise<any>;
    ref(filename: string, options?: object): firebase.storage.Reference;
    folderRef(folderID: string | number): firebase.database.Reference;
    fileRef(fileId: string | number): firebase.database.Reference;
    mediaRef(mediaRef?: string): firebase.database.Reference;
    getRaw(options?: object): Promise<any>;
    getRaw(mediaRef?: string, options?: object): Promise<any>;
    get(options?: object): Promise<any>;
    get(mediaRef: string, options?: object): Promise<any>;
    subscribeRaw(callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(mediaKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribeRaw(mediaKey: string, options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(mediaKey: string, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    subscribe(mediaKey: string, options: any, callbackFn: (error: any, result: any) => any): Promise<any>;
    unsubscribe(mediaKey: string, event?: string): Promise<any>;
    getFoldersRaw(options?: object): Promise<firebase.database.DataSnapshot>;
    getFolders(options?: object): Promise<any>;
    getFileRaw(fileId: string, options?: object): Promise<firebase.database.DataSnapshot>;
    getFile(fileId: string, options?: object): Promise<any>;
    getFilesRaw(options?: object): Promise<firebase.database.DataSnapshot>;
    getFiles(options?: object): Promise<any>;
    getURL(fileId: string, options?: object): Promise<any>;
    getMetadata(fileId: string | number, options?: object): Promise<any>;
    updateMetadata(fileId: string | number, payload?: object): Promise<any>;
    deleteFile(fileId: string | number, options?: object): Promise<any>;
    upload(fileData: string | File | Blob | Uint8Array, options?: object): any;
  }

  interface settings {
    ref(ref: string): firebase.database.Reference;
    getRaw(options?: object): Promise<firebase.database.DataSnapshot>;
    getRaw(settingsKey: string, options?: object): Promise<firebase.database.DataSnapshot>;
    get(options?: object): Promise<any>;
    get(settingsKey: string, options?: object): Promise<any>;
    setLocale(locale?: string): Promise<string>;
    getLocale(): Promise<string>;
    setEnvironment(environment?: string): Promise<string>;
    getEnvironment(): Promise<string>;
    getImageSizes(options?: object): Promise<any>;
    getDefaultPermissionsGroup(options?: object): Promise<any>;
    getGlobals(options?: object): Promise<any>;
  }

  export interface App {
    name: string;
    firebaseApp: firebase.app.App;
    databaseService: firebase.database.Database;
    storageService: firebase.storage.Storage;
    authService: firebase.auth.Auth;
    firestoreService: firebase.firestore.Firestore;
    // setLocale(locale?: string): Promise<string>;
    // setEnv(env?: string): Promise<string>;
    // getLocale(): Promise<string>;
    // getEnv(): Promise<string>;
    content: content;
    nav: nav;
    schemas: schemas;
    storage: storage;
    settings: settings;
  }

  export const VERSION: string;
}
