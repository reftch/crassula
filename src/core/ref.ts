export interface PropertyHandler {
  property: string;
  value: any;
}

const handlers = Symbol('handlers');

const createRef = (target) => {
  // 1. Initialize handlers store
  target[handlers] = [];

  // Store the handler function in array for future calls
  target.observe = function(handler: PropertyHandler) {
    this[handlers].push(handler);
  };

  // 2. Create a proxy to handle changes
  return new Proxy(target, {
    set(target, property, value) {
      const oldValue = target[property];
      if (oldValue !== value) {
        const success = Reflect.set(target, property, value); // forward the operation to object
        if (success) { 
          // if there were no error while setting the property
          // call all handlers
          target[handlers].forEach(handler => handler(property, value));
        }
      }
      return true;
    }
  });
}

export const ref = (value: any) => {
  return createRef({ value: value })
}


