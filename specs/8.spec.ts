
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

describe('Spec 8 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 8 it`, async () => {
    const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))
    await sleep(18000)
    await new BasePo().setInput('#lst-ib', 'test spec 5')
    expect(true).to.eql({ test___111: 112321241240129940219 })
  })
})

