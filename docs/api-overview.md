The Flamelink API is a Promise-based API that is intended to be very intuitive for you as the developer. If you are familiar with JavaScript Promises you should feel right at home. If you are not, take a quick peak at the [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) or [Google Developer](https://developers.google.com/web/fundamentals/getting-started/primers/promises) docs and `then` come straight back.

All API methods are available on your Flamelink `app` instance that you created. It will either be directly available on the instance object for any general methods, like `app.getLocale()`, or it will be available on one of the namespaces, like `app.content.getAll('blog-posts')`. The details for each of these methods can be found under the relevant sub-headings in these docs.

## Firebase App Instance

In the odd chance that you run into any situation where you need to perform an advanced query on your Firebase database that you currently can't do with the Flamelink SDK, we conveniently expose the Firebase app instance for you as `app.firebaseApp`. This means that you are never stuck. We would in any case love to hear from you, so please [log an issue](https://github.com/flamelink/flamelink-sdk/issues) on GitHub and we will see what we can do to help you out.

---

Next up: [Environments](/environments)