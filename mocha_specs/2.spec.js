const {expect} = require('chai')

describe('Second describe', () => {
  it('it 1 second describe ', () => {
    expect(1).to.eql(1)
  })
  it('it 2 second describe ', () => {
    expect(1).to.eql(2)
  })
  it('it 3 second describe ', () => {
    expect(1).to.eql(3)
  })
})