export default function deprecate(method = '', message = '') {
  console.warn(
    `[FLAMELINK] The "${method}" method is deprecated and will be removed in the next major version.
    ${message}`
  );
}
