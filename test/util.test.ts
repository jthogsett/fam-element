import { getPropertyDescriptor } from '../src/util'

describe('getPropertyDescriptor', () => {
  it("gets an object's property descriptor", () => {
    const foo = { bar: 'value' }
    const descriptor = getPropertyDescriptor(foo, 'bar')
    expect(descriptor).toEqual(Object.getOwnPropertyDescriptor(foo, 'bar'))
  })
  it('returns undefined if the property does not exist on the object', () => {
    const foo = { bar: 'value' }
    const descriptor = getPropertyDescriptor(foo, 'baz')
    expect(descriptor).toBeUndefined()
  })
  it("gets the super property descriptor if it doesn't exist on the object", () => {
    const fooSuper = { bar: 'value' }
    const foo = Object.create(fooSuper)
    const descriptor = getPropertyDescriptor(foo, 'bar')
    expect(descriptor).toEqual(Object.getOwnPropertyDescriptor(fooSuper, 'bar'))
  })
})
