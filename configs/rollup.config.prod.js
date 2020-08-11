import path from 'path'
import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import common from './rollup.base'
import ttypescript from 'ttypescript'
import visualizer from 'rollup-plugin-visualizer'

const packagesDir = path.resolve(__dirname, '../packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = p => path.resolve(packageDir, p)

const name = 'timecat'
const outputName = `${process.env.TARGET}js`
export default {
    input: resolve('src/index.ts'),
    output: [
        {
            name,
            format: 'iife',
            file: resolve(`dist/${outputName}.min.js`)
        },
        {
            name,
            format: 'cjs',
            file: resolve(`dist/${outputName}.cjs.js`)
        },
        {
            name,
            format: 'esm',
            file: resolve(`dist/${outputName}.esm.js`)
        }
    ],
    plugins: [
        ts({
            typescript: ttypescript,
            tsconfigOverride: {
                compilerOptions: {
                    plugins: [
                        {
                            transform: '@zerollup/ts-transform-paths',
                            exclude: ['*']
                        }
                    ]
                }
            }
        }),
        node({
            browser: true,
            mainFields: ['module', 'main']
        }),
        // https://github.com/terser/terser#minify-options
        terser({
            compress: {
                warnings: false,
                drop_console: false,
                dead_code: true,
                drop_debugger: true
            },
            output: {
                comments: false,
                beautify: false
            },
            mangle: true
        }),
        ...common(),
        visualizer()
    ]
}
