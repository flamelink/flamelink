> All the methods that you would need to work with the "Content" Flamelink data is available on the `app.content` namespace.

---

## .get()

To either retrieve a single content entry or all the entries for a given content type once, ie. Give me all my "Blog Posts".

This method does not *watch* for real-time db changes, but is intended to retrieve your content once. If you're looking for real-time methods, take a look at the [`app.content.subscribe()`](/content?id=subscribe) method below.

*To get all entries for a specific content type:*

```javascript
app.content.get('blog-posts')
  .then(blogPosts => console.log('All the blog posts:', blogPosts))
  .catch(error => console.error('Something went wrong while retrieving all the content. Details:', error));
```

*or to get an individual entry for that type (with options):*

```javascript
app.content.get('blog-posts', '1502966447501', { fields: [ 'title', 'description' ] })
  .then(blogPost => console.log('Individual blog post with options applied:', blogPost))
  .catch(error => console.error('Something went wrong while retrieving the entry. Details:', error));
```

### Input parameters

| Type   | Variable         | Required | Description                                                  |
|--------|------------------|----------|--------------------------------------------------------------|
| String | `contentType`    | required | The content type reference (Schema key) you want to retrieve |
| String | `entryReference` | optional | The entry ID/reference for given content type                |
| Object | `options`        | optional | Additional options                                           |

#### Available Options

The following options can be specified when retrieving your data:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from an/each entry.

*Example*

To retrieve all of your blog posts, but only the `title`, `description` and `image` property for each individual post.

```javascript
app.content.get('blog-posts', { fields: [ 'title', 'description', 'image' ] })
```

##### Populate

- `populate` **{Array|Boolean}** - A list of relational and/or media (images/files) fields to be populated with their content for each entry.

?> **HOT TIP:** When specifying a media field to be populated for you, it will replace the file ID for you with an object containing all the files data including a `url` property which is the URL to your file in the storage bucket.

?> **EXTRA HOT TIP:** If you set `populate: true`, all possible relational, repeater, field group and media fields will automatically be populated for you.

*Example*

To retrieve all of your blog posts and populate the `category` property for each individual post.

```javascript
app.content.get('blog-posts', { populate: [ 'category' ] });
```

To retrieve all of your blog posts and populate *everything* for each individual post.

```javascript
app.content.get('blog-posts', { populate: true });
```

There is also an alternative, more flexible option, to pass through an array of objects instead of strings. The important thing is to set the `field` attribute to the name of the field that should be populated.

This option allows you to apply other options and filters like the `fields` option above to each populated entry, as well as allow infinitely nested relationships. As an example, the following code snippet will find all your blog posts and then populate the `category` relational field along with the `banner-image` media field, but only return the `id`, `name`, `icon` and `section` for each category assigned to each blog post. Additionally, each `category` might be related to a `section`, so populate that as well.

```javascript
app.content.get('blog-posts', {
  populate: [
    {
      field: 'category',
      fields: [ 'id', 'name', 'icon', 'section' ],
      populate: [ 'section' ]
    },
    {
      field: 'banner-image'
    }
  ]
});
```

!> **For advanced use:** It is also possible to populate fields for `repeater` and `fieldset` fields by specifying the `subFields` to populate.

```javascript
app.content.get('blog-posts', {
  populate: [
    {
      field: 'some-repeater-field',
      subFields: [ 'field-inside-repeater-field' ]
    }
  ]
});
```

?> **Tip:** The array of __strings__ *vs* array of __objects__ syntax can be mixed and matched if you want.

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire content at the given reference(s) path.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.content.get('blog-posts', { event: 'child_changed' })
```

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

## .getByField()

To retrieve a single entry once for a given field and value, ie. Give me my blog post with the `slug` `"my-famous-blog-post"`.

```javascript
app.content.getByField('blog-posts', 'slug', 'my-famous-blog-post')
  .then(blogPost => console.log('Individual blog post:', blogPost))
  .catch(error => console.error('Something went wrong while retrieving the entry. Details:', error));
```

> This method is just a convenient way of querying your data, but the same can be achieved with the standard `app.content.get()` method by adding the following options:

```javascript
app.content.get('blog-posts', { orderByChild: 'slug', equalTo: 'my-famous-blog-post' })
  .then(blogPost => console.log('Individual blog post:', blogPost))
  .catch(error => console.error('Something went wrong while retrieving the entry. Details:', error));
```

### Input parameters

| Type   | Variable      | Required | Description                                                  |
|--------|---------------|----------|--------------------------------------------------------------|
| String | `contentType` | required | The content type reference (Schema key) you want to retrieve |
| String | `fieldName`   | required | The name of the field to check the value against             |
| String | `fieldValue`  | required | The value of the given field to find                         |
| Object | `options`     | optional | Additional options                                           |

#### Available Options

All options available to the `app.content.get()` method, except for the already applied `orderByChild` and `equalTo`, is available for this method.

*Example*

```javascript
app.content.getByField('blog-posts', 'slug', 'my-blog-post-title', {
  event: 'child_changed',
  fields: [ 'title', 'description', 'image', 'category' ],
  populate: [{
    field: 'category',
    fields: [ 'id', 'name', 'icon', 'section' ],
    populate: [ 'section' ]
  }]
});
```

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

## .subscribe()

This method is similar to the `app.content.get()` method except that where the `.get()` method returns a `Promise` resolving to the once-off value, this method subscribes to either a single content entry or all the entries for real-time updates. A callback method should be passed as the last argument which will be called each time the data changes in your Firebase db.

If you are looking for retrieving data once, take a look at the [`app.content.get()`](/content?id=get) method above.

*To subscribe to all entries for a specific content type:*

```javascript
app.content.subscribe('blog-posts', function(error, blogPosts) {
  if (error) {
    return console.error('Something went wrong while retrieving all the content. Details:', error);
  }
  console.log('All the blog posts:', blogPosts);
});
```

*To subscribe to the `child_added` child event for a specific content type:*

```javascript
app.content.subscribe('blog-posts', { event: 'child_added' }, function(error, blogPost) {
  if (error) {
    return console.error('Something went wrong while retrieving the content that got added. Details:', error);
  }
  console.log('The blog post that got added:', blogPost);
});
```

*To subscribe to an individual entry for that type (with options):*

```javascript
app.content.subscribe('blog-posts', '1502966447501', { fields: [ 'title', 'description' ] }, function(error, blogPost) {
  if (error) {
    return console.error('Something went wrong while retrieving the entry. Details:', error);
  }
  console.log('Individual blog post with options applied:', blogPost);
});
```

?> **HOT TIP:** If you are using [RxJS Observables](http://reactivex.io/rxjs/) and you don't like callbacks, turn this `subscribe` method into an **Observable** like this:

```javascript
const getContentObservable = Rx.Observable.bindCallback(app.content.subscribe);
getContentObservable('blog-posts', '1502966447501', { fields: [ 'title', 'description' ] }).subscribe()
```

### Input parameters

Parameters should be passed in the order of the following table. If an optional parameter, like the `options` are left out, the following parameter just moves in its place.

| Type     | Variable         | Required | Description                                                           |
|----------|------------------|----------|-----------------------------------------------------------------------|
| String   | `contentType`    | required | The content type reference (Schema key) you want to retrieve          |
| String   | `entryReference` | optional | The entry ID/reference for given content type                         |
| Object   | `options`        | optional | Additional options                                                    |
| Function | `callback`       | required | Function called once when subscribed and when subscribed data changes |

#### Available Options

The following options can be specified when retrieving your data:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from an/each entry.

*Example*

To retrieve all of your blog posts, but only the `title`, `description` and `image` property for each individual post.

```javascript
app.content.subscribe('blog-posts', { fields: [ 'title', 'description', 'image' ] }, function(error, blogPosts) {
  // Handle callback
});
```

##### Populate

- `populate` **{Array}** - A list of relational or media fields to be populated with their content for each entry.

*Example*

To retrieve all of your blog posts and populate the `category` property for each individual post.

```javascript
app.content.subscribe('blog-posts', { populate: [ 'category' ] }, function(error, blogPosts) {
  // Handle callback
})
```

The alternative `populate` option, as described [above](/content?id=populate-example), can also be used - just remember to pass your callback function as the last parameter.

##### Event

- `event` **{String}** - The Firebase child event to retrieve data for. By default, the event is `value`, which is used for retrieving the entire content at the given reference(s) path.

*Example*

The allowed child event options are: `value`, `child_added`, `child_changed`, `child_removed` and `child_moved`.

> To read more about these events, see the [Firebase docs](https://firebase.google.com/docs/database/web/lists-of-data#listen_for_child_events).

```javascript
app.content.subscribe('blog-posts', { event: 'child_changed' }, function(error, blogPosts) {
  // Handle callback
})
```

### Return value

This method has no return value, but makes use of an [error-first callback](https://www.google.com/search?q=error-first+callback&oq=javascript+error-first+callback) function that should be passed as the last argument.

---

## .unsubscribe()

This method is used to unsubscribe from previously subscribed content updates or other child events. It is the equivalent of Firebase's `.off()` method and taking the Flamelink database structure into consideration.

*To unsubscribe from all entries for a specific content type:*

```javascript
app.content.unsubscribe('blog-posts');
```

*To unsubscribe from an individual entry for that type:*

```javascript
app.content.unsubscribe('blog-posts', '1502966447501');
```

*To unsubscribe from the `child_removed` event for a specific content type:*

```javascript
app.content.unsubscribe('blog-posts', 'child_removed');
```

*To unsubscribe from the `child_moved` event for an individual entry for that type:*

```javascript
app.content.unsubscribe('blog-posts', '1502966447501', 'child_moved');
```

### Input parameters

All parameters are optional and calling this method without options will unsubscribe from all callbacks.

| Type   | Variable         | Required | Description                                                          |
|--------|------------------|----------|----------------------------------------------------------------------|
| String | `contentType`    | optional | The content type reference (Schema key) you want to unsubscribe from |
| String | `entryReference` | optional | The entry ID/reference for given content type                        |
| String | `event`          | optional | The child event to unsubscribe from (see allowed child events)       |

### Return value

This method has no return value.

---

## .set()

This method can be used to save data and overwrite the whole object for a single given entry.

!> Using `set()` overwrites data for the specified entry, including any child nodes. For this reason, this method can only be used to set the data for an individual entry at a time and not to set all the entries for a given content type.

```javascript
app.content.set('blog-posts', '1502966447501', { title: 'new-title' })
  .then(() => console.log('Setting the entry succeeded'))
  .catch(() => console.error('Something went wrong while setting the entry.'));
```

?> It is important to note that this method will set the entry's `id` as well as the `createdBy` and `createdDate` meta data for you.

### Input parameters

| Type   | Variable         | Required | Description                                                           |
|--------|------------------|----------|-----------------------------------------------------------------------|
| String | `contentType`    | required | The content type reference (Schema key) for the entry you want to set |
| String | `entryReference` | required | The entry ID/reference for given content type to set                  |
| Object | `payload`        | required | Payload object to set at the given entry's reference                  |

### Return value

A `Promise` that resolves when the payload is set or will reject with an error if the request fails.

---

## .update()

This method can be used to save data for a single given entry without overwriting other child properties.

!> This method can only be used to update the data for an individual entry at a time and not to update all the entries for a given content type.

```javascript
app.content.update('blog-posts', '1502966447501', { title: 'new-title' })
  .then(() => console.log('Updating the entry succeeded'))
  .catch(() => console.error('Something went wrong while updating the entry.'));
```

?> It is important to note that this method will set the entry's `id` as well as the `lastModifiedBy` and `lastModifiedDate` meta data for you.

### Input parameters

| Type   | Variable         | Required | Description                                                              |
|--------|------------------|----------|--------------------------------------------------------------------------|
| String | `contentType`    | required | The content type reference (Schema key) for the entry you want to update |
| String | `entryReference` | required | The entry ID/reference for given content type to update                  |
| Object | `updates`        | required | Payload object to update at the given entry's reference                  |

### Return value

A `Promise` that resolves when the payload is update or will reject with an error if the request fails.

---

## .remove()

This method can be used to remove a single given entry.

```javascript
app.content.remove('blog-posts', '1502966447501')
  .then(() => console.log('Removing the entry succeeded'))
  .catch(() => console.error('Something went wrong while removing the entry.'));
```

?> **Tip:** An entry can also be removed by passing `null` as the payload to the `app.content.set()` or `app.content.update()` methods.

### Input parameters

| Type   | Variable         | Required | Description                                                              |
|--------|------------------|----------|--------------------------------------------------------------------------|
| String | `contentType`    | required | The content type reference (Schema key) for the entry you want to remove |
| String | `entryReference` | required | The entry ID/reference for given content type to remove                  |

### Return value

A `Promise` that resolves when the entry is removed or will reject with an error if the request fails.

---

> 🔥🔥🔥 **Are your fingers Flaming yet? They should be!** 🔥🔥🔥

## .transaction()

> **FIRE RISK WARNING:** This is a more advanced API method, that for most use cases will not be necessary.

If you need to update an entry whose data could be corrupted by concurrent changes, Firebase allows us to perform a "transaction" update that updates data based on the existing data/state.

> Read more about transactions in the [Firebase docs](https://firebase.google.com/docs/reference/js/firebase.database.Reference#transaction).

```javascript
app.content.transaction(
  'blog-posts',
  '1502966447501',
  function updateFn(blogEntry) {
    // Take in the existing state (blogEntry) and return the new state
    return blogEntry;
  },
  function callback() {
    // Transaction finished
  }
);
```

### Input parameters

| Type     | Variable         | Required | Description                                                              |
|----------|------------------|----------|--------------------------------------------------------------------------|
| String   | `contentType`    | required | The content type reference (Schema key) for the entry you want to update |
| String   | `entryReference` | required | The entry ID/reference for given content type to update                  |
| Function | `updateFn`       | required | The update function that will be called with the existing entry state    |
| Function | `callback`       | optional | The callback function that will be called when transaction finishes      |

### Return value

This method has no return value. Use the optional `callback` function to determine when the transaction succeeded.

---

## .ref()

> **FIRE RISK WARNING:** This is a more advanced API method, that for most use cases will not be necessary.

To retrieve a context aware (environment and locale) reference to any node/location within your "Content" data.

```javascript
app.content.ref('your-reference')
  .then(reference => console.log('The reference:', reference)
  .catch(error => console.error('Something went wrong while retrieving the reference. Details:', error);
```

### Input parameters

The `.ref()` method takes a single parameter

| Type   | Variable    | Required | Description                         |
|--------|-------------|----------|-------------------------------------|
| String | `reference` | required | The reference you want to retrieve. |

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

Next up: [Navigation/Menus](/navigation)
