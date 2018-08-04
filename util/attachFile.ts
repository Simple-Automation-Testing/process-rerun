import * as path from 'path'

declare const allure: any

export const attachFile = () => {
  allure.addArgument('File path', path.basename(__filename))
  process.stdout.write('FAIL')
}
