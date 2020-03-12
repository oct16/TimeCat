const execa = require('execa')

execa(
    'rollup',
    ['-c', 'rollup.config.dev.js', '-w', '--environment', ['FORMATS:umd', 'SOURCE_MAP:true'].filter(Boolean).join(',')],
    {
        stdio: 'inherit'
    }
)
