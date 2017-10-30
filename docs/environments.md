!> Support for multiple environments is currently in development. Once this exciting feature is released, you will be able to set up multiple streams for your development. This will allow you to have different data for "production", "staging", "development", etc.

On initialization of your Flamelink app instance, you should specify the environment you want to connect to. If no environment is specified, the default environment will be `"production"`.

```javascript
import * as firebase from 'firebase';
import flamelink from 'flamelink';

const app = flamelink({
  ... other config ...
  env: 'production'
});
```

---

## .setEnv()

If you want to set the environment to something else after instantiation, you can easily do so with the `setEnv()` method:

```javascript
app.setEnv('staging')
  .then(env => console.log(`Your environment is set as "${env}"`)
  .catch(error => console.error('Something went wrong while setting the environment. Details:', error);
```

### Input parameters

The `.setEnv()` method takes a single parameter

- `{String}` `env`: The environment you want to set.

### Return value

A `Promise` that resolves to the set environment `{String}` on success or will reject with an error if an unsupported environment is set.

---

## .getEnv()

To retrieve the currently selected environment, you can do so with the `getEnv()` method:

```javascript
app.getEnv()
  .then(env => console.log(`Your environment is set as "${env}"`)
  .catch(error => console.error('Something went wrong while retrieving the environment. Details:', error);
```

### Input parameters

The `.getEnv()` method takes no parameters

### Return value

A `Promise` that resolves to the currently set environment `{String}` on success.

---

Next up: [Locales/Languages](/locales)
