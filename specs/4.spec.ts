
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
import { BasePo } from '../po/base.po'

const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))

describe('Spec 4 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 4 it first`, async function() {
    await sleep(10000)
    this.retries(4)
    expect('true').to.eql({})
    await new BasePo().setInput('#lst-ib', 'test spec 4')
  })

  it(`Spec 4 it second`, async function() {
    await sleep(10000)
    this.retries(4)
    await new BasePo().setInput('#lst-ib', 'test spec 4')
    expect('true').to.eql({})
  })
})
