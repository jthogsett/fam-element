import { memoizeMap, oncePerHierarchy } from './util'
import { observeProperty } from './observe-property'
import { onUpdate, requestUpdate } from './updateable'

export interface ChangeDetector<Value = unknown> {
  (oldValue: Value, newValue: Value): boolean
}

export interface PropertyChangeState<Value = unknown> {
  oldValue: Value
  newValue: Value
}

export const CHANGE_DETECTORS = Symbol('changeDetectors')
export const PROPERTY_CHANGE_CALLBACKS = Symbol('propertyChangeCallbacks')
export const UPDATING_PROPERTIES = Symbol('updatingProperties')

export interface PropertyChangeCallback<Target = unknown, Value = unknown> {
  (target: Target, propertyChangeState: PropertyChangeState<Value>): void
}

export interface Changeable {
  [CHANGE_DETECTORS]?: Map<PropertyKey, ChangeDetector>
  [PROPERTY_CHANGE_CALLBACKS]?: Map<PropertyKey, PropertyChangeCallback>
  [UPDATING_PROPERTIES]?: Map<PropertyKey, PropertyChangeState>
}

export function changeDetector<Value>(
  detectChange: ChangeDetector<Value>
): MemberDecorator<{}, Value> {
  return <Property extends PropertyKey>(
    target: Record<Property, Value> & Changeable,
    propertyKey: Property
  ) => {
    memoizeMap(target, CHANGE_DETECTORS)
    target[CHANGE_DETECTORS]!.set(propertyKey, detectChange as ChangeDetector)
  }
}

const makeChangeable: <TargetConstructor extends Constructor<Changeable>>(
  targetClass: TargetConstructor
) => void = oncePerHierarchy(onUpdate(emitPropertyChanges))

export function emitPropertyChanges(target: Changeable) {
  const updatingProperties = target[UPDATING_PROPERTIES]!
  delete target[UPDATING_PROPERTIES]
  if (updatingProperties) {
    updatingProperties.forEach((propertyChangeState, property) => {
      const changeDetector = getChangeDetector(target, property)
      if (changeDetector(propertyChangeState.oldValue, propertyChangeState.newValue)) {
        target[PROPERTY_CHANGE_CALLBACKS]!.get(property)!(target, propertyChangeState)
      }
    })
  }
}

export function onPropertyChange<Target, Value>(
  propertyChangeCallback: PropertyChangeCallback<Target, Value>
): MemberDecorator<Target, Value> {
  return (
    target: Target & Changeable,
    property: PropertyKey,
    descriptor?: TypedPropertyDescriptor<Value>
  ) => {
    makeChangeable(target.constructor as Constructor<Changeable>)
    registerPropertyChangeCallback(
      target,
      property,
      propertyChangeCallback as PropertyChangeCallback
    )
    return observeProperty<Target, Value>((target, oldValue, newValue) =>
      requestPropertyUpdate(target, property, oldValue, newValue)
    )(target, property, descriptor!)
  }
}

export function registerPropertyChangeCallback(
  target: Changeable,
  property: PropertyKey,
  propertyChangeCallback: PropertyChangeCallback
) {
  memoizeMap(
    target as { [PROPERTY_CHANGE_CALLBACKS]?: Map<PropertyKey, PropertyChangeCallback> },
    PROPERTY_CHANGE_CALLBACKS
  )
  const propertyChangeCallbacks = target[PROPERTY_CHANGE_CALLBACKS]!
  const superChangeCallback = propertyChangeCallbacks.get(property)
  if (superChangeCallback) {
    propertyChangeCallbacks.set(
      property,
      (target: unknown, propertyChangeState: PropertyChangeState) => {
        superChangeCallback(target, propertyChangeState)
        propertyChangeCallback(target, propertyChangeState)
      }
    )
  } else {
    propertyChangeCallbacks.set(property, propertyChangeCallback)
  }
}

export function requestPropertyUpdate(
  target: Changeable,
  property: PropertyKey,
  oldValue: unknown,
  newValue: unknown
) {
  if (!target[UPDATING_PROPERTIES]) {
    target[UPDATING_PROPERTIES] = new Map([[property, { oldValue, newValue }]])
    requestUpdate(target)
  } else {
    const updateState = target[UPDATING_PROPERTIES]!.get(property)
    if (updateState) {
      updateState.newValue = newValue
    } else {
      target[UPDATING_PROPERTIES]!.set(property, { oldValue, newValue })
    }
  }
}

export function getChangeDetector(target: Changeable, property: PropertyKey) {
  return target[CHANGE_DETECTORS]
    ? target[CHANGE_DETECTORS]!.get(property) || hasChanged
    : hasChanged
}

export function hasChanged<Value = unknown>(oldValue: Value, newValue: Value) {
  return newValue !== oldValue
}
