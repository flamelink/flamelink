'use strict';

const firebase = jest.genMockFromModule('firebase');

firebase.initializeApp = jest.fn(payload => ({
  database: jest.fn(() => ({
    ref: jest.fn(ref => ({
      once: () => {
        switch (ref) {
          case '/settings/locales':
            return Promise.resolve({
              val: jest.fn().mockImplementation(() => ['en-US'])
            });

          case '/settings/environments':
            return Promise.resolve({
              val: jest.fn().mockImplementation(() => ['production'])
            });

          case '/environments/production/navigation/get-ref/en-US':
          case '/environments/production/content/get-ref/en-US':
          case '/environments/production/content/raw-get-ref/en-US':
            return Promise.resolve({
              val: jest.fn().mockImplementation(() => ({ key: 'value' }))
            });

          default:
            return Promise.resolve({
              val: jest.fn()
            });
        }
      },
      on: jest.fn((event, cb) => {
        if (cb) {
          cb({
            val: () => `"on" called with event: "${event}"`
          });
        }
      }),
      off: jest.fn(event => `"off" called with event: "${event}"`),
      set: jest.fn(payload => `"set" called with payload: "${JSON.stringify(payload)}"`),
      update: jest.fn(payload => `"update" called with payload: "${JSON.stringify(payload)}"`),
      remove: jest.fn(() => `"remove" called for "${ref}"`),
      transaction: jest.fn((updateFn, cb) => {
        if (updateFn) updateFn();
        if (cb) cb();
      })
    }))
  }))
}));

module.exports = firebase;
