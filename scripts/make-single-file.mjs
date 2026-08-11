import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const out = resolve(root, '离线程序')
const assets = resolve(out, 'assets')
const cssName = readdirSync(assets).find((name) => name.endsWith('.css'))
const jsName = readdirSync(assets).find((name) => name.endsWith('.js'))

if (!cssName || !jsName) throw new Error('没有找到构建后的 CSS 或 JavaScript 文件')

const css = readFileSync(resolve(assets, cssName), 'utf8').replaceAll('</style', '<\\/style')
const js = readFileSync(resolve(assets, jsName), 'utf8').replaceAll('</script', '<\\/script')
const favicon = encodeURIComponent(readFileSync(resolve(out, 'favicon.svg'), 'utf8'))

let html = readFileSync(resolve(out, 'index.html'), 'utf8')
html = html
  .replace(/<link rel="icon"[^>]*>/, () => `<link rel="icon" href="data:image/svg+xml,${favicon}">`)
  .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
  .replace(/<script type="module"[^>]*><\/script>/, () => `<script type="module">${js}</script>`)

const target = resolve(root, '生物学考复习.html')
writeFileSync(target, html)
console.log(`已生成可直接双击打开的网页：${target}`)
