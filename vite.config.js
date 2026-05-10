import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { readFileSync } from 'fs'
import { load as yamlLoad } from 'js-yaml'

/**
 * Vite plugin: transform *.yaml imports into parsed JS objects at build time.
 * No runtime YAML parsing — the object is baked into the bundle.
 */
function yamlPlugin() {
  return {
    name: 'vite-plugin-yaml',
    transform(src, id) {
      if (!id.endsWith('.yaml') && !id.endsWith('.yml')) return null
      const parsed = yamlLoad(readFileSync(id, 'utf-8'))
      return {
        code: `export default ${JSON.stringify(parsed)};`,
        map: null,
      }
    },
  }
}

export default defineConfig({
  plugins: [svelte(), yamlPlugin()],
  base: './',
})
