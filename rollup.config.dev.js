import ts from 'rollup-plugin-typescript2'
import html from '@rollup/plugin-html'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'

import browsersync from 'rollup-plugin-browsersync'
import copy from 'rollup-plugin-copy-assets'
import fs from 'fs'
import { string } from 'rollup-plugin-string'

export default [
    {
        input: 'index.ts',
        output: {
            name: 'wr',
            format: 'esm',
            file: 'dist/replay.esm.js',
            sourcemap: true
        },
        plugins: [
            ts(),
            node(),
            sourcemaps(),
            html({
                template: () => fs.readFileSync('examples/todo.html')
            }),
            html({
                fileName: 'replay.html',
                template: () => fs.readFileSync('assets/template.html')
            }),
            string({
                include: ['**/*.html', '**/*.css'],
                exclude: ['**/index.html', '**/index.css']
            }),
            browsersync({ codeSync: false, server: 'dist', port: 4321, notify: false, open: false })
        ]
    },
    {
        input: 'packages/chrome/src/index.ts',
        output: {
            format: 'iife',
            moduleName: 'wr'
        },
        plugins: [
            copy({
                assets: ['packages/chrome/assets']
            })
        ]
    }
]
