## Installation

Install through `npm`

```shell
npm install --save flamelink-sdk
```

or through `yarn`

```shell
yarn add flamelink-sdk
```

## Usage

### Creating your flamelink app instance

You can either create your `flamelink` app instance by passing in all the required config options that you would normally use to instantiate a firebase application:

```js
import * as firebase from 'firebase';
import flamelink from 'flamelink-sdk';

const app = flamelink({
  apiKey: '<your-api-key>',                     // required
  authDomain: '<your-auth-domain>',             // required
  databaseURL: '<your-database-url>',           // required
  projectId: '<your-project-id>',               // required
  storageBucket: '<your-storage-bucket-code>',  // required
  messagingSenderId: '<your-messenger-id>',     // optional
  env: 'production',                            // optional - will default to "production"
  locale: 'en-US'                               // optional - will default to "en-US"
});
```

Or you can pass in an existing `firebaseApp` instance along with all the other `flamelink` config options:

```js
import * as firebase from 'firebase';
import flamelink from 'flamelink-sdk';

const firebaseConfig = {
  apiKey: '<your-api-key>',                     // required
  authDomain: '<your-auth-domain>',             // required
  databaseURL: '<your-database-url>',           // required
  projectId: '<your-project-id>',               // required
  storageBucket: '<your-storage-bucket-code>',  // required
  messagingSenderId: '<your-messenger-id>'      // optional
};

const firebaseApp = firebase.initializeApp(config);

const app = flamelink({
  firebaseApp: firebaseApp,
  env: 'production',  // optional - will default to "production"
  locale: 'en-US'     // optional - will default to "en-US"
});
```

### Using your flamelink app

Once you have an instance of the `flamelink` app, you can start using it to interact with your data stored in your firebase database, for example: let's suppose you want to retrieve all your products created in `flamelink`.

Using standard promises:

```js
app.content.getAll('products')
  .then(products => console.log('All of your products:', products))
  .catch(error => // handle any errors)
```

Using async-await:

```js
const products = await app.content.getAll('products');
console.log('All of your products:', products);
```