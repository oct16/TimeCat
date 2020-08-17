const fs = require('fs')
const { gzipSync } = require('zlib')
const { compress } = require('brotli')
const chalk = require('chalk')
const path = require('path')

exports.targets = fs.readdirSync('packages').filter(f => {
    if (!fs.statSync(`packages/${f}`).isDirectory()) {
        return false
    }
    const pkg = require(`../packages/${f}/package.json`)
    if (pkg.private && !pkg.buildOptions) {
        return false
    }
    return true
})

exports.checkSize = function (target) {
    const pkgDir = path.resolve(`packages/${target}`)
    checkFileSize(`${pkgDir}/dist/${target}.global.prod.js`)
}

function checkFileSize(filePath) {
    if (!fs.existsSync(filePath)) {
        return
    }
    const file = fs.readFileSync(filePath)
    const minSize = (file.length / 1024).toFixed(2) + 'kb'
    const gzipped = gzipSync(file)
    const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb'
    const compressed = compress(file)
    const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb'
    console.log(
        `${chalk.gray(
            chalk.bold(path.basename(filePath))
        )} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
    )
}
