import { emitRef } from "@core";

export interface ComponentContext {
  emit(action: string, data?: any);
}

export interface Component {
  template: string;
  tagName: string;
  components: any[];
  setup(self: ComponentInstance, parent?: ComponentInstance): any;
}

export interface ComponentInstance extends Component {
  id: number;
  componentNode: Node | null;
  parent: ComponentInstance | null;

  emit(action: string, data?: any): void;
  context: any;
}

export class CrassulaComponent implements ComponentInstance {

  private _id = 0;
  private _componentNode: Node | null = null;
  private _functions: string[] = [];
  private _props = new Map<string, any>();
  private _eachBlocks = new Map<string, Node[]>();
  private _renderFunc: FrameRequestCallback;
  private _requestRender = 0;
  private _componentsInUse: string[] = [];
  private _parent: ComponentInstance | null = null;
  private _context: any;
  private _emits = new Map<string, string>();

  constructor(private _inst: Component) {
    this._renderFunc = this.render.bind(this);
    // this._emit.observe((key: string, value: any) => this.emitCallback(value));
  }

  // setup: any;

  init(context) {
    this._context = context;
    Object.getOwnPropertyNames(context).forEach((element: any) => {
      const desc = Object.getOwnPropertyDescriptor(context, element);
      if (desc) {
        if (typeof desc.value === 'function') {
          this._functions.push(element);
        } else {
          this._props.set(element, desc.value);
          if (typeof desc.value === 'object') {
            context[element].observe((key: string, value: any) => this.callback(value));
          }
        }
      }
    });

    const templateNode = document.createElement('template');
    templateNode.innerHTML = this._inst.template;
    const virtualNode = templateNode.content.cloneNode(true).firstChild;

    this.parseDOM(virtualNode)
    this._componentNode = virtualNode;
  }

  set id(id: number) {
    this._id = id;
  }

  get id() {
    return this._id;
  }

  get componentNode() {
    return this._componentNode;
  }

  get template() {
    return this._inst.template;
  }

  get components() {
    return this._inst.components;
  }

  set context(context) {
    this._context = context;
  }

  get context() {
    return this._context;
  }

  set parent(parent: ComponentInstance | null) {
    this._parent = parent;
  }

  get parent(): ComponentInstance | null {
    return this._parent;
  }

  get tagName() {
    return this._inst.tagName;
  }

  getChildComponent(tagName: string) {
    if (this._inst.components) {
      let component = this._inst.components.find(c => c.tagName === tagName);
      if (component) {
        if (this._componentsInUse.includes(component.tagName)) {
          return this.createNewComponent(component);
        } else {
          component = this.createNewComponent(component);
          this._componentsInUse.push(component.tagName);
          return component;
        }
      }
    }
    return null;
  }

  createNewComponent(inst) {
    const instance = new CrassulaComponent(inst);
    const context = inst.setup(instance, this);
    instance.id = Math.floor(Math.random() * 1000);
    instance.init(context);
    instance.parent = this;
    return instance;
  }

  callback(value: any) {
    if (this._requestRender) {
      cancelAnimationFrame(this._requestRender);
    }
    this._requestRender = requestAnimationFrame(this._renderFunc);
  }

  parseDOM(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const vn = node.childNodes[i];

      if (vn.nodeType === Node.TEXT_NODE) {
        let textContent = vn.textContent.trim();
        if (textContent && textContent.match(/\{([^}]+)\}/g)) {
          const textNodes = textContent.split(/\{([^}]+)\}/g);
          if (textNodes) {
            let previousNode = vn;
            for (let i = 0; i < textNodes.length; i++) {
              const el = textNodes[i].trim();
              if ((Array.from(this._props.keys()).indexOf(el) !== -1)) {
                const newNode = document.createTextNode(String(this.context[el].value));

                if (i == 0) {
                  vn.parentNode.replaceChild(newNode, vn);
                  previousNode = newNode;
                } else {
                  this.insertAfter(newNode, previousNode);
                  previousNode = newNode;
                }
                if (this._eachBlocks.has(el)) {
                  this._eachBlocks.get(el)?.push(newNode);
                } else {
                  this._eachBlocks.set(el, [newNode]);
                }
              } else {
                const newNode = document.createTextNode(textNodes[i]);
                if (i == 0) {
                  vn.parentNode.replaceChild(newNode, vn);
                  previousNode = newNode;
                } else {
                  this.insertAfter(newNode, previousNode);
                  previousNode = newNode;
                }
              }
            }
          }
        }
      } else if (vn.nodeType === Node.ELEMENT_NODE) {
        const instance = this.getChildComponent(vn.tagName.toLowerCase());
        if (instance) {
          this.parseEmits(vn);
          vn.parentNode.replaceChild(instance.componentNode, vn)
        } else {
          this.parseHandlers(vn);
        }
      }

      if (vn.hasChildNodes()) {
        this.parseDOM(vn);
      }
    }
  }

  render() {
    const t0 = performance.now();
    this._eachBlocks.forEach((blocks: Node[], key: string) => {
      blocks.forEach(b => b.textContent = this.context[key].value)
    })
    const t1 = performance.now();
    console.log(`Rendering took ${t1 - t0} ms.`);
    this._requestRender = 0;
  }

  emitCallback(value) {
    // console.log(value)
    if (value) {
      const action = value.action;
      if (typeof this.context[`${action}`] === 'function') {
        this.context[`${action}`](value.data);
      }
    }
  }

  public emit(action: string, data?: any) {
    if (action) {
      const f = this._emits.get(action.toLowerCase());
      if (f && typeof this.context[`${f}`] === 'function') {
        this.context[`${f}`](data);
      }
    }
  }

  private parseEmits(el: Element) {
    Array.from(el.attributes).forEach((a: any) => {
      if (a.name[0] === '@') {
        const callback = el.getAttribute(`${a.name}`);
        if (callback && this._functions.includes(callback)) {
          this._emits.set(a.name.substring(1), callback);
        }
      }
    })
  }

  /**
   * Parse node event handlers
   *
   * @param el current element node
   */
  private parseHandlers(el: Element) {
    Array.from(el.attributes).forEach((a: any) => {
      if (a.name[0] === '@') {
        const callback = el.getAttribute(`${a.name}`);
        if (callback && this._functions.includes(callback)) {
          el.addEventListener(a.name.substring(1), () => {
            this.context[`${callback}`]()
          });
        }
        el.removeAttribute(`${a.name}`);
      }
    })
  }

  /**
   * Insert node after the existing one
   *
   * @param newNode
   * @param existingNode
   */
  private insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
  }

  setup(self: ComponentInstance) {
    throw new Error("Method not implemented.");
  }
}

export const createComponent = (inst: Component) => {

  const instance = new CrassulaComponent(inst);
  const context = inst.setup(instance);
  instance.init(context);
  instance.id = Math.floor(Math.random() * 1000);

  return {
    id: instance.id,
    componentNode: instance.componentNode,
    template: inst.template,
    components: inst.components,
    tagName: inst.tagName,
    context,
    setup: inst.setup,
    emit: instance.emit
  }
};

