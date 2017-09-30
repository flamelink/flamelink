> All the methods that you would need to work with the "Navigation" Flamelink data is available on the `app.nav` namespace.

---

## .get()

To retrieve a single navigation entry or menu once, ie. Give me the "Main Menu".

This method does not *watch* for real-time db changes, but is intended to retrieve your menu once. If you are looking for real-time methods, take a look at the [`app.nav.subscribe()`](/navigation?id=subscribe) method below.

*To get a navigation entry:*

```javascript
app.nav.get('main-menu')
  .then(menu => console.log('Main menu:', menu))
  .catch(error => console.error('Something went wrong while retrieving the menu. Details:', error));
```

### Input parameters

| Type   | Variable       | Required | Description                               |
| ------ | -------------- | -------- | ----------------------------------------- |
| String | `navReference` | required | The navigation entry you want to retrieve |
| Object | `options`      | optional | Additional options                        |

#### Available Options

The following optional options can be specified when retrieving your data:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from the navigation entry object.

*Example*

To retrieve only the `items` from your menu object.

```javascript
app.nav.get('main-menu', { fields: [ 'items' ] })
```

##### Structure

- `structure` **{String}** - Should the menu items be returned as a list or nested in a tree structure.

*Example*

To retrieve your menu in a nested structure, specify either `nested` or `tree` as the `structure` option

```javascript
app.nav.get('main-menu', { structure: 'nested' });
```

?> **Tip:** Setting the `structure` to anything other than `nested` or `tree` will return a plain list of items

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire content at the given reference(s) path.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.nav.get('main-menu', { event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

## .getItems()

To retrieve only the `items` array for a given menu/navigation entry reference.

```javascript
app.nav.getItems('main-menu')
  .then(items => console.log('Menu items:', items))
  .catch(error => console.error('Something went wrong while retrieving the menu items. Details:', error));
```

> This method is simply a convenience method, but the same can be achieved with the standard `app.nav.get()` method by adding the following options:

```javascript
app.nav.getItems('main-menu', { fields: [ 'items' ] })
  .then(items => console.log('Menu items:', items))
  .catch(error => console.error('Something went wrong while retrieving the menu items. Details:', error));
```

### Input parameters

| Type   | Variable       | Required | Description                                         |
| ------ | -------------- | -------- | --------------------------------------------------- |
| String | `navReference` | required | The navigation entry reference you want to retrieve |
| Object | `options`      | optional | Additional options                                  |

#### Available Options

All options available to the `app.nav.get()` method is available for this method.

*Example*

```javascript
app.nav.getItems('main-menu', {
  event: 'child_changed',
  fields: [ 'url', 'title', 'cssClass', 'children' ],
  structure: 'tree'
});
```

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

## .subscribe()

This method is similar to the `app.nav.get()` method except that where the `.get()` method returns a `Promise` resolving to the once-off value, this method subscribes to a single navigation entry/menu for real-time updates. A callback method should be passed as the last argument which will be called each time the data changes in your Firebase db.

If you are looking for retrieving data once, take a look at the [`app.nav.get()`](/navigation?id=get) method above.

*To subscribe to a specific navigation entry/menu:*

```javascript
app.nav.subscribe('main-menu', function(error, menu) {
  if (error) {
    return console.error('Something went wrong while retrieving the entry. Details:', error);
  }
  console.log('The menu object:', menu);
});
```

*To subscribe to the `child_changed` child event for a specific navigation entry/menu:*

```javascript
app.nav.subscribe('main-menu', { event: 'child_changed' }, function(error, menu) {
  if (error) {
    return console.error('Something went wrong while retrieving the navigation changes. Details:', error);
  }
  console.log('The changes:', menu);
});
```

### Input parameters

Parameters should be passed in the order of the following table. If an optional parameter, like the `options` are left out, the following parameter just moves in its place.

| Type     | Variable       | Required | Description                                                           |
| -------- | -------------- | -------- | --------------------------------------------------------------------- |
| String   | `navReference` | required | The navigation entry/menu reference you want to retrieve              |
| Object   | `options`      | optional | Additional options                                                    |
| Function | `callback`     | required | Function called once when subscribed and when subscribed data changes |

#### Available Options

The following optional options can be specified when retrieving your data:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from the navigation entry.

*Example*

To retrieve only the `items` array.

```javascript
app.nav.subscribe('main-menu', { fields: [ 'items' ] }, function(error, menu) {
  // Handle callback
});
```

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire navigation entry.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.nav.subscribe('main-menu', { event: 'child_changed' }, function(error, menu) {
  // Handle callback
})
```

### Return value

This method has no return value, but makes use of an [error-first callback](https://www.google.com/search?q=error-first+callback&oq=javascript+error-first+callback) function that should be passed as the last argument.

---

## .unsubscribe()

This method is used to unsubscribe from previously subscribed navigation entry updates or other child events. It is the equivalent of Firebase's `.off()` method and taking the Flamelink database structure into consideration.

*To unsubscribe from all events for a specific navigation entry/menu:*

```javascript
app.nav.unsubscribe('main-menu');
```

*To unsubscribe from the `child_changed` event for a specific navigation entry/menu:*

```javascript
app.nav.unsubscribe('main-menu', 'child_changed');
```

### Input parameters

All parameters are optional and calling this method without options will unsubscribe from all callbacks.

| Type     | Variable       | Required | Description                                                    |
| -------- | -------------- | -------- | -------------------------------------------------------------- |
| String   | `navReference` | required | The navigation entry reference you want to unsubscribe from    |
| String   | `event`        | optional | The child event to unsubscribe from (see allowed child events) |

### Return value

This method has no return value.

---

## .ref()

> This is a more advanced API method, that for most use cases will not be necessary.

To retrieve a context aware (environment and locale) reference to any node/location within your "Navigation" data.


```javascript
app.nav.ref('your-reference')
  .then(reference => console.log('The reference:', reference)
  .catch(error => console.error('Something went wrong while retrieving the reference. Details:', error);
```

### Input parameters

The `.ref()` method takes a single parameter

- `{String}` `ref`: The reference you want to retrieve.

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

Next up: [Schemas](/schemas)
