const execa = require('execa')
const env = 'production'

execa(
    'rollup',
    [
        '-c',
        'rollup.config.prod.js',
        '--environment',
        [`NODE_ENV:${env}`, 'formats:umd', 'SOURCE_MAP:true', 'PROD_ONLY:true', 'TYPES:true', 'LEAN:true']
            .filter(Boolean)
            .join(',')
    ],
    {
        stdio: 'inherit'
    }
)
