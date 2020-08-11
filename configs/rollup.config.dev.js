import path from 'path'
import node from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'
import browsersync from 'rollup-plugin-browsersync'
import common from './rollup.base'

const packagesDir = path.resolve(__dirname, '../packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = p => path.resolve(packageDir, p)

export default [
    {
        input: resolve('src/index.ts'),
        output: [
            {
                name: 'timecat',
                format: 'iife',
                file: resolve('dist/timecatjs.min.js')
            }
        ],
        plugins: [
            ts(),
            node({
                browser: true
            }),
            ...common(),
            browsersync({ codeSync: false, server: resolve('dist'), port: 4321, notify: false, open: false })
        ]
    }
]
