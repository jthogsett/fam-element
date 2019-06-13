import { updatePipeline } from '../src/update-pipeline'
import { PropertyChangeState } from '../src/changeable'

describe('updatePipeline', () => {
  interface Foo {
    bar?: string
  }
  const myPipelineAction = jest.fn<void, [Foo, Map<PropertyKey, PropertyChangeState>]>()
  let myPipeline: {
    registerProperty: MemberDecorator<Foo, unknown>
    requestUpdate: (target: Foo) => void
  }

  beforeEach(() => {
    myPipelineAction.mockClear()
    myPipeline = updatePipeline(myPipelineAction)
  })

  it('Calls the pipeline action when a registered property is changed', async () => {
    class FooImp implements Foo {
      @myPipeline.registerProperty
      bar?: string
    }

    const foo = new FooImp()
    foo.bar = 'baz'

    await Promise.resolve()

    expect(myPipelineAction).toBeCalledWith(
      foo,
      new Map([['bar', { oldValue: undefined, newValue: 'baz' }]])
    )
  })

  it('will not call the pipeline action if no properties changed in the update cycle', async () => {
    class FooImp implements Foo {
      @myPipeline.registerProperty
      bar?: string
    }

    const foo = new FooImp()
    foo.bar = 'baz'
    foo.bar = undefined

    await Promise.resolve()

    expect(myPipelineAction).not.toBeCalled()
  })
  describe('requestUpdate', () => {
    it('will call the pipeline action regardless of if a pipline property was changed', async () => {
      class FooImp implements Foo {
        @myPipeline.registerProperty
        bar?: string
      }

      const foo = new FooImp()

      myPipeline.requestUpdate(foo)

      await Promise.resolve()

      expect(myPipelineAction).toBeCalledWith(foo, new Map())
    })
  })
})
