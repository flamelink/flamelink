> All the methods that you would need to work with the "Content" Flamelink data is available on the `app.content` namespace.

---

## .ref()

> This is a more advanced API method, that for most use cases will not be necessary.

To retrieve a context aware (environment and locale) reference to any node/location within your "Content" data.


```js
app.ref('your-reference')
  .then(reference => console.log('The reference:', reference)
  .catch(error => console.error('Something went wrong while retrieving the reference. Details:', error);
```

#### Input parameters

The `.ref()` method takes a single parameter

- `{String}` `ref`: The reference you want to retrieve.

#### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

Next up: [Navigation/Menus](/navigation)
