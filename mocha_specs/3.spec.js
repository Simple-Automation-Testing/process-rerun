const {expect} = require('chai')

describe('Third describe', () => {
  it('it 1 third  describe ', () => {
    expect(1).to.eql(1)
  })
  it('it 2 third describe ', () => {
    expect(1).to.eql(2)
  })
  it('it 3 third describe ', () => {
    expect(1).to.eql(3)
  })
})