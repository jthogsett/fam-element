import { overrideSuper, getPropertyDescriptor } from './util'

export interface ObservableElement extends HTMLElement {
  attributeChangedCallback?(name: string, oldValue: string, newValue: string): void
}

export function observeAttribute<Target extends ObservableElement>(
  attributeName: string,
  attributeChangedCallback: (target: Target, oldValue: string, newValue: string) => void
) {
  return <TargetConstructor extends ObservableElementConstructor<Target>>(
    targetClass: TargetConstructor
  ) => {
    registerObservedAttribute(attributeName)(targetClass)
    overrideSuper(targetClass.prototype, 'attributeChangedCallback', function(
      this: Target,
      name: string,
      oldValue: string,
      newValue: string
    ) {
      if (name === attributeName) {
        attributeChangedCallback(this, oldValue, newValue)
      }
    })
  }
}

export interface ObservableElementConstructor<Target extends ObservableElement = ObservableElement>
  extends Constructor<Target> {
  observedAttributes?: string[]
}

export function registerObservedAttribute(attributeName: string) {
  return <TargetConstructor extends ObservableElementConstructor<HTMLElement>>(
    targetClass: TargetConstructor
  ) => {
    const superDescriptor = getPropertyDescriptor(targetClass, 'observedAttributes')
    Object.defineProperty(targetClass, 'observedAttributes', {
      get() {
        return superDescriptor
          ? [...superDescriptor.get!.call(this), attributeName]
          : [attributeName]
      }
    })
  }
}
