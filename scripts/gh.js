const fs = require('fs-extra')
const path = require('path')
const getPkgRoot = pkg => path.resolve(__dirname, '../packages/' + pkg)

run()

async function run() {
    const pkgRoot = getPkgRoot('timecat')
    const distDir = path.resolve(pkgRoot, 'dist')
    fs.removeSync(path.resolve(__dirname, '../docs'))
    fs.copySync(distDir, path.resolve(__dirname, '../docs'))
    fs.copySync(path.resolve(__dirname, '../examples'), path.resolve(__dirname, '../docs'))
}
