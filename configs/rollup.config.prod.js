import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import { env, htmlExamples } from './rollup.base'
import ttypescript from 'ttypescript'
import visualizer from 'rollup-plugin-visualizer'

export default {
    input: 'index.ts',
    output: [
        {
            name: 'timecat',
            format: 'iife',
            file: 'dist/timecatjs.min.js'
        },
        {
            name: 'timecat',
            format: 'cjs',
            file: 'dist/timecatjs.cjs.js'
        },
        {
            name: 'timecat',
            format: 'esm',
            file: 'dist/timecatjs.esm.js'
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
        commonjs(),
        ...htmlExamples(),
        ...env(),
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
        visualizer()
    ]
}
