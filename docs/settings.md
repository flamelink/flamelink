> All the methods that you would need to work with the Flamelink "Settings" are available on the `app.settings` namespace.

---

!> Support for multiple environments and locales are currently in development. Once these exciting features are released, you will be able to set up multiple languages and streams for your development. This will allow you to have different data for "production", "staging", "development", etc.

On initialization of your Flamelink app instance, you should specify the environment you want to connect to, as well as the default locale. If no environment is specified, the default environment will be `"production"` and the locale will be `"en-US"`.

```javascript
import * as firebase from 'firebase';
import flamelink from 'flamelink';

const app = flamelink({
  ... other config ...
  env: 'production',
  locale: 'en-US'
});
```

---

## .setEnvironment()

If you want to set the environment to something else after instantiation, you can easily do so with the `setEnvironment()` method:

```javascript
app.settings.setEnvironment('staging')
  .then(env => console.log(`Your environment is set as "${env}"`)
  .catch(error => console.error('Something went wrong while setting the environment. Details:', error);
```

### Input parameters

The `.setEnvironment()` method takes a single parameter

- `{String}` `env`: The environment you want to set.

### Return value

A `Promise` that resolves to the set environment `{String}` on success or will reject with an error if an unsupported environment is set.

---

## .getEnvironment()

To retrieve the currently selected environment, you can do so with the `getEnvironment()` method:

```javascript
app.settings.getEnvironment()
  .then(env => console.log(`Your environment is set as "${env}"`)
  .catch(error => console.error('Something went wrong while retrieving the environment. Details:', error);
```

### Input parameters

The `.getEnvironment()` method takes no parameters

### Return value

A `Promise` that resolves to the currently set environment `{String}` on success.

---

## .setLocale()

If you want to set the locale to something else after instantiation, you can easily do so with the `setLocale()` method:

```javascript
app.settings.setLocale('en-GB')
  .then(locale => console.log(`Your locale is set as "${locale}"`)
  .catch(error => console.error('Something went wrong while setting the locale. Details:', error);
```

### Input parameters

The `.setLocale()` method takes a single parameter

- `{String}` `locale`: The locale you want to set.

### Return value

A `Promise` that resolves to the set locale `{String}` on success or will reject with an error if an unsupported locale is set.

---

## .getLocale()

To retrieve the currently selected locale, you can do so with the `getLocale()` method:

```javascript
app.settings.getLocale()
  .then(locale => console.log(`Your locale is set as "${locale}"`)
  .catch(error => console.error('Something went wrong while retrieving the locale. Details:', error);
```

### Input parameters

The `.getLocale()` method takes no parameters

### Return value

A `Promise` that resolves to the currently set locale `{String}` on success.

---

## .getGlobals()

To retrieve the global meta data for your project, you can do so with the `getGlobals()` method:

```javascript
app.settings.getGlobals()
  .then(globals => console.log(`Your project's global data: "${globals}"`)
  .catch(error => console.error('Something went wrong while retrieving the data. Details:', error);
```

### Input parameters

| Type   | Variable    | Required | Description                                            |
| ------ | ----------- | -------- | ------------------------------------------------------ |
| Object | `options`   | optional | Additional options                                     |

#### Available Options

The following options can be specified when retrieving your globals:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from the globals object.

*Example*

To retrieve only the `tagline` property.

```javascript
app.settings.getGlobals({ fields: [ 'tagline' ] })
```

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire globals object.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.settings.getGlobals({ event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the globals `{Object}` on success or will reject with an error if the request fails.

---

## .getImageSizes()

To retrieve the list of different image sizes that are generated when an image is uploaded, you can do so with the `getImageSizes()` method:

```javascript
app.settings.getImageSizes()
  .then(imageSizes => console.log(`Your image sizes are set as "${imageSizes}"`)
  .catch(error => console.error('Something went wrong while retrieving the image sizes. Details:', error);
```

### Input parameters

| Type   | Variable    | Required | Description                                            |
| ------ | ----------- | -------- | ------------------------------------------------------ |
| Object | `options`   | optional | Additional options                                     |

#### Available Options

The following options can be specified when retrieving your image sizes:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from each image size.

*Example*

To retrieve only the `width` property.

```javascript
app.settings.getImageSizes({ fields: [ 'width' ] })
```

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire image sizes array.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.settings.getImageSizes({ event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the image sizes `{Array}` on success or will reject with an error if the request fails.

---

## .getDefaultPermissionsGroup()

To retrieve the ID of the default Permissions Group, you can do so with the `getDefaultPermissionsGroup()` method:

```javascript
app.settings.getDefaultPermissionsGroup()
  .then(permissionsGroup => console.log(`Your default permissions groups is: "${permissionsGroup}"`)
  .catch(error => console.error('Something went wrong while retrieving the permissions group. Details:', error);
```

### Input parameters

| Type   | Variable    | Required | Description                                            |
| ------ | ----------- | -------- | ------------------------------------------------------ |
| Object | `options`   | optional | Additional options                                     |

#### Available Options

The following options can be specified:

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the permissions group.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.settings.getDefaultPermissionsGroup({ event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the default permissions group `{Number}` on success or will reject with an error if the request fails.

---

> 🔥🔥🔥 **Pretty sure your keyboard's melting from all that hot code you're dropping** 🔥🔥🔥
