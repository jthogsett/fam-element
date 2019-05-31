interface Constructor<Target> {
  new (...args: any[]): Target
  prototype: Target
}
