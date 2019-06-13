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
  target: { [P in Property]?: Map<Key, Value> },
  property: Property
) {
  memoize(target, property, () => new Map<Key, Value>(), parentMap => new Map(parentMap.entries()))
}

export function memoize<Property extends PropertyKey, Value>(
  target: { [P in Property]?: Value },
  property: Property,
  initialize: () => Value,
  cloneFromSuper: (superValue: Value) => Value
) {
  initializeOwnProperty(target, property, () =>
    property in target ? cloneFromSuper(target[property]!) : initialize()
  )
}

export function initializeOwnProperty<Property extends PropertyKey, Value>(
  target: { [P in Property]?: Value },
  property: Property,
  initialize: () => Value
) {
  if (!target.hasOwnProperty(property)) {
    target[property] = initialize()
  }
}

const FLAG = Symbol('flag')
let allFlags = 0

interface Flagged {
  [FLAG]: number
}

export function oncePerHierarchy<Target extends {}, Args extends [Target, ...any[]], Return>(
  operation: (...args: Args) => Return
): (...args: Args) => Return | void
export function oncePerHierarchy<
  Target extends {},
  Args extends [Target, ...any[]],
  Return,
  Fallback
>(
  operation: (...args: Args) => Return,
  fallback: (...args: Args) => Fallback
): (...args: Args) => Return | Fallback
export function oncePerHierarchy<
  Target extends {},
  Args extends [Target, ...any[]],
  Return,
  Fallback = void
>(
  operation: (...args: Args) => Return,
  // tslint:disable-next-line: no-empty
  fallback: (...args: Args) => Fallback = (() => {}) as typeof fallback
): (...args: Args) => Return | Fallback {
  const flag = allFlags + 1
  allFlags |= flag
  return (...args: Args) => {
    const target = args[0] as Target & Flagged
    if ((target[FLAG] & flag) === 0) {
      target[FLAG] |= flag
      return operation(...args)
    }
    return fallback(...args)
  }
}

export function oncePerKeyPerHierarchy<
  Target extends {},
  Key,
  Args extends [Target, Key, ...any[]],
  Return,
  Fallback
>(
  operation: (...args: Args) => Return,
  fallback: (...args: Args) => Fallback
): (...args: Args) => Return | Fallback
export function oncePerKeyPerHierarchy<
  Target extends {},
  Key,
  Args extends [Target, Key, ...any[]],
  Return
>(operation: (...args: Args) => Return): (...args: Args) => Return | void
export function oncePerKeyPerHierarchy<
  Target extends {},
  Key,
  Args extends [Target, Key, ...any[]],
  Return,
  Fallback = void
>(
  operation: (...args: Args) => Return,
  fallback?: (...args: Args) => Fallback
): (...args: Args) => Return | Fallback {
  const keyOperations = new Map<Key, (...args: Args) => Return | Fallback>()
  return (...args: Args) => {
    let keyOperation = keyOperations.get(args[1])
    if (!keyOperation) {
      keyOperation = oncePerHierarchy(operation, fallback!)
      keyOperations.set(args[1], keyOperation)
    }
    return keyOperation(...args)
  }
}
