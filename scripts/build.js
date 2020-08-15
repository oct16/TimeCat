const execa = require('execa')
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')

const { targets: allTargets, checkSize } = require('./utils')
const args = require('minimist')(process.argv.slice(2))
const targets = args._
const formats = args.formats || args.f
const devOnly = args.devOnly || args.d
const prodOnly = !devOnly && (args.prodOnly || args.p)
const sourceMap = args.sourcemap || args.s
const isRelease = args.release
const buildTypes = args.t || args.types || isRelease
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

run()

async function run() {
    if (!targets.length) {
        await buildAll(allTargets)
    } else {
        await buildAll(targets)
    }
    checkAllSizes(targets)
}

async function buildAll(targets) {
    for (const target of targets) {
        await build(target)
    }
}

async function checkAllSizes(targets) {
    if (devOnly) {
        return
    }
    for (const target of targets) {
        checkSize(target)
    }
}

async function build(target) {
    const pkgDir = path.resolve(`packages/${target}`)
    const pkg = require(`${pkgDir}/package.json`)

    // only build published packages for release
    if (isRelease && pkg.private) {
        return
    }

    // if building a specific format, do not remove dist.
    if (!formats) {
        await fs.remove(`${pkgDir}/dist`)
    }

    const env = (pkg.buildOptions && pkg.buildOptions.env) || (devOnly ? 'development' : 'production')
    await execa(
        'rollup',
        [
            '-c',
            '--environment',
            [
                `COMMIT:${commit}`,
                `NODE_ENV:${env}`,
                `TARGET:${target}`,
                formats ? `FORMATS:${formats}` : ``,
                buildTypes ? `TYPES:true` : ``,
                prodOnly ? `PROD_ONLY:true` : ``,
                sourceMap ? `SOURCE_MAP:true` : ``
            ]
                .filter(Boolean)
                .join(',')
        ],
        { stdio: 'inherit' }
    )

    // build types
    if (buildTypes && pkg.types) {
        const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor')
        const extractorConfigPath = path.resolve(pkgDir, `api-extractor.json`)
        const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath)
        const extractorResult = Extractor.invoke(extractorConfig, {
            localBuild: true,
            showVerboseMessages: true
        })

        if (extractorResult.succeeded) {
            // concat additional d.ts to rolled-up dts
            const typesDir = path.resolve(pkgDir, 'types')
            if (await fs.exists(typesDir)) {
                const dtsPath = path.resolve(pkgDir, pkg.types)
                const existing = await fs.readFile(dtsPath, 'utf-8')
                const typeFiles = await fs.readdir(typesDir)
                const toAdd = await Promise.all(
                    typeFiles.map(file => {
                        return fs.readFile(path.resolve(typesDir, file), 'utf-8')
                    })
                )
                await fs.writeFile(dtsPath, existing + '\n' + toAdd.join('\n'))
            }
            console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)))
        } else {
            console.error(
                `API Extractor completed with ${extractorResult.errorCount} errors` +
                    ` and ${extractorResult.warningCount} warnings`
            )
            process.exitCode = 1
        }

        await fs.remove(`${pkgDir}/dist/packages`)
    }
}
