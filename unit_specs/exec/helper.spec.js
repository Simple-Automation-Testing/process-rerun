const {getPollTime, getFormedRunCommand} = require('../../lib/helpers')
const {expect} = require('chai')
const path = require('path')

describe('helper functions ', () => {
  it('getPollTime', () => {
    expect(getPollTime('das')).to.eq(1000)
    expect(getPollTime(null)).to.eq(1000)
    expect(getPollTime({})).to.eq(1000)
    expect(getPollTime()).to.eq(1000)
    expect(getPollTime(1)).to.eq(1)
    expect(getPollTime([])).to.eq(1000)
  })
})
