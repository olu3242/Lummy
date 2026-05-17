const fs = require('fs')
const path = require('path')
const glob = require('glob')

function isLikelyStub(content) {
  // heuristic: single-line methods that immediately return a plain object or array
  return /\)\s*\{\s*return\s+\{/.test(content) || /\)\s*\{\s*return\s+\[/.test(content)
}

function main() {
  const root = path.resolve(__dirname, '..')
  const pattern = path.join(root, 'packages', '**', 'src', '**', '*.ts')
  const files = glob.sync(pattern, { ignore: ['**/dist/**', '**/*.d.ts', '**/node_modules/**'] })
  const hits = []
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8')
      if (isLikelyStub(content)) hits.push(f)
    } catch (e) {
      // ignore
    }
  }

  console.log('Found', hits.length, 'potential stub files:')
  for (const h of hits) console.log('-', path.relative(root, h))
}

if (require.main === module) main()
