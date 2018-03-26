import error from '../error';

describe('Flamelink SDK > Utils > Error', () => {
  it('should throw a Flamelink specific error when called', () => {
    const testMessage = 'This is fire!';
    expect(error(testMessage).message).toEqual(`[FLAMELINK] ${testMessage}`);
  });
});
