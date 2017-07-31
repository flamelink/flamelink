import flamelink from '../src/index';

test('should expose a function that returns an object when invoked', () => {
  expect(typeof flamelink).toBe('function');
  expect(typeof flamelink()).toBe('object');
});
