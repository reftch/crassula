import { ComponentInstance } from "./index";

export namespace Crassula {
  
  export const mount = (sel: string, component: ComponentInstance) => {
    const selector = document.querySelector(sel);
    if (selector && component.componentNode) {
      selector.appendChild(component.componentNode);
    }
  } 

}