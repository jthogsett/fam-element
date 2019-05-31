interface Constructor<Target> {
  new (...args: any[]): Target
  prototype: Target
}

interface MemberDecorator<Target, Value> {
  (target: Target, propertyKey: PropertyKey): void
  (
    target: Target,
    propertyKey: PropertyKey,
    descriptor: TypedPropertyDescriptor<Value>
  ): void | TypedPropertyDescriptor<Value>
}
