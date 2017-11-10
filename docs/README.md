# Flamelink SDK

Welcome to the Flamelink Software Development Kit (SDK) docs. If you're reading this, you are most likely already using Flamelink (the CMS) or are considering it for your next project. This is the documentation for the JavaScript SDK that will make your life as a developer so much easier by helping you seamlessly integrate with your Flamelink CMS data.

This SDK is intended to be used in a browser or on a NodeJS server environment. Some functionality, like the Storage functionality is not supported server-side when using the standard [Firebase SDK](https://www.npmjs.com/package/firebase). If you find that you need to reference anything that is stored in the Storage bucket when using this SDK server side, you would need to use Firebase's [official Admin SDK](https://firebase.google.com/docs/admin/setup). The admin SDK also allows you to access other more privileged information that should only be accessed from a server. We support both packages within the Flamelink SDK. See the [Usage](/getting-started?id=creating-your-flamelink-app-instance) section to see how to use either the Firebase client or admin SDK's with Flamelink.

## What is Flamelink?

If you are unfamiliar with Flamelink, please visit our [flamelink.io](https://www.flamelink.io/) website for more info on features, pricing and more.

## Browser Support

Since this SDK is built on top of [Firebase's JavaScript SDK](https://firebase.google.com/docs/web/setup), it naturally means all limitations in terms of browser support will be the same for Flamelink. Take a look at Firebase's [supported environments](https://github.com/firebase/firebase-js-sdk/blob/HEAD/ENVIRONMENTS.md) document for a list of officially supported environments.

Are you ready to [get started](/getting-started) yet?

> 🔥🔥🔥 **PSST. You’re a smoking hot Developer…** 🔥🔥🔥