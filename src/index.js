import * as firebase from 'firebase';

let firebaseApp = null;

export default function(config = {}) {
  if (config.firebaseApp) {
    firebaseApp = config.firebaseApp;
  } else {
    firebaseApp = firebaseApp ? firebaseApp : firebase.initializeApp(config);
  }

  return {
    firebaseApp,
    setLanguage() {},
    setEnv() {},
    content: {
      get() {},
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
