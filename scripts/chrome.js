const execa = require('execa')
const env = 'production'

execa(
    'rollup',
    ['-c', 'rollup.config.chrome.js', '-w', '--environment', [`NODE_ENV:${env}`].filter(Boolean).join(',')],
    {
        stdio: 'inherit'
    }
)
