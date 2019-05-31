import { onUpdate, requestUpdate } from '../src/fam-element'

describe('onUpdate', () => {
  it('asynchronously calls the updateCallback when an update is requested', async () => {
    const updateCallback = jest.fn()

    @onUpdate(updateCallback)
    class Foo {}

    const test = new Foo()
    requestUpdate(test)

    expect(updateCallback).not.toBeCalled()
    await Promise.resolve()
    expect(updateCallback).toBeCalled()
  })
  it('inherits any previously registered updateCallbacks', async () => {
    const updateCallback1 = jest.fn()
    const updateCallback2 = jest.fn()

    @onUpdate(updateCallback1)
    @onUpdate(updateCallback2)
    class Foo {}

    const test = new Foo()
    requestUpdate(test)

    await Promise.resolve()
    expect(updateCallback1).toBeCalled()
    expect(updateCallback2).toBeCalled()
  })
})

describe('requestUpdate', () => {
  it('does nothing if there are no registered callbacks', async () => {
    const test = {}
    requestUpdate(test)
    await Promise.resolve()
  })
  it('triggers an update once if called multiple times in the same tick', async () => {
    const updateCallback = jest.fn()

    @onUpdate(updateCallback)
    class Foo {}

    const test = new Foo()
    requestUpdate(test)
    requestUpdate(test)

    expect(updateCallback).not.toBeCalled()
    await Promise.resolve()
    expect(updateCallback).toBeCalledTimes(1)
  })
})
