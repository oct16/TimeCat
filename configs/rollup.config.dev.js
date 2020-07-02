import path from 'path'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import ts from 'rollup-plugin-typescript2'
import browsersync from 'rollup-plugin-browsersync'
import scss from 'rollup-plugin-scss'
import { string } from 'rollup-plugin-string'
import { htmlExamples, env } from './rollup.base'

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
            browsersync({ codeSync: false, server: resolve('dist'), port: 4321, notify: false, open: false })
        ]
    }
]
