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

          default:
            return Promise.resolve({
              val: jest.fn()
            });
        }
      }
    }))
  }))
}));

module.exports = firebase;
