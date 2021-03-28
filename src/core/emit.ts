
export interface PropertyHandler {
  property: string;
  value: any;
}

const emitHandlers = Symbol('emitHandlers');

const createEmit = (target) => {
  // 1. Initialize handlers store
  target[emitHandlers] = [];

  // Store the handler function in array for future calls
  target.observe = function(handler: PropertyHandler) {
    this[emitHandlers].push(handler);
  };

  // 2. Create a proxy to handle changes
  return new Proxy(target, {
    set(target, property, value) {
      // target[emitHandlers] = [];
      // console.log(target[emitHandlers])
      target[emitHandlers].forEach(handler => handler(property, value));
      return true;
    }
  });
}

export const emitRef = (value: any) => {
  return createEmit({ action: value })
}

