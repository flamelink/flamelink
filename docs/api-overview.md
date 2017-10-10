# API Overview

The Flamelink API is a Promise-based API that is intended to be very intuitive for you as the developer. If you are familiar with JavaScript Promises you should feel right at home. If you are not, take a quick peak at the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or [Google Developer](https://developers.google.com/web/fundamentals/getting-started/primers/promises) docs and `then` come straight back.

All API methods are available on your Flamelink `app` instance that you created. It will either be directly available on the instance object for any general methods, like `app.getLocale()`, or it will be available on one of the namespaces, like `app.content.get('blog-posts')`. The details for each of these methods can be found under the relevant sub-headings in these docs.

> All methods are subject to the [Firebase Realtime Database Rules](https://firebase.google.com/docs/database/security/). For instance, if you have database rules set up that only allows authenticated users access to read and write, you would need to authenticate with a user before trying to use this API. It is always a good idea to only allow as little access as possible. If certain content should only be available behind a login, set up the Firebase Realtime Database Rules to require authentication for the particular read or write actions and then authenticate against this (Flamelink) SDK using the Auth Service.

## Naming Conventions

All API methods used to retrieve data **once** from the Firebase database start with `get`, like `app.content.get()` or `app.nav.getItems()`, etc. Think of this as the equivalent of the `firebaseApp.database().ref().once()` method with nice sugar on top.

Almost all API methods have a *raw* method as well which will return the raw **snapshot** from your Firebase db, where the normal API methods will return the actual values ready to consume. As an example, `app.content.getRaw()` vs `app.content.get()`.

!> The raw methods are not explicitly documented in detail, but it is good to know about them if you find you need to access the response snapshots directly. Be aware that the raw methods can not include all the nice data manipulations that you will get with the standard API methods because all of it is what you will get back from a Firebase query directly, but it includes the filtering and ordering options that Firebase provides.

## Firebase App Instance

In the odd chance that you run into any situation where you need to perform an advanced query on your Firebase database that you currently can't do with the Flamelink SDK, we conveniently expose the Firebase app instance for you as `app.firebaseApp`. This means that you are never stuck. We would in any case love to hear from you, so please [log an issue](https://github.com/flamelink/flamelink/issues) on GitHub and we will see what we can do to help you out.

## Firebase Services

For convenience sake, the [`database`](https://firebase.google.com/docs/database/), [`storage`](https://firebase.google.com/docs/storage/) and [`auth`](https://firebase.google.com/docs/auth/) Firebase services are exposed on the Flamelink app instance as `databaseService`, `storageService` and `authService` respectively.

Most users don't need this and can simply use all the provided API methods you get with the Flamelink SDK.

## Sorting, Filtering and Ordering data

Where appropriate, [Firebase's filtering and ordering query options](https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data) are made available through an optional `options` object that can be passed to the API methods.

### Ordering

The following options are available to order your result sets:

| Property Name | Example Value Param                                    | Usage                                                                   |
| :------------ | :----------------------------------------------------- | :---------------------------------------------------------------------- |
| orderByKey    | can only be `true`                                     | Order the results by the child keys. This normally means the entry IDs. |
| orderByValue  | can only be `true`                                     | Order the results by the child values.                                  |
| orderByChild  | string name of child key, eg. `description` or `price` | Order the results by the specified child key.                           |

> These ordering options can not be combined - only one can be used per query/request.

### Filtering

The following options are available and can be combined with one another:

| Property Name | Example Value Param   | Usage                                                                                                      |
| :------------ | :-------------------- | :--------------------------------------------------------------------------------------------------------- |
| limitToFirst  | `5`, `20`, any Number | Limit the maximum number of entries from the beginning of the ordered list of results.                     |
| limitToLast   | `1`, `10`, any Number | Limit the maximum number of entries from the end of the ordered list of results.                           |
| startAt       | `1`, `10`, any Number | Return items greater than or equal to the specified key or value, depending on the order-by method chosen. |
| endAt         | `1`, `10`, any Number | Return items less than or equal to the specified key or value, depending on the order-by method chosen.    |
| equalTo       | `1`, `10`, any Number | Return items equal to the specified key or value, depending on the order-by method chosen.                 |

?> **Tip:** You can combine the `startAt` and `endAt` options to get a range of entries.

### Sorting

Since the order of JavaScript object properties are not guaranteed and that most data in the Firebase database is stored as objects, Firebase does not guarantee the order of properties in the returned result set. When using the ordering methods, entries will always be sorted *ascending* on the server and you can then use the `limitToFirst` or `limitToLast` methods to retrieve the relevant entries.

With that said, it does seem like modern browsers are sorting JavaScript object properties alphabetically - just be aware of it if you see any gremlins.

!> We are currently contemplating adding client-side sorting to the Flamelink API calls, which will then convert all result objects into arrays for which the order can be guaranteed.

---

Next up: [Environments](/environments)