var args = process.argv.splice(2)
const envDev = args.includes('dev')
const envLive = args.includes('live')

const execa = require('execa')
const env = envDev ? 'development' : 'production'
const live = envLive ? 'live' : ''

execa(
    'rollup',
    [
        '-c',
        'builders/rollup.config.chrome.js',
        envDev ? '-w' : '',
        '--environment',
        [`NODE_ENV:${env}`, `LIVE_MODE:${live}`].filter(Boolean).join(',')
    ].filter(Boolean),
    {
        stdio: 'inherit'
    }
)
