const path = require('path')
const fs = require('fs-extra')
const args = require('minimist')(process.argv.slice(2))
const execa = require('execa')
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)
const devOnly = args.devOnly || args.d
const formats = args.formats || args.f

build()
async function build(target) {
    if (!target) {
        target = 'wr'
    }
    const pkgDir = path.resolve(`packages/${target}`)
    const pkg = require(`${pkgDir}/package.json`)

    await fs.remove(`${pkgDir}/dist`)

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
                formats ? `FORMATS:${formats}` : '',
                'TYPES:true',
                'PROD_ONLY:true',
                'LEAN:true',
                'SOURCE_MAP:true'
            ]
                .filter(Boolean)
                .join(',')
        ],
        { stdio: 'inherit' }
    )
}
