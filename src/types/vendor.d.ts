// Type declarations for packages that don't resolve correctly under moduleResolution "node".
// markdown-to-jsx ships types but they're not picked up when Jest resolves via CJS "main" field.
declare module 'markdown-to-jsx';

declare module '*.md' {
  const content: string;
  export default content;
}
