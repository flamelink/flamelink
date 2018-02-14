const mockFile = (name, size, mimeType) => {
  const fileName = name || 'mock.jpg';
  const fileSize = size || 128;
  const fileMimeType = mimeType || 'image/jpg';

  const range = count => {
    let output = '';

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < count; ++i) {
      output += 'a';
    }
    return output;
  };

  const blob = new Blob([range(fileSize)], { type: fileMimeType });
  blob.lastModifiedDate = new Date();
  blob.name = fileName;

  return blob;
};

module.exports = {
  mockFile
};
