import {
  observeAttribute,
  ObservableElement,
  registerObservedAttribute,
  ObservableElementConstructor
} from '../src/observe-attribute'

describe('observeAttribute', () => {
  let attributeChangedCallback: jest.Mock<void, [HTMLElement, string, string]>
  beforeAll(() => {
    attributeChangedCallback = jest.fn<void, [HTMLElement, string, string]>()
  })
  beforeEach(() => {
    attributeChangedCallback.mockClear()
  })

  it('includes the observed attribute in the observedAttributes static property', () => {
    @observeAttribute('my-attribute', attributeChangedCallback)
    class MyCustomElement extends HTMLElement {}
    expect((MyCustomElement as ObservableElementConstructor).observedAttributes).toContain(
      'my-attribute'
    )
  })

  it('calls the attributeChangedCallback when the attribute of that name changes', () => {
    @observeAttribute('my-attribute', attributeChangedCallback)
    class MyCustomElement extends HTMLElement {}

    customElements.define('my-custom-element1', MyCustomElement)
    const myCustomElement = document.createElement('my-custom-element1') as ObservableElement

    myCustomElement.attributeChangedCallback!('my-attribute', 'foo', 'bar')

    expect(attributeChangedCallback).toBeCalledWith(myCustomElement, 'foo', 'bar')
  })

  it('does not call the attributeChangedCallback when an attribute other than the registered attribute changes', () => {
    @observeAttribute('my-attribute', attributeChangedCallback)
    class MyCustomElement extends HTMLElement {
      static get observedAttributes() {
        return ['my-other-attribute']
      }
    }

    customElements.define('my-custom-element2', MyCustomElement)
    const myCustomElement = document.createElement('my-custom-element2') as ObservableElement

    myCustomElement.attributeChangedCallback!('my-other-attribute', 'foo', 'bar')

    expect(attributeChangedCallback).not.toBeCalled()
  })
})

describe('registerObservedAttribute', () => {
  it('defines observedAttributes with the registered attribute if it does not already exist', () => {
    @registerObservedAttribute('my-attribute')
    class MyCustomElement extends HTMLElement {}

    expect(
      (MyCustomElement as ObservableElementConstructor<MyCustomElement>).observedAttributes
    ).toEqual(['my-attribute'])
  })
  it('appends the registered attribute with any existing observedAttributes', () => {
    @registerObservedAttribute('my-attribute')
    class MyCustomElement extends HTMLElement {
      static get observedAttributes() {
        return ['my-current-attribute']
      }
    }
    expect(MyCustomElement.observedAttributes).toContain('my-attribute')
    expect(MyCustomElement.observedAttributes).toContain('my-current-attribute')
  })
})
