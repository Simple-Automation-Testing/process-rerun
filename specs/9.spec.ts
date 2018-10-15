
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

describe('Spec 9 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 9 it first`, async () => {
    const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))
    await sleep(20000)
    await new BasePo().setInput('#lst-ibdsada', 'test spec 9')
    expect([true, false, true]).to.eql({ test___111: 112321241240129940219 })
  })

  it(`Spec 9 it second`, async () => {
    const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))
    await sleep(21)
    await new BasePo().setInput('#lst-ibdsada', 'test spec 9')
    expect([true, false, true]).to.eql({ test___111: 112321241240129940219 })
  })
})
