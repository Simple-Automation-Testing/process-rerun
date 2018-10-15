
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

describe('Spec 6 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 7 it`, async () => {
    const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))
    await sleep(1000)
    await new BasePo().setInput('#lst-ib', 'test spec 5')
    expect('true').to.eql({ 1: 112321241240129940219 })
  })
})

