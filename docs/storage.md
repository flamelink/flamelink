?> All storage functionality is only available when used inside a browser on the client side and not for server side use. Firebase Storage is not included in the server side module.

> All the methods that you would need to work with the "Storage"/"Media" Flamelink data is available on the `app.storage` namespace.

!> Note that in order to use the Storage functionality, you need to specify your `storageBucket` key when [instantiating the Flamelink app](/getting-started?id=creating-your-flamelink-app-instance) (or via the Firebase app if used to instantiate Flamelink)

---

## .upload()

To upload files to your Flamelink project and storage bucket.

!> Uploading files server-side (from NodeJS) is currently not supported.

You can upload files in any of the following formats: [File](https://developer.mozilla.org/en-US/docs/Web/API/File), [Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob), [byte arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) or from a String.

When using a String, you can use one of the following 4 string encoding types: raw string (default), `base64`, `base64url` or `data_url`.

*Upload a File or Blob:*

```javascript
const file = ... // get file from the File or Blob API
app.storage.upload(file)
  .then(uploadTask => console.log('Upload success!', uploadTask))
  .catch(error => console.error('Upload failed. Details:', error));
```

*Upload a Byte Array:*

```javascript
const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21]);
app.storage.upload(bytes)
  .then(uploadTask => console.log('Upload success!', uploadTask))
  .catch(error => console.error('Upload failed. Details:', error));
```

*Upload a String:*

```javascript
const string = 'This is a raw string of text to upload.';
app.storage.upload(string)
  .then(uploadTask => console.log('Upload success!', uploadTask))
  .catch(error => console.error('Upload failed. Details:', error));
```

?> It is important to note that this method will set the file's `id` as well as the `createdBy` and `createdDate` meta data for you.

### Input parameters

| Type                              | Variable   | Required | Description                                       |
|-----------------------------------|------------|----------|---------------------------------------------------|
| File / Blob / Uint8Array / String | `fileData` | required | The file content to upload to the storage bucket. |
| Object                            | `options`  | optional | Additional options                                |

#### Available Options

The following options can be specified when uploading a file:

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

##### Folder ID

- `folderId` **{String}** - When uploading a file, you can specify the folder to which the file should be uploaded within the Firebase real-time db. (By default files will be uploaded to the "Root" folder)

*Example*

```javascript
app.storage.upload(file, {
  folderId: '1505670341980'
});
```

##### Folder Name

- `folderName` **{String}** - When uploading a file, you can specify the folder to which the file should be uploaded within the Firebase real-time db. (By default files will be uploaded to the "Root" folder)

This is a convenient alternative to the `folderId` option above, for when you know the folder's name, but not necessarily the ID it has in the database.

*Example*

```javascript
app.storage.upload(file, {
  folderName: 'Products'
});
```

##### Sizes

- `sizes` **{Array}** - When uploading a file, you can optionally specify the different image sizes that should be created for you.

Both the `width` and `height` properties are used as a maximum width or height, respectively. ie. Images won't be scaled up in width or height if they are already smaller than the specified pixel value.

The `quality` property can be any number between `0` and `1` and represents the quality in percentage. `0` being `0%` and `1` being `100%`.

> When this setting is not specified, the image sizes that are specified in the project "Settings" will be used. See [`app.settings.getImageSizes()`](settings?id=getimagesizes)

> When this setting is specified without `overwriteSizes`, the image sizes that are specified in the project "Settings" will be used in conjunction with the sizes specified.

*Example*

```javascript
app.storage.upload(file, {
  sizes: [
    {
      width: 240,
      height: 360,
      quality: 1
    },
    {
      width: 320,
      height: 480,
      quality: 0.8
    },
    {
      width: 640,
      height: 9999,
      quality: 1
    },
    {
      width: 800,
      height: 9999,
      quality: 1
    },
    {
      width: 1024,
      height: 2400,
      quality: 0.75
    },
    {
      width: 2300,
      height: 9999,
      quality: 1
    }
  ]
});

```

!> Since the Flamelink CMS uses a **240px** wide image as preview image, this method will always generate that image regardless of whether it is specified or not.

##### Overwrite Sizes

- `overwriteSizes` **{Boolean}** - When uploading a file, you can omit creating the default sizes defined in the project "Settings" area.

> When this setting is not specified, the image sizes that are specified in the project "Settings" will be used in conjunction with the sizes specified.

*Example*

```javascript
app.storage.upload(file, {
  overwriteSizes: true,
  sizes: [
    {
      width: 80,
      height: 9999,
      quality: 1
    }
  ]
});
```

!> Since the Flamelink CMS uses a **240px** wide image as preview image, this method will always generate that image regardless of whether it is specified or not.

### Return value

A `UploadTask` instance, which is similar to a `Promise` and an `Observable` that resolves when the upload is complete or will reject with an error if the request fails.
The response object will include the `flamelinkFileId` and `flamelinkFolderId` in the `customMetadata` object inside `metadata` if you need to acces it for some reason.

---

## .getFolders()

To retrieve a list of all the media folders in the CMS.

```javascript
app.storage.getFolders()
  .then(folders => console.log('Media folders:', folders))
  .catch(error => console.error('Something went wrong while retrieving the folders. Details:', error));
```

### Input parameters

This method only takes a single optional argument.

| Type   | Variable  | Required | Description                         |
|--------|-----------|----------|-------------------------------------|
| Object | `options` | optional | Order, filter and structure options |

#### Available Options

All the standard order, filter and fields options are available, but they are not particularly useful here.

##### Structure

- `structure` **{String}** - Should the folders be returned as a list or nested in a tree structure.

*Example*

To retrieve your folders in a nested structure, specify either `nested` or `tree` as the `structure` option

```javascript
app.storage.getFolders({ structure: 'nested' });
```

?> **Tip:** Setting the `structure` to anything other than `nested` or `tree` will return a plain array of folders

### Return value

A `Promise` that resolves to the `{Array}` of folder objects on success or will reject with an error if the request fails.

---

## .getFiles()

Use to retrieve all the files in the CMS.

```javascript
app.storage.getFiles()
  .then(files => console.log('Files:', files))
  .catch(error => console.error('Something went wrong while retrieving the files. Details:', error));
```

### Input parameters

This method only takes a single optional argument. Used without any parameters will return all your files.

| Type   | Variable  | Required | Description                         |
|--------|-----------|----------|-------------------------------------|
| Object | `options` | optional | Order, filter and structure options |

#### Available Options

All the standard order, filter and fields options are available, but they are not particularly useful here.

Some of the more useful options are:

##### Folder ID

- `folderId` **{String}** - To retrieve all the files for a specific folder given the Folder ID. (By default all files will be returned)

*Example*

```javascript
app.storage.getFiles({
  folderId: '1505670341980'
});
```

##### Folder Name

- `folderName` **{String}** - To retrieve all the files for a specific folder given the Folder Name. (By default all files will be returned)

This is a convenient alternative to the `folderId` option above, for when you know the folder's name, but not necessarily the ID it has in the database.

*Example*

```javascript
app.storage.getFiles({
  folderName: 'Products'
});
```

##### Media Type

- `mediaType` **{String}** - Can be either `"files"` or `"images"`.

*Example*

To retrieve all the files for a specific media type

```javascript
app.storage.getFiles({ mediaType: 'images' });
```

### Return value

A `Promise` that resolves to the `{Array}` of folder objects on success or will reject with an error if the request fails.

---

## .getFile()

Use to retrieve a single file from the CMS.

```javascript
app.storage.getFile('1505670341980')
  .then(file => console.log('File:', file))
  .catch(error => console.error('Something went wrong while retrieving the file. Details:', error));
```

### Input parameters

This method has one required parameter, which is the file ID and also an optional `options` argument.

| Type   | Variable  | Required | Description                                          |
|--------|-----------|----------|------------------------------------------------------|
| String | `fileId`  | required | The file ID you want to retrieve the file object for |
| Object | `options` | optional | Optional options                                     |

#### Available Options

All the standard order, filter and fields options are available.

The most useful option is probably the `fields` option:

##### Fields

- `fields` **{Array}** - A list of fields to be plucked from the file object.

*Example*

To retrieve only the `id`, `file` and `type` property for the file.

```javascript
app.storage.getFile('1505670341980', { fields: [ 'id', 'file', 'type' ] })
```

### Return value

A `Promise` that resolves to the file `{Object}` on success or will reject with an error if the request fails.

---

## .getURL()

A convenience method to quickly retrieve the URL of a single file.

```javascript
app.storage.getURL('1505670341980')
  .then(url => console.log('File URL:', url))
  .catch(error => console.error('Something went wrong while retrieving the file URL. Details:', error));
```

### Input parameters

This method has one required parameter, which is the file ID and also an optional `options` argument.

| Type   | Variable  | Required | Description                                  |
|--------|-----------|----------|----------------------------------------------|
| String | `fileId`  | required | The file ID you want to retrieve the URL for |
| Object | `options` | optional | Optional options                             |

#### Available Options

The only available option currently is:

##### Size

- `size` **{Object}** - The size of the image you want to retrieve.

*Example*

To retrieve a sized image with a width of `1024`, height of `9999` and a quality of `1` for the given file ID. If the given size exists for the particular image, it will be returned, otherwise the first available size bigger than the given size, ultimately falling back to the original image if nothing exists.

```javascript
app.storage.getURL('1505670341980', {
  size: {
    width: 1024,
    height: 9999,
    quality: 0.75
  }
})
```

Alternatively, if you know what the sized path is for the image, you can specify that (you can find the sized path by looking in your Firebase Storage bucket under `flamelink > media > sized`:

```javascript
app.storage.getURL('1505670341980', {
  size: {
    path: '1024_9999_75'
  }
})
```

?> **HOT TIP:** Use `size: 'device'` to find a size closest to your device's viewport

### Return value

A `Promise` that resolves to the download URL `{String}` on success or will reject with an error if the request fails.

---

## .deleteFile()

Delete a file from the Cloud Storage Bucket as well as from the Firebase real-time database.

> If different sizes were generated when the image was first uploaded, those will also be deleted for you.

```javascript
app.storage.deleteFile('1505670341980')
  .then(() => console.log('File successfully deleted!'))
  .catch(error => console.error('Something went wrong while deleting the file. Details:', error));
```

### Input parameters

This method takes only one required parameter, the `fileId` for the file you want to delete.

| Type   | Variable | Required | Description                                 |
|--------|----------|----------|---------------------------------------------|
| String | `fileId` | required | The file ID for the file you want to delete |

#### Available Options

There are currently no options.

### Return value

A `Promise` that resolves on success or will reject with an error if the request fails.

---

## .getMetadata()

To retrieve the metadata for a file in the Cloud Storage Bucket.

```javascript
app.storage.getMetadata('1505670341980')
  .then((metadata) => console.log('File metadata:', metadata))
  .catch(error => console.error('Something went wrong while retrieving the file metadata. Details:', error));
```

### Input parameters

This method takes only one required parameter, the `fileId` for the file you want to retrieve the metadata.

| Type   | Variable | Required | Description                                                |
|--------|----------|----------|------------------------------------------------------------|
| String | `fileId` | required | The file ID for the file you want to retrieve the metadata |

#### Available Options

There are currently no options.

### Return value

A `Promise` that resolves to the metadata `{Object}` on success or will reject with an error if the request fails.

---

## .updateMetadata()

To update the metadata for a file in the Cloud Storage Bucket.

```javascript
app.storage.updateMetadata('1505670341980', { contentLanguage: 'en' })
  .then((metadata) => console.log('Updated file metadata:', metadata))
  .catch(error => console.error('Something went wrong while updating the file metadata. Details:', error));
```

> For a full list of all the available metadata properties that can be set, see [here](https://firebase.google.com/docs/storage/web/file-metadata#file_metadata_properties)

### Input parameters

This method takes two required parameters:

| Type   | Variable  | Required | Description                                              |
|--------|-----------|----------|----------------------------------------------------------|
| String | `fileId`  | required | The file ID for the file you want to update the metadata |
| Object | `payload` | required | The metadata properties you want to update               |

?> **HOT TIP:** To delete the metadata for a specific property, set it's value to `null`

### Return value

A `Promise` that resolves to the updated metadata `{Object}` on success or will reject with an error if the request fails.

---

## .ref()

> **FIRE RISK WARNING:** This is a more advanced API method, that for most use cases will not be necessary.

To retrieve a context aware (folder structure) reference to any node/location within your Storage bucket.

*Reference to given image within your bucket*

```javascript
app.storage.ref('image.jpg')
  .then(reference => console.log('The reference:', reference)
  .catch(error => console.error('Something went wrong while retrieving the reference. Details:', error);
```

*Reference to given URL within your bucket*

```javascript
app.storage.ref('gs://your-storage-bucket/flamelink/image.jpg')
  .then(reference => console.log('The reference:', reference)
  .catch(error => console.error('Something went wrong while retrieving the reference. Details:', error);
```

### Input parameters

The `.ref()` method takes a two parameters

| Type   | Variable                 | Required | Description                                                                                          |
|--------|--------------------------|----------|------------------------------------------------------------------------------------------------------|
| String | `filename` or `filepath` | required | Either the filename for which you want to retrieve a reference or a full URL to your storage bucket. |
| Object | `options`                | optional | Optional options. Currently only applies if you pass through a `filename` and not a `filepath`.      |

#### Available Options

The following options can be specified when getting a reference:

##### Width

- `width` **{String}** - The width of the image (if resized and not a reference to the original image)

*Example*

Retrieve a reference to the resized image with a width of 1024px.

```javascript
app.storage.ref('image.jpg', {
  width: '1024'
});
```

### Return value

A `Promise` that resolves to the reference `{Object}` on success or will reject with an error if the request fails.

---

Next up: [Environments](/environments)

> 🔥🔥🔥 **Grab a Fire Extinguisher. Your coding abilities are a Raging Inferno.** 🔥🔥🔥