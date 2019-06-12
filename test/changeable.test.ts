import {
  changeDetector,
  CHANGE_DETECTORS,
  Changeable,
  emitPropertyChanges,
  UPDATING_PROPERTIES,
  PROPERTY_CHANGE_CALLBACKS,
  PropertyChangeState,
  PropertyChangeCallback,
  onPropertyChange,
  registerPropertyChangeCallback,
  requestPropertyUpdate,
  ChangeDetector,
  getChangeDetector,
  hasChanged
} from '../src/changeable'

describe('changeDetector', () => {
  it('registers a change detector to the target', () => {
    function stringChange(oldValue: string, newValue: string) {
      return oldValue !== newValue
    }
    class Foo {
      @changeDetector(stringChange)
      bar: string = 'baz'
    }
    expect((Foo.prototype as Changeable)[CHANGE_DETECTORS]!.get('bar')).toBe(stringChange)
  })
})

describe('emitPropertyChanges', () => {
  const barChangeCallback = jest.fn()
  let foo: Changeable & { bar: string }
  beforeEach(() => {
    barChangeCallback.mockClear()
    foo = {
      bar: 'baz',
      [PROPERTY_CHANGE_CALLBACKS]: new Map<PropertyKey, PropertyChangeCallback>([
        ['bar', barChangeCallback]
      ]),
      [UPDATING_PROPERTIES]: new Map<PropertyKey, PropertyChangeState>()
    }
  })
  it('clears all updating properties', () => {
    foo[UPDATING_PROPERTIES]!.set('bar', { newValue: 'baz', oldValue: 'qux' })
    emitPropertyChanges(foo)
    expect(foo[UPDATING_PROPERTIES]).toBeUndefined()
  })
  it('calls property change callbacks for properties that have changed', () => {
    foo[UPDATING_PROPERTIES]!.set('bar', { newValue: 'baz', oldValue: 'qux' })
    emitPropertyChanges(foo)
    expect(barChangeCallback).toBeCalledWith(foo, { newValue: 'baz', oldValue: 'qux' })
  })
  it('does not call a property change callbacks for properties that have not changed', () => {
    foo[UPDATING_PROPERTIES]!.set('bar', { newValue: 'baz', oldValue: 'baz' })
    emitPropertyChanges(foo)
    expect(barChangeCallback).not.toBeCalled()
  })
  it('does nothing if no updating properties have been registered', () => {
    delete foo[UPDATING_PROPERTIES]
    emitPropertyChanges(foo)
    expect(barChangeCallback).not.toBeCalled()
  })
})

describe('onPropertyChange', () => {
  it('calls the property change callback when the property is updated to a new value', async () => {
    const barChangeCallback = jest.fn<void, [Foo, PropertyChangeState<string>]>()
    class Foo {
      @onPropertyChange(barChangeCallback)
      bar?: string
    }
    const foo = new Foo()
    foo.bar = 'baz'
    await Promise.resolve()
    expect(barChangeCallback).toHaveBeenCalledWith(foo, { oldValue: undefined, newValue: 'baz' })
  })
})

describe('registerPropertyChangeCallback', () => {
  it("adds the callback function to the target's property change callbacks", () => {
    interface Foo extends Changeable {
      bar: string
    }
    const foo: Foo = { bar: 'baz' }
    const barChangeCallback = jest.fn<void, [unknown, PropertyChangeState<unknown>]>()
    registerPropertyChangeCallback(foo, 'bar', barChangeCallback)
    foo[PROPERTY_CHANGE_CALLBACKS]!.get('bar')!(foo, { oldValue: 'qux', newValue: 'baz' })
    expect(barChangeCallback).toBeCalled()
  })
  it('registers callbacks in order', () => {
    interface Foo extends Changeable {
      bar: string
    }
    const foo: Foo = { bar: 'baz' }
    const callOrder: string[] = []
    const barChangeCallback1 = jest.fn<void, [unknown, PropertyChangeState<unknown>]>(() =>
      callOrder.push('1')
    )
    const barChangeCallback2 = jest.fn<void, [unknown, PropertyChangeState<unknown>]>(() =>
      callOrder.push('2')
    )
    registerPropertyChangeCallback(foo, 'bar', barChangeCallback1)
    registerPropertyChangeCallback(foo, 'bar', barChangeCallback2)
    foo[PROPERTY_CHANGE_CALLBACKS]!.get('bar')!(foo, { oldValue: 'qux', newValue: 'baz' })
    expect(barChangeCallback1).toBeCalled()
    expect(barChangeCallback2).toBeCalled()
    expect(callOrder).toEqual(['1', '2'])
  })
})

describe('requestPropertyUpdate', () => {
  it('registers property values for an update', () => {
    const foo: Changeable & { bar: string } = { bar: 'baz' }
    requestPropertyUpdate(foo, 'bar', 'qux', 'baz')
    expect(foo[UPDATING_PROPERTIES]!.get('bar')).toEqual({ oldValue: 'qux', newValue: 'baz' })
  })
  it('registers property values for an update while the record is already in an update state', () => {
    const foo: Changeable & { bar: string } = { bar: 'baz', [UPDATING_PROPERTIES]: new Map() }
    requestPropertyUpdate(foo, 'bar', 'qux', 'baz')
    expect(foo[UPDATING_PROPERTIES]!.get('bar')).toEqual({ oldValue: 'qux', newValue: 'baz' })
  })
  it('updates an existing PropertyChangeState with a new value', () => {
    const foo: Changeable & { bar: string } = {
      bar: 'qux',
      [UPDATING_PROPERTIES]: new Map<PropertyKey, PropertyChangeState>([
        ['bar', { oldValue: 'baz', newValue: 'qux' }]
      ])
    }
    requestPropertyUpdate(foo, 'bar', 'qux', 'quux')
    expect(foo[UPDATING_PROPERTIES]!.get('bar')).toEqual({ oldValue: 'baz', newValue: 'quux' })
  })
})

describe('getChangeDetector', () => {
  it('gets a registered change detector from the target', () => {
    const barChangeDetector = jest.fn()
    const foo = {
      bar: 'baz',
      [CHANGE_DETECTORS]: new Map<PropertyKey, ChangeDetector>([['bar', barChangeDetector]])
    }
    expect(getChangeDetector(foo, 'bar')).toBe(barChangeDetector)
  })
  it("gets the default change detector a detector isn't registered for a property", () => {
    const foo = {
      bar: 'baz',
      [CHANGE_DETECTORS]: new Map<PropertyKey, ChangeDetector>()
    }
    expect(getChangeDetector(foo, 'bar')).toBe(hasChanged)
  })
  it('gets the default change detector no change detectors are registered', () => {
    const foo: Changeable & { bar: string } = {
      bar: 'baz'
    }
    expect(getChangeDetector(foo, 'bar')).toBe(hasChanged)
  })
})
