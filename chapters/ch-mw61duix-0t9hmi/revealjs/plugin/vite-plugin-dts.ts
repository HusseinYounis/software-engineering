import type { Plugin } from 'vite';

export function createPluginDts(name: string): Plugin {
  return {
    name: `reveal-plugin-dts-${name}`,
    apply: 'build',
  };
}