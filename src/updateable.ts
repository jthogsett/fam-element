import { overrideSuper } from './util'

const UPDATE = Symbol('update')
const UPDATE_TASK = Symbol('updateTask')

interface Updateable {
  [UPDATE]: () => void
  [UPDATE_TASK]?: Promise<void>
}

export function onUpdate<Target>(
  updateCallback: (target: Target) => void
): <TargetConstructor extends Constructor<Target>>(targetClass: TargetConstructor) => void {
  return <TargetConstructor extends Constructor<Target & Partial<Updateable>>>(
    targetClass: TargetConstructor
  ) => {
    overrideSuper(targetClass.prototype, UPDATE, function(this: Target) {
      updateCallback(this)
    })
  }
}

const microtask = Promise.resolve()

export function requestUpdate(target: any): void {
  if (isUpdateable(target) && !target[UPDATE_TASK]) {
    target[UPDATE_TASK] = microtask.then(() => {
      delete target[UPDATE_TASK]
      target[UPDATE]()
    })
  }
}

function isUpdateable(target: any): target is Updateable {
  return UPDATE in target
}
