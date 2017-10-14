> All the methods that you would need to work with the "Schemas" Flamelink data is available on the `app.schemas` namespace.

---

## .get()

To either retrieve a single schema entry or all the schemas once, ie. Give me my "Product Categories" schema.

This method does not *watch* for real-time db changes, but is intended to retrieve your schema once. If you are looking for real-time methods, take a look at the [`app.schemas.subscribe()`](/schemas?id=subscribe) method below.

*To get a specific schema:*

```javascript
app.schemas.get('product-categories')
  .then(schema => console.log('Product Categories Schema:', schema))
  .catch(error => console.error('Something went wrong while retrieving the schema. Details:', error));
```

*or to get all schemas (with options):*

```javascript
app.schemas.get({ fields: [ 'title', 'description', 'fields ] })
  .then(allSchemas => console.log('All schemas with options applied:', allSchemas))
  .catch(error => console.error('Something went wrong while retrieving the entry. Details:', error));
```

### Input parameters

| Type   | Variable    | Required | Description                                            |
| ------ | ----------- | -------- | ------------------------------------------------------ |
| String | `schemaKey` | optional | The schema database key/reference you want to retrieve |
| Object | `options`   | optional | Additional options                                     |

?> **Tip:** Leave the schema key out or set to `null` to retrieve all schemas

#### Available Options

The following optional options can be specified when retrieving your schema(s):

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from an/each schema entry.

*Example*

To retrieve the `'product-categories'` schema, but only the `title`, `description` and `fields` properties.

```javascript
app.schemas.get('product-categories', { fields: [ 'title', 'description', 'fields' ] })
```

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire schema object at the given reference(s) path.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.schemas.get('product-categories', { event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

Next up: [Storage/Media](/storage)
