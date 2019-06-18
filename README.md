# fam-element

The power of lit-html with the familiarity of native Web Components

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Travis](https://travis-ci.org/jthogsett/fam-element.svg)](https://travis-ci.org/jthogsett/fam-element)
[![Coverage Status](https://coveralls.io/repos/github/jthogsett/fam-element/badge.svg)](https://coveralls.io/github/jthogsett/fam-element)
[![dependencies Status](https://david-dm.org/jthogsett/fam-element/status.svg)](https://david-dm.org/jthogsett/fam-element)
[![devDependencies Status](https://david-dm.org/jthogsett/fam-element/dev-status.svg)](https://david-dm.org/jthogsett/fam-element?type=dev) [![Greenkeeper badge](https://badges.greenkeeper.io/jthogsett/fam-element.svg)](https://greenkeeper.io/)

## Observe Properties

Register a callback to a class property setter.

This allows us to hook into state changes of an object

### Usage

```ts
import { observeProperty } from 'fam-element'

class Foo {
  constructor(id) {
    this.id = id
  }

  @observeProperty((instance, oldValue, newValue) =>
    console.log(`${instance.id}'s message set from ${oldValue} to ${newValue}`)
  )
  message?: string
}

const bar = new Foo('bar')
bar.message = 'Hello!'

// console: bar's message set from undefined to Hello!
```

### Prefer JS?

The decorator will always return a property descriptor, so if you don't want to use typescript, you can use the return value to define properties

```js
class Foo {}
Object.defineProperty(
  Foo.prototype,
  'message',
  observeProperty(() => console.log('message updated'))(Foo.prototype, 'message')
)
```

## Run Object Updates In Batch

Register update callbacks to a class and request updates against an instance of that class. If an update is requested multiple times in the same tick, the update callbacks will only be called once.

This enables us to run expensive operations as a result of some state change of an object, regardless of how many times the object's state changes in a tick.

### Usage

```ts
import { onUpdate, requestUpdate } from 'fam-element'

@onUpdate(instance => console.log(`Hello ${instance.message}`!))
class Foo {
  constructor(message) {
    this.message = message
  }
}

const bar = new Foo('World')
requestUpdate(bar)

// next tick - console: Hello World!
```

### Prefer JS?

The decorator is designed to apply logic to the existing class instead of wrapping it, so if you don't want to use typescript decorators, you can simply pass your class into the decorator method.

```js
class MyUpdateableClass {}
onUpdate(() => {
  /* do work */
})(MyUpdateableClass)
const myUpdateableObject = new MyUpdateableClass()
```

## Detect Property Changes In Batch

Register change callbacks to properties of a class. If any watched property is changed, all changed property callbacks will be called in the next tick.

This is similar to observeProperty, except the callback will be executed in the next tick and will only fire if the property actually changes instead of just being set.

### Usage

```ts
import { onPropertyChange } from 'fam-element'

class Foo {
  @onPropertyChange((instance, { oldValue, newValue }) =>
    console.log(`bar changed from ${oldValue} to ${newValue}`)
  )
  bar?: string
}

const myFoo = new Foo()
myFoo.bar = 'baz'

// next tick - console: bar changed from undefined to baz!
```

By default, a change is detected by checking exact equality. This can be configured by registering a custom change detector for the property

```ts
import { onPropertyChange, changeDetector } from 'fam-element'

@onUpdate(instance => console.log(`Hello ${instance.message}`!))
class Foo {
  @changeDetector((oldValue, newValue) => oldValue.toUpperCase() !== newValue.toUpperCase())
  @onPropertyChange((instance, { oldValue, newValue }) => {
    /* this will only be called if bar changes without considering case sensitivity */
  })
  bar: string = 'baz'
}
```

### Prefer JS?

onPropertyChange will always return a property descriptor, so if you don't want to use typescript, you can use the return value to define properties

```js
class Foo {}
Object.defineProperty(
  Foo.prototype,
  'message',
  onPropertyChange(() => console.log('message updated'))(Foo.prototype, 'message')
)
```

changeDetector modifies metadata on the class, so all you need to do is pass the target and property key into the decorator. This will always be void so don't assign it through Object.defineProperty

```js
changeDetector((oldValue, newValue) => oldValue != newValue)(Foo.prototype, 'message')
```

## Update Pipelines

Register an update callback to a subset of properties on a class. This will wait for all registered properties to updatebefore calling the callback in the next tick.

This allows you to perform specific operations against the instance of a class when those operations are dependent on certain properties.

### Usage

```ts
import { updatePipeline } from 'fam-element'

const myPipeline = updatePipeline((fooInstance, pipelinePropertyChangeStates) =>
  console.log(`Hello ${fooInstance.name}!`)
)

class Foo {
  @myPipeline.registerProperty
  name: string

  constructor(name) {
    this.name = name
  }
}

const myFoo = new Foo('World')

// next tick - console: Hello World!
```

It's also possible to manually trigger a pipeline to run regardless of a property updating

```ts
myPipeline.requestUpdate(myFoo)

// next tick - console: Hello World!
```

### Prefer JS?

registerProperty will always return a property descriptor, so if you don't want to use typescript, you can use the return value to define properties

```js
class Foo {}
Object.defineProperty(Foo.prototype, 'name', myPipeline.registerProperty(Foo.prototype, 'name'))
```

## Observe Attributes

Observe HTMLElement attributes with decorators

### Usage

```ts
import { observeAttribute } from 'fam-element'

@observeAttribute('my-attribute', (instance, oldValue, newValue) =>
  console.log(`my-attribute changed from ${oldValue} to ${newValue}`)
)
class MyCustomElement extends HTMLElement {}
```

is identical to

```js
class MyCustomElement extends HTMLElement {
  static get observedAttributes() {
    return ['my-attribute']
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'my-attribute') {
      console.log(`my-attribute changed from ${oldValue} to ${newValue}`)
    }
  }
}
```

### Prefer JS?

observeAttribute will mutate the existing class instead of wrap it, so it can be called after the class is declared

```js
class MyCustomElement extends HTMLElement {}
observeAttribute('my-attribute', (instance, oldValue, newValue) =>
  console.log(`my-attribute changed from ${oldValue} to ${newValue}`)
)(MyCustomElement)
```
