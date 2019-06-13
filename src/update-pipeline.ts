import { oncePerHierarchy, oncePerKeyPerHierarchy } from './util'
import { onPropertyChange, PropertyChangeState } from './changeable'
import { onUpdate, requestUpdate } from './updateable'

export function updatePipeline<Target>(
  updateCallback: (target: Target, changedProperties: Map<PropertyKey, PropertyChangeState>) => void
) {
  const UPDATING_PROPERTIES = Symbol('pipelineUpdatingProperties')
  type PipelineTarget = Target & {
    [UPDATING_PROPERTIES]?: Map<PropertyKey, PropertyChangeState>
  }

  const registerPipeline = oncePerHierarchy(
    onUpdate<PipelineTarget>(target => {
      const updatingProperties = target[UPDATING_PROPERTIES]
      if (updatingProperties) {
        updateCallback(target, updatingProperties)
        delete target[UPDATING_PROPERTIES]
      }
    })
  )
  const registerPropertyToPipeline = oncePerKeyPerHierarchy(
    (target: PipelineTarget, key: PropertyKey, descriptor: PropertyDescriptor) =>
      onPropertyChange((target: PipelineTarget, changeState: PropertyChangeState) => {
        beginUpdate(target)
        target[UPDATING_PROPERTIES]!.set(key, changeState)
      })(target, key, descriptor) as PropertyDescriptor,
    (target: PipelineTarget, key: PropertyKey, descriptor: PropertyDescriptor) => descriptor
  )

  return {
    registerProperty: ((
      target: PipelineTarget,
      propertyKey: PropertyKey,
      descriptor: PropertyDescriptor
    ) => {
      const newDescriptor = registerPropertyToPipeline(target, propertyKey, descriptor)
      registerPipeline(target.constructor as Constructor<PipelineTarget>)
      return newDescriptor
    }) as MemberDecorator<Target, unknown>,
    requestUpdate: ((target: PipelineTarget) => {
      beginUpdate(target)
      requestUpdate(target)
    }) as (target: Target) => void
  }
  function beginUpdate(target: PipelineTarget) {
    if (!target[UPDATING_PROPERTIES]) {
      target[UPDATING_PROPERTIES] = new Map()
    }
  }
}
