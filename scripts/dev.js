const execa = require('execa')
const args = require('minimist')(process.argv.slice(2))
const formats = args.formats || args.f
const commit = execa.sync('git', ['rev-parse', 'HEAD']).stdout.slice(0, 7)

execa(
    'rollup',
    [
        '-c',
        'rollup.config.dev.js',
        '-w',
        '--environment',
        [`COMMIT:${commit}`, `FORMATS:${formats || 'global'}`, 'SOURCE_MAP:true'].filter(Boolean).join(',')
    ],
    {
        stdio: 'inherit'
    }
)
