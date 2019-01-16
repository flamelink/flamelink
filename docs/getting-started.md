## Prerequisites

It goes without saying that you will need to have a [Flamelink](https://www.flamelink.io) project for this SDK to be of any use to you.

Apart from the Flamelink project, the only real hard dependency is either the [Firebase JavaScript SDK](https://www.npmjs.com/package/firebase) or [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup), depending on whether you use Flamelink from the browser or server. Take a look at the installation instructions on their README, but in short, just make sure you add `firebase` or `firebase-admin` as a dependency to your project.

Once you have `firebase` installed, you can install `flamelink` using any of the following options (we recommend installing with `npm` or `yarn`):

## Installation

Install with `npm`

```bash
npm install --save flamelink
```

or with `yarn`

```bash
yarn add flamelink
```

or with a `<script>` tag hosted from any of these CDN's

### jsDelivr

[![](https://data.jsdelivr.com/v1/package/npm/flamelink/badge)](https://www.jsdelivr.com/package/npm/flamelink)

Add the following script tag to the `<body>` of your index.html file:

```html
<script src="//cdn.jsdelivr.net/npm/flamelink/dist/flamelink.js"></script>
```

This will always load the latest version of this SDK for you. If you want to load a specific version, you can specify the version number as well (1.0.0 in the example):

```html
<script src="//cdn.jsdelivr.net/npm/flamelink@1.0.0/dist/flamelink.js"></script>
```

> See the [jsDelivr website](https://www.jsdelivr.com/?query=flamelink) for more options

### unpkg

Add the following script tag to the `<body>` of your index.html file:

```html
<script src="//unpkg.com/flamelink/dist/flamelink.js"></script>
```

This will always load the latest version of this SDK for you. If you want to load a specific version, you can specify the version number as well (1.0.0 in the example):

```html
<script src="//unpkg.com/flamelink@1.0.0/dist/flamelink.js"></script>
```

> See the [unpkg website](https://unpkg.com) for more options

## Usage

### Importing/Adding the dependencies

First ensure that you load the `flamelink` package to your file. When using the `<script>` tag version, you will need to load both `firebase` and `flamelink` which will then be globally available on the browser's `window` object.

Depending on your app setup, you can import the package using `require()` statements:

```javascript
var flamelink = require('flamelink');
```

or using ES2015/ES6 imports:

```javascript
import flamelink from 'flamelink';
```

### Creating your Flamelink app instance

You can create your `flamelink` app instance by passing in an existing `firebaseApp` instance along with all the other `flamelink` config options (you need to remember to import `firebase` of `firebase-admin` yourself):

```javascript
import * as firebase from 'firebase';
import flamelink from 'flamelink';

const firebaseConfig = {
  apiKey: '<your-api-key>', // required
  authDomain: '<your-auth-domain>', // required
  databaseURL: '<your-database-url>', // required
  projectId: '<your-project-id>', // required
  storageBucket: '<your-storage-bucket-code>', // required
  messagingSenderId: '<your-messenger-id>' // optional
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

const app = flamelink({ firebaseApp });
```

?> **Tip:** Go to your [Firebase console](https://console.firebase.google.com/) to find these config settings.

When using the `firebase-admin` SDK on server-side, you need to specify a `isAdminApp` property along with your `firebaseApp` instance, like this:

```javascript
const admin = require('firebase-admin');
const flamelink = require('flamelink');
const serviceAccount = require('path/to/serviceAccountKey.json');

const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount), // required
  databaseURL: '<your-database-url>', // required
  storageBucket: '<your-storage-bucket-code>' // required if you want to use any Storage functionality
};

const firebaseApp = admin.initializeApp(config);

const app = flamelink({ firebaseApp, isAdminApp: true }); // Remember `isAdminApp: true` here!!!
```

> You can use any of the [different ways to create the admin firebaseApp instance](https://firebase.google.com/docs/admin/setup), as long as you remember to set the `isAdminApp: true` option.

### Using your flamelink app

Once you have an instance of the [`flamelink` app](https://app.flamelink.io), you can start using it to interact with your data stored in your firebase database. Suppose you want to retrieve all your products created under the "Content" section in `flamelink`.

_Using standard Promises:_

```javascript
app.content.get('products')
  .then(products => console.log('All of your products:', products))
  .catch(error => // handle any errors)
```

_Using async-await:_

```javascript
const products = await app.content.get('products');
console.log('All of your products:', products);
```

Check out the [API docs](/api-overview) for all the available methods!

> 🔥🔥🔥 **PSST. Your coding skills... So hot right now.** 🔥🔥🔥
