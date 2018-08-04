
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

describe('Spec 8 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 8 it`, async () => {
    await new BasePo().setInput('#lst-ib', 'test spec 5')
  })
})

