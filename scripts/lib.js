const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

move()

function move() {
    if (fs.ensureDirSync(path.join(__dirname, '../lib'))) {
        console.error(chalk.red('Document: Lib is not exist'))
        process.exit(0)
    }
    fs.copyFileSync(...getPath('timecat.min.js'))
    fs.copyFileSync(...getPath('timecat.cjs.js'))
    fs.copyFileSync(...getPath('timecat.esm.js'))
    fs.copyFileSync(...getPath('timecatjs.d.ts'))
}

function getPath(fileName) {
    return [path.join(__dirname, '../dist/' + fileName), path.join(__dirname, '../lib/' + fileName)]
}
