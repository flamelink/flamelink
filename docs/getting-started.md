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

```javascript
import * as firebase from 'firebase';
import flamelink from 'flamelink-sdk';

const app = flamelink({
  apiKey: '<your-api-key>',                     // required
  authDomain: '<your-auth-domain>',             // required
  databaseURL: '<your-database-url>',           // required
  storageBucket: '<your-storage-bucket-code>',  // required
  messagingSenderId: '<your-messenger-id>',     // optional
  env: 'production',                            // optional - will default to "production"
  locale: 'en-US'                               // optional - will default to "en-US"
});
```

Or you can pass in an existing `firebaseApp` instance along with all the other `flamelink` config options:

```javascript
import * as firebase from 'firebase';
import flamelink from 'flamelink-sdk';

const firebaseConfig = {
  apiKey: '<your-api-key>',                     // required
  authDomain: '<your-auth-domain>',             // required
  databaseURL: '<your-database-url>',           // required
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

<!-- TODO: Make the `flamelink` references links to the CMS once it is live -->
Once you have an instance of the `flamelink` app, you can start using it to interact with your data stored in your firebase database, for example: let's suppose you want to retrieve all your products created under the "Content" section in `flamelink`.

Using standard promises:

```javascript
app.content.get('products')
  .then(products => console.log('All of your products:', products))
  .catch(error => // handle any errors)
```

Using async-await:

```javascript
const products = await app.content.get('products');
console.log('All of your products:', products);
```

Check out the [API docs](/api-overview) for all the available methods!