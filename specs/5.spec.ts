
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'
describe('Spec 5 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 5 it`, async () => {
    await new BasePo().setInput('#lst-ib', 'test spec 5')
  })
})
