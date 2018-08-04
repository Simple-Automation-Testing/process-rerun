declare const allure: any

function stepAllure(msg: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value
    const reporter = allure._allure

    descriptor.value = async function(...args) {


      reporter.startStep(msg, Date.now())
      try {
        const result = await method.apply(this, args)
        /* tslint:disable:no-unused-expression */
        reporter.endStep('passed', Date.now())
        return result
      } catch (e) {
        /* tslint:disable:no-unused-expression */
        allure.createAttachment('ERROR', e.toString(), 'text/plain')
        if (e.toString().includes('AssertionError')) {
          reporter.endStep('failed', Date.now())
        } else {
          reporter.endStep('broken', Date.now())
        }
        throw e
      }
    }
    return descriptor
  }
}

export { stepAllure }
