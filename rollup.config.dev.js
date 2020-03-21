import ts from 'rollup-plugin-typescript2'
import html from '@rollup/plugin-html'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import del from 'rollup-plugin-delete'
import browsersync from 'rollup-plugin-browsersync'
import copy from 'rollup-plugin-copy'
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
            del({ targets: 'dist/*' }),
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
            moduleName: 'wr',
            file: 'dist/chrome/replay-chrome.js'
        },
        plugins: [
            html({
                fileName: 'replay-chrome.html',
                template: () => fs.readFileSync('packages/chrome/src/replay-chrome.html')
            }),
            copy({
                targets: [{ src: 'packages/chrome/src/assets/*', dest: 'dist/chrome/' }]
            })
        ]
    }
]
