import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import commonjs from '@rollup/plugin-commonjs'
import { env, htmlExamples } from './rollup.base'

export default {
    input: 'index.ts',
    output: [
        {
            name: 'wr',
            format: 'iife',
            file: 'dist/replay.min.js'
        },
        {
            name: 'wr',
            format: 'cjs',
            file: 'dist/replay.cjs.js'
        },
        {
            name: 'wr',
            format: 'esm',
            file: 'dist/replay.esm.js'
        }
    ],
    plugins: [
        ts({
            tsconfigOverride: { compilerOptions: { declaration: false } }
        }),
        node({
            mainFields: ['module', 'main']
        }),
        commonjs(),
        ...htmlExamples(),
        ...env(),
        terser()
    ]
}
