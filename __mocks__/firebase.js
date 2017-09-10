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

          case '/schemas/':
            return Promise.resolve({
              val: jest.fn(() => ({
                'about-us': {
                  description: 'About Us',
                  display: true,
                  fields: [
                    {
                      description: '',
                      key: 'title',
                      show: true,
                      title: 'Title',
                      type: 'text'
                    },
                    {
                      description: '',
                      key: 'content',
                      options: [
                        {
                          description: '',
                          key: 'heading',
                          title: 'Heading',
                          type: 'text'
                        },
                        {
                          description: '',
                          key: 'text',
                          title: 'Text',
                          type: 'wysiwyg'
                        },
                        {
                          description: '',
                          key: 'image',
                          title: 'Image',
                          type: 'image'
                        }
                      ],
                      title: 'Content Sections',
                      type: 'repeater'
                    }
                  ],
                  group: 'Pages',
                  icon: '',
                  id: 'about-us',
                  menuIndex: 1,
                  title: 'About Us',
                  type: 'single'
                },
                brands: {
                  description: 'Brands',
                  display: true,
                  fields: [
                    {
                      description: '',
                      key: 'name',
                      show: true,
                      title: 'Name',
                      type: 'text'
                    },
                    {
                      description: '',
                      key: 'logo',
                      show: true,
                      title: 'Logo',
                      type: 'image'
                    },
                    {
                      description: '',
                      key: 'image',
                      title: 'Image',
                      type: 'image'
                    },
                    {
                      description: '',
                      key: 'brochure',
                      title: 'Brochure',
                      type: 'image'
                    },
                    {
                      description: '',
                      key: 'certificate',
                      title: 'Certificate',
                      type: 'image'
                    }
                  ],
                  group: 'Brands',
                  icon: 'FaRegistered',
                  id: 'brands',
                  menuIndex: 1,
                  sortable: {
                    enabled: true,
                    fields: ['name'],
                    startCollapsed: true
                  },
                  title: 'Brands',
                  type: 'collection'
                }
              }))
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
