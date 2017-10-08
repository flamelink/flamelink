?> All storage functionality is only available when used inside a browser on the client side and not for server side use. Firebase Storage is not included in the server side module.

> All the methods that you would need to work with the "Storage"/"Media" Flamelink data is available on the `app.storage` namespace.

!> Note that in order to use the Storage functionality, you need to specify your `storageBucket` key when [instantiating the Flamelink app](/getting-started?id=creating-your-flamelink-app-instance) (or via the Firebase app if used to instantiate Flamelink)

---

## .upload()

To upload files to your Flamelink project and storage bucket.

You can upload files in any of the following formats: [File](https://developer.mozilla.org/en-US/docs/Web/API/File), [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob), [byte arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) or from a String.

When using a String, you can use one of the following 4 string encoding types: raw string (default), `base64`, `base64url` or `data_url`.

*Upload a File or Blob:*

```javascript
const file = ... // get file from the File or Blob API
app.storage.upload(file)
  .then(snapshot => console.log('Upload success!', snapshot))
  .catch(error => console.error('Upload failed. Details:', error));
```

*Upload a Byte Array:*

```javascript
const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);
app.storage.upload(bytes)
  .then(snapshot => console.log('Upload success!', snapshot))
  .catch(error => console.error('Upload failed. Details:', error));
```

*Upload a String:*

```javascript
const string = 'This is a raw string of text to upload.';
app.storage.upload(string)
  .then(snapshot => console.log('Upload success!', snapshot))
  .catch(error => console.error('Upload failed. Details:', error));
```

### Input parameters

| Type                              | Variable   | Required | Description                                       |
| --------------------------------- | ---------- | -------- | ------------------------------------------------- |
| File / Blob / Uint8Array / String | `fileData` | required | The file content to upload to the storage bucket. |
| Object                            | `options`  | optional | Additional options                                |

#### Available Options

The following optional options can be specified when uploading a file:

##### String Type

- `stringEncoding` **{String}** - The encoding used to encode the given string.

*Example*

Upload a `base64` encoded string.

```javascript
const string = '5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB';
app.storage.upload(string, {
  stringEncoding: 'base64'
});
```

Upload a `base64url` encoded string.

```javascript
const string = '5b6p5Y-344GX44G-44GX44Gf77yB44GK44KB44Gn44Go44GG77yB';
app.storage.upload(string, {
  stringEncoding: 'base64url'
});
```

Upload a `data_url` encoded string.

```javascript
const string = 'data:text/plain;base64,5b6p5Y+344GX44G+44GX44Gf77yB44GK44KB44Gn44Go44GG77yB';
app.storage.upload(string, {
  stringEncoding: 'data_url'
});
```

##### Metadata

- `metadata` **{Object}** - When uploading a file, you can specify optional metadata to be associated with the particular file

If not specified, Cloud Storage infers a lot of the metadata automatically for you, so in most cases, it should not be necessary to manually specify the metadata.

Take a look at the [full list](https://firebase.google.com/docs/storage/web/file-metadata#file_metadata_properties) of metadata properties that are allowed.

*Example*

To specify a custom `name` and `contentType` for your file.

```javascript
app.storage.upload(file, {
  metadata: {
    name: 'my-app-logo.png',
    contentType: 'image/jpeg'
  }
});
```

### Return value

This method returns what Firebase calls an `UploadTask` which you can use as a `Promise`, or additionally, you can use it to manage and monitor the status of the upload:

```javascript
const uploadTask = app.storage.upload(file);
```

Your file upload will start immediately when you call the `app.storage.upload()` method.

#### Manage Uploads

After the upload started, you can perform the following actions on it:

*Pause the upload*

```javascript
uploadTask.pause();
```

*Resume the upload*

```javascript
uploadTask.resume();
```

*Cancel the upload*

```javascript
uploadTask.cancel();
```

#### Monitor Upload Progress

Apart from the different management methods you have on the `UploadTask` instance, you can also monitor the progress of your upload by subscribing to its `state_changed` event.

With this functionality, you can easily implement a progress bar for your uploads.

```javascript
uploadTask.on('state_changed', function changeCallback(snapshot) {
  // Called every time a state change occurs
}, function errorCallback(error) {
  // Called if the upload fails
}, function successCallback() {
  // Called when the upload succeeds
});
```

Take a look at the [full example](https://firebase.google.com/docs/storage/web/upload-files#manage_uploads) in the Firebase documentation - keep in mind that instead of using the `put()` method to retrieve your `uploadTask` instance, with Flamelink this instance is returned by the `upload()` method.

---
