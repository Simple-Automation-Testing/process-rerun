
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))
describe('Spec 3 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 3 it first `, async () => {
    await sleep(15000)
    await new BasePo().setInput('#lst-ib', 'test spec 3')
  })

  it(`Spec 3 it second`, async () => {
    await sleep(500)
    await new BasePo().setInput('#lst-ib', 'test spec 3')
  })

  it(`Spec 3 it third`, async () => {
    await sleep(2500)
    await new BasePo().setInput('#lst-ib', 'test spec 3')
  })
})
