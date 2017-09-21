!> Support for multiple locales are currently in development. Once this exciting feature is released, you will be able to set up multiple language support for your content and query data for the specified language.

On initialization of your flamelink app instance, you should specify the `locale` for your content. If no locale is specified, the default locale will be `"en-US"`.

Currently, the only supported locale is `"en-US"`.

```javascript
import * as firebase from 'firebase';
import flamelink from 'flamelink-sdk';

const app = flamelink({
  ... other config ...
  locale: 'en-US'
});
```

---

## .setLocale()

If you want to set the locale to something else after instantiation, you can easily do so with the `setLocale()` method:

```javascript
app.setLocale('en-GB')
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
app.getLocale()
  .then(locale => console.log(`Your locale is set as "${locale}"`)
  .catch(error => console.error('Something went wrong while retrieving the locale. Details:', error);
```

### Input parameters

The `.getLocale()` method takes no parameters

### Return value

A `Promise` that resolves to the currently set locale `{String}` on success.

---

Next up: [Content](/content)
