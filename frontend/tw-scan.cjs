const fs = require('fs')
const path = require('path')

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const matches = text.match(/bg-[^\s'"/>]*/g)
  if (matches) {
    console.log(file, matches)
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name)
    const stat = fs.statSync(fp)
    if (stat.isDirectory()) walk(fp)
    else if (/\.(html|js|ts|jsx|tsx)$/.test(name)) scanFile(fp)
  }
}

scanFile('index.html')
walk('src')
