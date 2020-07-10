const fs = require('fs-extra')
const path = require('path')
const chalk = require('chalk')

const copyList = ['min.js', 'cjs.js', 'esm.js', 'd.ts'].map(i => 'timecatjs.' + i)

move()

function move() {
    const libPath = path.join(__dirname, '../lib')
    fs.ensureDirSync(libPath)
    fs.emptyDirSync(libPath)
    copyList.forEach(path => fs.copyFileSync(...getPath(path)))
    console.log(chalk.green(`Copy ${copyList.join(', ')} into Lib`))
}

function getPath(fileName) {
    return [path.join(__dirname, '../packages/timecat/dist/' + fileName), path.join(__dirname, '../lib/' + fileName)]
}
