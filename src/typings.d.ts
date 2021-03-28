declare module '*.html' {
  const content: string;
  export default content;
}

declare module '*.crassula' {
  const content: any;
  export default content;
  // export { ComponentInstance as default } from '@core';
}

