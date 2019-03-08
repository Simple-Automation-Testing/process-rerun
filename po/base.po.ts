import {$, browser, ExpectedConditions as EC} from 'protractor'
// import { stepAllure } from '../util/decorator'


class BasePo {
  constructor() {
    // some code
  }

  // @stepAllure('Set test input')
  public async setInput(selector: string, value: string) {
    await browser.wait(EC.visibilityOf($(selector)), 1000)
    await $(selector).sendKeys(value)
  }
}

export {BasePo}
