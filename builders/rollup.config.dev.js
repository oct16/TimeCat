import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { htmlExamples, env } from './rollup.base'
import browsersync from 'rollup-plugin-browsersync'

export default [
    {
        input: 'index.ts',
        output: [
            {
                name: 'cat',
                format: 'iife',
                file: 'dist/timecatjs.min.js'
            }
        ],
        plugins: [
            ts(),
            node({
                browser: true
            }),
            commonjs(),
            ...env(),
            ...htmlExamples(),
            browsersync({ codeSync: false, server: 'dist', port: 4321, notify: false, open: false })
        ]
    }
]
