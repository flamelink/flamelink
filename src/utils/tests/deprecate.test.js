import deprecate from '../deprecate';

describe('Flamelink SDK > Utils > Deprecate', () => {
  it('should log a deprecation warning for the given method and message to the console', () => {
    const testMethod = 'fire';
    const testMessage = 'Rather use "ice()"';
    spyOn(window.console, 'warn');
    deprecate(testMethod, testMessage);
    expect(window.console.warn).toBeCalledWith(
      `[FLAMELINK] The "${testMethod}" method is deprecated and will be removed in the next major version. ${testMessage}`
    );
  });
});
