import { getPropertyDescriptor } from './util'

export function observeProperty<Target, Value>(
  propertySetCallback: (target: Target, oldValue: Value, newValue: Value) => void
): MemberDecorator<Target, Value> & {
  (
    target: Target,
    propertyKey: PropertyKey,
    descriptor?: TypedPropertyDescriptor<Value>
  ): TypedPropertyDescriptor<Value>
} {
  return (
    target: Target,
    propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<Value> | undefined = getPropertyDescriptor(
      target,
      propertyKey
    )
  ) => {
    let get: (target: Target) => Value
    let set: (target: Target, value: Value) => void
    if (descriptor && descriptor.get && descriptor.set) {
      get = target => descriptor.get!.call(target)
      set = (target, value) => descriptor.set!.call(target, value)
    } else {
      const privateKey = Symbol(typeof propertyKey === 'string' ? propertyKey : undefined)
      get = target => (target as any)[privateKey]
      set = (target, value) => ((target as any)[privateKey] = value)
      set(target, (target as any)[propertyKey])
    }
    return {
      get(this: Target) {
        return get(this)
      },
      set(this: Target, value: Value) {
        const oldValue = get(this)
        set(this, value)
        propertySetCallback(this, oldValue, value)
      }
    } as TypedPropertyDescriptor<Value>
  }
}
