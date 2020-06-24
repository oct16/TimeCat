import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { htmlExamples, env } from './rollup.base'
import browsersync from 'rollup-plugin-browsersync'
import scss from 'rollup-plugin-scss'
import { string } from 'rollup-plugin-string'

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'timecat',
                format: 'iife',
                file: 'dist/timecatjs.min.js'
            }
        ],
        plugins: [
            ts(),
            scss({
                output: false,
                failOnError: true
            }),
            node({
                browser: true
            }),
            commonjs({
                include: /node_modules/
            }),
            string({
                include: ['**/*.html', '**/*.css'],
                exclude: ['**/index.html', '**/index.css']
            }),
            ...env(),
            ...htmlExamples(),
            browsersync({ codeSync: false, server: 'dist', port: 4321, notify: false, open: false })
        ]
    }
]
