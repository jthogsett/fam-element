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
