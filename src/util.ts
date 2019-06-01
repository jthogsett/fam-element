export function getPropertyDescriptor(target: Object, key: PropertyKey): PropertyDescriptor
export function getPropertyDescriptor<Target, Property extends keyof Target>(
  target: Target,
  key: Property
): TypedPropertyDescriptor<Target[Property]>
export function getPropertyDescriptor<Target, Property extends keyof Target>(
  target: Target,
  key: Property
) {
  while (key in target) {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(target, key)
    if (propertyDescriptor !== undefined) {
      return propertyDescriptor as TypedPropertyDescriptor<Target[Property]>
    }
    target = Object.getPrototypeOf(target)
  }
  return undefined
}

export function memoizeMap<Key, Value, Property extends PropertyKey>(
  target: Partial<Record<Property, Map<Key, Value>>>,
  property: Property
) {
  memoize<Record<Property, Map<Key, Value>>, Property>(
    target,
    property,
    () => new Map<Key, Value>(),
    parentMap => new Map(parentMap!.entries())
  )
}

export function memoize<Target extends {}, Property extends keyof Target>(
  target: Partial<Target>,
  property: Property,
  initialize: () => Target[Property],
  cloneFromSuper: (superValue: Target[Property]) => Target[Property]
) {
  initializeOwnProperty(target, property, () =>
    property in target ? cloneFromSuper(target[property] as Target[Property]) : initialize()
  )
}

export function initializeOwnProperty<Target extends {}, Property extends keyof Target>(
  target: Partial<Target>,
  property: Property,
  initialize: () => Target[Property]
) {
  if (!target.hasOwnProperty(property)) {
    target[property] = initialize()
  }
}
