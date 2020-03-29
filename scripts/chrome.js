var args = process.argv.splice(2)
const envDev = args.includes('dev')

const execa = require('execa')
const env = envDev ? 'development' : 'production'

execa(
    'rollup',
    [
        '-c',
        'rollup.config.chrome.js',
        envDev ? '-w' : '',
        '--environment',
        [`NODE_ENV:${env}`].filter(Boolean).join(',')
    ].filter(Boolean),
    {
        stdio: 'inherit'
    }
)
