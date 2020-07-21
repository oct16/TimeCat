const execa = require('execa')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')
const extractor = require('@microsoft/api-extractor')
const { Extractor, ExtractorConfig, ExtractorResult } = extractor

const env = 'production'
const target = 'timecat'

const packagesDir = path.resolve(__dirname, '../packages')
const packageDir = path.resolve(packagesDir, target)
const resolve = p => path.resolve(packageDir, p)
const destinationDir = path.resolve(__dirname, '../dist')

run()

async function run() {
    await execa(
        'rollup',
        [
            '-c',
            'configs/rollup.config.prod.js',
            '--environment',
            [`NODE_ENV:${env}`, `TARGET:${target}`, 'SOURCE_MAP:true', 'PROD_ONLY:true', 'TYPES:true']
        ],
        {
            stdio: 'inherit'
        }
    )

    await extractAPI()
    moveFiles()
    generateDoc()
    processEnd()
}

async function extractAPI() {
    const apiExtractorJsonPath = resolve('api-extractor.json')
    const extractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath)
    const extractorResult = Extractor.invoke(extractorConfig, {
        localBuild: true,
        showVerboseMessages: true
    })

    if (extractorResult.succeeded) {
        console.info(`API Extractor completed successfully`)
        process.exitCode = 0
    } else {
        console.error(
            `API Extractor completed with ${extractorResult.errorCount} errors` +
                ` and ${extractorResult.warningCount} warnings`
        )
        process.exitCode = 1
    }
}

function generateDoc() {
    execa('npx', ['typedoc'])
}

function moveFiles() {
    const target = resolve('dist')
    fs.copySync(target, destinationDir)
}

function processEnd() {
    console.log(chalk.green('The compiled file has been created in ' + destinationDir))
}
