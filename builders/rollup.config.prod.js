import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import { env, htmlExamples } from './rollup.base'

export default {
    input: 'index.ts',
    output: [
        {
            name: 'cat',
            format: 'iife',
            file: 'dist/timecat.min.js'
        },
        {
            name: 'cat',
            format: 'cjs',
            file: 'dist/timecat.cjs.js'
        },
        {
            name: 'cat',
            format: 'esm',
            file: 'dist/timecat.esm.js'
        }
    ],
    plugins: [
        ts(),
        node({
            browser: true,
            mainFields: ['module', 'main']
        }),
        commonjs(),
        ...htmlExamples(),
        ...env(),
        terser()
    ]
}
