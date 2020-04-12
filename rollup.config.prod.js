import ts from 'rollup-plugin-typescript2'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'
import commonjs from '@rollup/plugin-commonjs'
import { env, htmlExamples } from './rollup.base'

export default {
    input: 'index.ts',
    output: [
        {
            name: 'wr',
            format: 'iife',
            file: 'dist/replay.min.js',
            sourcemap: true
        },
        {
            name: 'wr',
            format: 'iife',
            file: 'dist/chrome/replay.min.js',
            sourcemap: true
        },
        {
            name: 'wr',
            format: 'cjs',
            file: 'dist/replay.cjs.js',
            sourcemap: true
        },
        {
            name: 'wr',
            format: 'esm',
            file: 'dist/replay.esm.js',
            sourcemap: true
        }
    ],
    plugins: [
        ts(),
        node({
            mainFields: ['module', 'main']
        }),
        commonjs(),
        sourcemaps(),
        ...htmlExamples(),
        ...env(),
        terser(),
        copy({
            targets: [{ src: 'dist/replay.min.js', dest: 'dist/chrome/' }]
        })
    ]
}
