
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'
describe('Spec 4 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 4 it`, async function() {

    this.retries(4)
    await new BasePo().setInput('#lst-ib', 'test spec 4')
  })
})
