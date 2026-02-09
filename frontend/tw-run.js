const fs = require('fs')
const postcss = require('postcss')
const tailwindPostcss = require('@tailwindcss/postcss')

async function run() {
  try {
    const input = fs.readFileSync('src/index.css', 'utf8')
    const result = await postcss([
      tailwindPostcss(),
      require('autoprefixer'),
    ]).process(input, { from: 'src/index.css' })
    fs.writeFileSync('tmp.tailwind.css', result.css)
    console.log('Wrote tmp.tailwind.css')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

run()
