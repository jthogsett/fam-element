# fam-element

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Travis](https://travis-ci.org/jthogsett/fam-element.svg)](https://travis-ci.org/jthogsett/fam-element)
[![Coverage Status](https://coveralls.io/repos/github/jthogsett/fam-element/badge.svg)](https://coveralls.io/github/jthogsett/fam-element)
[![dependencies Status](https://david-dm.org/jthogsett/fam-element/status.svg)](https://david-dm.org/jthogsett/fam-element)
[![devDependencies Status](https://david-dm.org/jthogsett/fam-element/dev-status.svg)](https://david-dm.org/jthogsett/fam-element?type=dev) [![Greenkeeper badge](https://badges.greenkeeper.io/jthogsett/fam-element.svg)](https://greenkeeper.io/)

The power of lit-html with the familiarity of native Web Components

## Run Object Updates In Batch

Register update callbacks to a class and request updates against an instance of that class. If an update is requested multiple times in the same tick, the update callbacks will only be called once.

```js
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

The decorator is designed to apply logic to the existing class instead of wrapping it, so if you don't want to use typescript decorators, you can simply pass your class into the decorator method.

```js
class MyUpdateableClass {}
onUpdate(() => {
  /* do work */
})(MyUpdateableClass)
const myUpdateableObject = new MyUpdateableClass()
```

This enables us to run expensive operations as a result of some state change of an object, regardless of how many times the object's state changes in a tick.
