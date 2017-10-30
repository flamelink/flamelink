> All the methods that you would need to work with the "Navigation" Flamelink data is available on the `app.nav` namespace.

---

## .get()

To retrieve all or a single navigation entry or menu once, ie. Give me the "Main Menu".

This method does not *watch* for real-time db changes, but is intended to retrieve your menu once. If you are looking for real-time methods, take a look at the [`app.nav.subscribe()`](/navigation?id=subscribe) method below.

*To get a single navigation entry:*

```javascript
app.nav.get('main-menu')
  .then(menu => console.log('Main menu:', menu))
  .catch(error => console.error('Something went wrong while retrieving the menu. Details:', error));
```

*To get all navigation entries:*

```javascript
app.nav.get()
  .then(menus => console.log('Menus:', menus))
  .catch(error => console.error('Something went wrong while retrieving the menus. Details:', error));
```

### Input parameters

| Type   | Variable       | Required | Description                                                               |
| ------ | -------------- | -------- | ------------------------------------------------------------------------- |
| String | `navReference` | optional | The navigation entry you want to retrieve (don't specify to retrieve all) |
| Object | `options`      | optional | Additional options                                                        |

#### Available Options

The following options can be specified when retrieving your data:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from the navigation entry object.

*Example*

To retrieve only the `items` from your menu object.

```javascript
app.nav.get('main-menu', { fields: [ 'items' ] })
```

##### Structure

- `structure` **{String}** - Should the menu items be returned as a *list* or *nested* in a tree structure.

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

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.nav.get('main-menu', { event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the navigation `{Object}` on success or will reject with an error if the request fails.

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

*To subscribe to all navigation entries:*

```javascript
app.nav.subscribe(function(error, menus) {
  if (error) {
    return console.error('Something went wrong while retrieving the entries. Details:', error);
  }
  console.log('Menus:', menus);
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

Parameters should be passed in the order of the following table. If an optional parameter, like the `options` are left out, the following parameter just moves left in its place.

| Type     | Variable       | Required | Description                                                              |
| -------- | -------------- | -------- | ------------------------------------------------------------------------ |
| String   | `navReference` | optional | The navigation entry/menu reference you want to retrieve (otherwise all) |
| Object   | `options`      | optional | Additional options                                                       |
| Function | `callback`     | required | Function called once when subscribed and when subscribed data changes    |

#### Available Options

The following options can be specified when retrieving your data:

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

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

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

## .set()

This method can be used to save data and overwrite the whole object for a given navigation entry/menu.

!> Using `set()` overwrites data for the specified entry, including any child nodes.

```javascript
app.nav.set('main-menu', { id: 'new-id', title: 'new-title', items: [] })
  .then(() => console.log('Setting the menu succeeded'))
  .catch(() => console.error('Something went wrong while setting the menu.'));
```

### Input parameters

| Type   | Variable       | Required | Description                                          |
| ------ | -------------- | -------- | ---------------------------------------------------- |
| String | `navReference` | required | The navigation entry you want to set                 |
| Object | `payload`      | required | Payload object to set at the given entry's reference |

### Return value

A `Promise` that resolves when the payload is set or will reject with an error if the request fails.

---

## .update()

This method can be used to save data for a single given navigation entry without overwriting other child properties.

```javascript
app.nav.update('main-menu', { items: [] })
  .then(() => console.log('Updating the navigation entry succeeded'))
  .catch(() => console.error('Something went wrong while updating the navigation entry.'));
```

### Input parameters

| Type   | Variable       | Required | Description                                             |
| ------ | -------------- | -------- | ------------------------------------------------------- |
| String | `navReference` | required | The navigation entry you want to update                 |
| Object | `updates`      | required | Payload object to update at the given entry's reference |

### Return value

A `Promise` that resolves when the payload is update or will reject with an error if the request fails.

---

## .remove()

This method can be used to remove a single given navigation entry.

```javascript
app.nav.remove('main-menu')
  .then(() => console.log('Removing the entry succeeded'))
  .catch(() => console.error('Something went wrong while removing the entry.'));
```

?> **Tip:** An entry can also be removed by passing `null` as the payload to the `app.nav.set()` or `app.nav.update()` methods.

### Input parameters

| Type   | Variable       | Required | Description                             |
| ------ | -------------- | -------- | --------------------------------------- |
| String | `navReference` | required | The navigation entry you want to remove |

### Return value

A `Promise` that resolves when the entry is removed or will reject with an error if the request fails.

---

## .transaction()

> **FIRE RISK WARNING:** This is a more advanced API method, that for most use cases will not be necessary.

If you need to update a navigation entry whose data could be corrupted by concurrent changes, Firebase allows us to perform a "transaction" update that updates data based on the existing data/state.

> Read more about transactions in the [Firebase docs](https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction).

```javascript
app.nav.transaction(
  'main-menu',
  function updateFn(menu) {
    // Take in the existing state (menu) and return the new state
    return menu;
  },
  function callback() {
    // Transaction finished
  }
);
```

### Input parameters

| Type     | Variable       | Required | Description                                                           |
| -------- | -------------- | -------- | --------------------------------------------------------------------- |
| String   | `navReference` | required | The navigation entry you want to update                               |
| Function | `updateFn`     | required | The update function that will be called with the existing entry state |
| Function | `callback`     | optional | The callback function that will be called when transaction finishes   |

### Return value

This method has no return value. Use the optional `callback` function to determine when the transaction succeeded.

---

## .ref()

> **FIRE RISK WARNING:** This is a more advanced API method, that for most use cases will not be necessary.

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

> 🔥🔥🔥 **Now we’re cooking with Fire…** 🔥🔥🔥