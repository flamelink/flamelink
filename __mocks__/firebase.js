'use strict';

const firebase = jest.genMockFromModule('firebase');

firebase.initializeApp = jest.fn(payload => ({
  database: jest.fn(() => ({
    ref: jest.fn(ref => ({
      child: jest.fn(child => ({
        once: () => {
          switch (ref) {
            case '/environments/production/navigation/get-items-ref/en-US':
              return Promise.resolve({
                val: jest.fn().mockImplementation(() => [
                  {
                    attachment: 0,
                    component: 'Template',
                    cssClass: '',
                    id: 1491798664087,
                    newWindow: '',
                    order: 0,
                    parentIndex: 0,
                    title: 'Homes',
                    url: '/',
                    uuid: 1491798664087
                  },
                  {
                    attachment: 0,
                    component: 'About',
                    cssClass: '',
                    id: 1491799269435,
                    newWindow: '',
                    order: 1,
                    parentIndex: 0,
                    title: 'About',
                    url: '/about-us',
                    uuid: 1491799269435
                  }
                ])
              });
          }
        }
      })),
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
            return Promise.resolve({
              val: jest.fn().mockImplementation(() => ({
                id: 'main',
                items: [
                  {
                    attachment: 0,
                    component: 'Template',
                    cssClass: '',
                    id: 1491798664087,
                    newWindow: '',
                    order: 0,
                    parentIndex: 0,
                    title: 'Homes',
                    url: '/',
                    uuid: 1491798664087
                  },
                  {
                    attachment: 0,
                    component: 'About',
                    cssClass: '',
                    id: 1491799269435,
                    newWindow: '',
                    order: 1,
                    parentIndex: 0,
                    title: 'About',
                    url: '/about-us',
                    uuid: 1491799269435
                  }
                ],
                title: 'main'
              }))
            });

          case '/environments/production/content/get-ref/en-US':
          case '/environments/production/content/raw-get-ref/en-US':
            return Promise.resolve({
              val: jest.fn().mockImplementation(() => ({
                'content-type-1': {
                  id: 1491679616674,
                  name: 'ASP'
                },
                'content-type-2': {
                  id: 1491679616683,
                  name: 'Axor'
                }
              }))
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
