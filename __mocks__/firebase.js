'use strict';

const firebase = jest.genMockFromModule('firebase');

firebase.initializeApp = jest.fn(payload => ({
  database: jest.fn(() => ({
    ref: jest.fn(() => ({
      once: () =>
        Promise.resolve({
          val: jest.fn()
        })
    }))
  }))
}));

module.exports = firebase;
