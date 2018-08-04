
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'


describe('Spec 3 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 3 it`, async () => {
    await new BasePo().setInput('#lst-ib', 'test spec 3')
  })
})
