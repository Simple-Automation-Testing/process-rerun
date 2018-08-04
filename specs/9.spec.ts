
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

describe('Spec 9 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 9 it`, async () => {
    await new BasePo().setInput('#lst-ibdsada', 'test spec 9')
  })
})
