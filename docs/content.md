> All the methods that you would need to work with the "Content" Flamelink data is available on the `app.content` namespace.

---

## .get()

To retrieve all the entries for a given content type once, ie. Give me all my "Blog Posts", etc.

This method does not *watch* for real-time db changes, but is intended to retrieve your content once. If you are looking for real-time methods, take a look at the [`app.content.onAll()`](/content?id=onall) method below.

```javascript
app.content.get('blog-posts')
  .then(blogPosts => console.log('All the blog posts:', blogPosts)
  .catch(error => console.error('Something went wrong while retrieving all the content. Details:', error);
```

### Input parameters

| Type   | Variable      | Required | Description                                      |
| ------ | ------------- | -------- | ------------------------------------------------ |
| String | `contentType` | required | The content type reference you want to retrieve. |
| Object | `options`     | optional | Additional options.                              |

#### Available Options

The following optional options can be specified when retrieving all your data:

- `fields` **{Array}** - A list of fields to be plucked from each entry.

##### Fields Example

To retrieve all of your blog posts, but only the `title`, `description` and `image` property for each individual post.

```javascript
app.content.get('blog-posts', { fields: [ 'title', 'description', 'image' ] })
```

- `populate` **{Array}** - A list of relational fields to be populated with their content for each entry.

##### Populate Example

To retrieve all of your blog posts and populate the `category` property for each individual post.

```javascript
app.content.get('blog-posts', { populate: [ 'category' ] })
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
})
```

?> **Tip:** The array of __strings__ *vs* array of __objects__ syntax can be mixed and matched if you want.

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

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
