import {
  getPropertyDescriptor,
  memoize,
  initializeOwnProperty,
  memoizeMap,
  oncePerHierarchy
} from '../src/util'

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

describe('initializeOwnProperty', () => {
  it('set the property value of an object that does not have the property', () => {
    const foo: { bar?: string } = {}
    initializeOwnProperty(foo, 'bar', () => 'baz')
    expect(foo.bar).toEqual('baz')
  })
  it('does not set the property value if the object has the property', () => {
    const foo: { bar?: string } = { bar: 'baz' }
    initializeOwnProperty(foo, 'bar', () => 'qux')
    expect(foo.bar).toEqual('baz')
  })
})

describe('memoize', () => {
  const initialize = jest.fn<string, []>()
  const cloneFromSuper = jest.fn<string, [string]>()
  interface Foo {
    bar: string
  }

  beforeEach(() => {
    initialize.mockClear()
    initialize.mockImplementation(() => 'qux')
    cloneFromSuper.mockClear()
    cloneFromSuper.mockImplementation(superValue => `inherited ${superValue}`)
  })
  it("clones a property value from an object's prototype into its own property", () => {
    const fooSuper: Foo = { bar: 'baz' }
    const foo = Object.create(fooSuper) as Foo
    memoize(foo, 'bar', initialize, cloneFromSuper)
    expect(foo.bar).toEqual('inherited baz')
  })
  it("initializes a property value if it doesn't exist in its prototype hierarchy", () => {
    const foo: Partial<Foo> = {}
    memoize(foo, 'bar', initialize, cloneFromSuper)
    expect(foo.bar).toEqual('qux')
  })
})

describe('memoizeMap', () => {
  it("initializes a new Map on an object if it doesn't exist", () => {
    const fooSuper = {
      bar: new Map<string, number>([['a', 1], ['b', 2]])
    }
    const foo: {
      bar?: Map<string, number>
    } = {}
    memoizeMap(foo, 'bar')
    expect(foo.bar).toStrictEqual(new Map<string, number>())
  })
  it("clones a Map from an object's prototype", () => {
    const fooSuper = {
      bar: new Map<string, number>([['a', 1], ['b', 2]])
    }
    const foo = Object.create(fooSuper) as typeof fooSuper
    memoizeMap(foo, 'bar')
    expect(foo.bar).toStrictEqual(new Map<string, number>([['a', 1], ['b', 2]]))
    expect(foo.bar).not.toBe(fooSuper.bar)
  })
})

describe('oncePerHierarchy', () => {
  it("runs an operation against an object if that operation has not yet been performed against that object's prototype hierarchy", () => {
    interface Foo {
      bar: string
    }
    const operation = jest.fn<Foo, [Foo]>(foo => foo)
    const fallback = jest.fn<void, [Foo]>(foo => {})

    const runOncePerHierarchy = oncePerHierarchy(operation, fallback)
    const foo: Foo = { bar: 'baz ' }
    runOncePerHierarchy(foo)
    runOncePerHierarchy(foo)
    const fooExtension = Object.create(foo) as Foo
    runOncePerHierarchy(fooExtension)
    expect(operation).toBeCalledTimes(1)
    expect(fallback).toBeCalledTimes(2)
  })
})
