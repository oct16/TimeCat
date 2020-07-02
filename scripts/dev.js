const execa = require('execa')
const env = 'development'
const args = require('minimist')(process.argv.slice(2))
const target = 'timecat'
const formats = args.formats || args.f

execa(
    'rollup',
    [
        '-c',
        'configs/rollup.config.dev.js',
        '-w',
        '--environment',
        [`NODE_ENV:${env}`, `TARGET:${target}`, `FORMATS:${formats || 'global'}`]
    ],
    {
        stdio: 'inherit'
    }
)
