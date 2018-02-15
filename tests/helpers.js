const mockFile = (fileName = 'mock.jpg', fileSize = 128, fileMimeType = 'image/jpg') => {
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
