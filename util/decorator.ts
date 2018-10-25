// declare const spaReporter: any


function stepAllure(msg: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value


    descriptor.value = async function(...args) {

      // spaReporter.createStep(msg)
      // spaReporter.attachData({ test: 'test' })
      // spaReporter.attachData('Step BBBBB')
      try {
        const result = await method.apply(this, args)
        /* tslint:disable:no-unused-expression */
        return result
      } catch (e) {
        /* tslint:disable:no-unused-expression */
        if (e.toString().includes('AssertionError')) {
        } else {
        }
        throw e
      }
    }
    return descriptor
  }
}

export { stepAllure }
