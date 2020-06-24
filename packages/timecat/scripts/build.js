const extractor = require('@microsoft/api-extractor')
const { Extractor, ExtractorConfig, ExtractorResult } = extractor
const path = require('path')
const execa = require('execa')
const env = 'production'

run()

async function run() {
    await execa(
        'rollup',
        [
            '-c',
            'configs/rollup.config.prod.js',
            '--environment',
            [`NODE_ENV:${env}`, 'formats:umd', 'SOURCE_MAP:true', 'PROD_ONLY:true', 'TYPES:true', 'LEAN:true']
                .filter(Boolean)
                .join(',')
        ],
        {
            stdio: 'inherit'
        }
    )

    await extractAPI()
}

async function extractAPI() {
    const apiExtractorJsonPath = path.join(__dirname, '../api-extractor.json')
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
