
import { browser, $, ExpectedConditions as EC } from 'protractor'
import { expect } from 'chai'
// import { attachFile } from '../util/attachFile'
import { BasePo } from '../po/base.po'
const sleep = (timeMs) => new Promise(res => setTimeout(res, timeMs))

require('protractor/built/logger').Logger.prototype.info

describe('Spec 2 describe', () => {

  beforeEach(async () => browser.get('https://google.com'))

  it(`Spec 2 it`, async () => {
    await sleep(5000)
    await new BasePo().setInput('#lst-ibDSADA', 'test spec 2')
    expect('true').to.eql(true)
  })
})

