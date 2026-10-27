import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const MANIFEST_ID = 'virtual:image-manifest'
const RESOLVED_ID = `\0${MANIFEST_ID}`
const IMAGE_EXT = /\.(png|jpe?g|webp)$/i
// When a name exists in several formats the first listed wins.
const EXT_PRIORITY = ['png', 'webp', 'jpg', 'jpeg']

function listImages(dir: string, rel = ''): string[] {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const next = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) return listImages(path.join(dir, entry.name), next)
    return IMAGE_EXT.test(entry.name) ? [next] : []
  })
}

/**
 * Lists every file under public/images so the app knows which pictures exist without probing
 * the server for each one. Exposes `{ files, byId }`: `files` are paths relative to public/,
 * `byId` maps "<folder>/<name without extension>" to the preferred file, wherever it sits below that folder.
 */
function imageManifest(): Plugin {
  let publicDir = ''
  const build = () => {
    const files = listImages(path.join(publicDir, 'images')).map((f) => `images/${f}`)
    const depth = (file: string) => file.split('/').length
    const rank = (file: string) => EXT_PRIORITY.indexOf(file.split('.').pop()!.toLowerCase())
    // A file sitting directly in the folder beats one in a subfolder; then the format priority decides.
    const sorted = [...files].sort((a, b) => depth(a) - depth(b) || rank(a) - rank(b))
    const byId: Record<string, string> = {}
    for (const file of sorted) {
      const parts = file.split('/')
      if (parts.length < 3) continue
      byId[`${parts[1]}/${parts[parts.length - 1].replace(IMAGE_EXT, '')}`] ??= file
    }
    return { files, byId }
  }

  return {
    name: 'image-manifest',
    configResolved(config) {
      publicDir = config.publicDir
    },
    resolveId: (id) => (id === MANIFEST_ID ? RESOLVED_ID : undefined),
    load: (id) => (id === RESOLVED_ID ? `export default ${JSON.stringify(build())}` : undefined),
    configureServer(server) {
      const imagesDir = path.join(publicDir, 'images')
      const refresh = (file: string) => {
        if (!path.resolve(file).startsWith(path.resolve(imagesDir)) || !IMAGE_EXT.test(file)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.add(imagesDir)
      server.watcher.on('add', refresh)
      server.watcher.on('unlink', refresh)
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), imageManifest()],
})
