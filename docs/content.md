> All the methods that you would need to work with the "Content" Flamelink data is available on the `app.content` namespace.

---

## .get()

To either retrieve a single content entry or all the entries for a given content type once, ie. Give me all my "Blog Posts".

This method does not *watch* for real-time db changes, but is intended to retrieve your content once. If you are looking for real-time methods, take a look at the [`app.content.subscribe()`](/content?id=subscribe) method below.

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

| Type   | Variable         | Required | Description                                     |
| ------ | ---------------- | -------- | ----------------------------------------------- |
| String | `contentType`    | required | The content type reference you want to retrieve |
| String | `entryReference` | optional | The entry ID/reference for given content type   |
| Object | `options`        | optional | Additional options                              |

#### Available Options

The following optional options can be specified when retrieving your data:

- `fields` **{Array}** - A list of fields to be plucked from an/each entry.

##### Fields Example

To retrieve all of your blog posts, but only the `title`, `description` and `image` property for each individual post.

```javascript
app.content.get('blog-posts', { fields: [ 'title', 'description', 'image' ] })
```

- `populate` **{Array}** - A list of relational fields to be populated with their content for each entry.

##### Populate Example

To retrieve all of your blog posts and populate the `category` property for each individual post.

```javascript
app.content.get('blog-posts', { populate: [ 'category' ] });
```

There is also an alternative, more flexible option, to pass through an array of objects instead of strings. The important thing is to set the `field` attribute to the name of the field that should be populated.

This option allows you to apply other options and filters like the `fields` option above to each populated entry, as well as allow infinitely nested relationships. As an example, the following code snippet will find all your blog posts and then populate the `category` relational field, but only return the `id`, `name`, `icon` and `section` for each category assigned to each blog post. Additionally, each `category` might be related to a `section`, so populate that as well.

```javascript
app.content.get('blog-posts', {
  populate: [{
    field: 'category',
    fields: [ 'id', 'name', 'icon', 'section' ],
    populate: [ 'section' ]
  }]
});
```

?> **Tip:** The array of __strings__ *vs* array of __objects__ syntax can be mixed and matched if you want.

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

*or to subscirbe to an individual entry for that type (with options):*

```javascript
app.content.subscribe('blog-posts', '1502966447501', { fields: [ 'title', 'description' ] }, function(error, blogPost) {
  if (error) {
    return console.error('Something went wrong while retrieving the entry. Details:', error);
  }
  console.log('Individual blog post with options applied:', blogPost);
});
```

### Input parameters

Parameters should be passed in the order of the following table. If an optional parameter, like the `options` are left out, the following parameter just moves in its place.

| Type     | Variable         | Required | Description                                                           |
| -------- | ---------------- | -------- | --------------------------------------------------------------------- |
| String   | `contentType`    | required | The content type reference you want to retrieve                       |
| String   | `entryReference` | optional | The entry ID/reference for given content type                         |
| Object   | `options`        | optional | Additional options                                                    |
| Function | `callback`       | required | Function called once when subscribed and when subscribed data changes |

#### Available Options

The following optional options can be specified when retrieving your data:

- `fields` **{Array}** - A list of fields to be plucked from an/each entry.

##### Fields Example

To retrieve all of your blog posts, but only the `title`, `description` and `image` property for each individual post.

```javascript
app.content.subscribe('blog-posts', { fields: [ 'title', 'description', 'image' ] }, function(error, blogPosts) {
  // Handle callback
});
```

- `populate` **{Array}** - A list of relational fields to be populated with their content for each entry.

##### Populate Example

To retrieve all of your blog posts and populate the `category` property for each individual post.

```javascript
app.content.subscribe('blog-posts', { populate: [ 'category' ] }, function(error, blogPosts) {
  // Handle callback
})
```

The alternative `populate` option, as described [above](/content?id=populate-example), can also be used - just remember to pass your callback function as the last parameter.

### Return value

This method has no return value, but makes use of an [error-first callback](https://www.google.com/search?q=error-first+callback&oq=javascript+error-first+callback) function that should be passed as the last argument.

---

## .unsubscribe()

This method is used to unsubscribe from previously subscribed content updates. It is the equivalent of Firebase's `.off()` method and taking the Flamelink database structure into consideration.

*To unsubscribe from all entries for a specific content type:*

```javascript
app.content.unsubscribe('blog-posts');
```

*or to unsubscirbe from an individual entry for that type:*

```javascript
app.content.unsubscribe('blog-posts', '1502966447501');
```

### Input parameters

All parameters are optional and calling this method without options will unsubscribe from all callbacks.

| Type     | Variable         | Required | Description                                             |
| -------- | ---------------- | -------- | ------------------------------------------------------- |
| String   | `contentType`    | optional | The content type reference you want to unsubscribe from |
| String   | `entryReference` | optional | The entry ID/reference for given content type           |

### Return value

This method has no return value.

---

## .ref()

> This is a more advanced API method, that for most use cases will not be necessary.

To retrieve a context aware (environment and locale) reference to any node/location within your "Content" data.

```javascript
app.content.ref('your-reference')
  .then(reference => console.log('The reference:', reference)
  .catch(error => console.error('Something went wrong while retrieving the reference. Details:', error);
```

### Input parameters

The `.ref()` method takes a single parameter

| Type   | Variable    | Required | Description                         |
| ------ | ----------- | -------- | ----------------------------------- |
| String | `reference` | required | The reference you want to retrieve. |

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

Next up: [Navigation/Menus](/navigation)
