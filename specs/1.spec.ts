
import { browser } from 'protractor'
import { BasePo } from '../po/base.po'
// import { expect } from 'chai'

describe('Spec 1 describe', () => {
  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 1 it`, async () => {
    await new BasePo().setInput('#lst-ib', 'test spec 1')
  })
})
