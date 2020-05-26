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
                file: 'lib/timecat.min.js'
            },
            {
                name: 'cat',
                format: 'iife',
                file: 'lib/chrome/timecat.min.js'
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
            browsersync({ codeSync: false, server: 'lib', port: 4321, notify: false, open: false })
        ]
    }
]
