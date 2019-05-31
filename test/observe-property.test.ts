import { observeProperty } from '../src/observe-property'

describe('observeProperty', () => {
  it('calls the callback when the observed property is updated', () => {
    const callback = jest.fn()
    class Foo {
      @observeProperty(callback)
      bar?: string
    }
    const instance = new Foo()
    instance.bar = 'value'
    expect(callback).toBeCalledWith(instance, undefined, 'value')

    callback.mockClear()
    instance.bar = 'value2'
    expect(callback).toBeCalledWith(instance, 'value', 'value2')
  })
  it('inherits existings property descriptors', () => {
    const callback = jest.fn()
    class Foo {
      internalBar?: string
      @observeProperty(callback)
      get bar() {
        return this.internalBar
      }
      set bar(value) {
        this.internalBar = value
      }
    }

    const instance = new Foo()
    instance.bar = 'value'
    expect(callback).toBeCalled()
    expect(instance.bar).toEqual(instance.internalBar)
  })
})
