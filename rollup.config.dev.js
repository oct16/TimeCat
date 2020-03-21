import ts from 'rollup-plugin-typescript2'
import html from '@rollup/plugin-html'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import del from 'rollup-plugin-delete'
import browsersync from 'rollup-plugin-browsersync'
import copy from 'rollup-plugin-copy'
import fs from 'fs'
import { string } from 'rollup-plugin-string'

const notDeclarationTS = [
    ts({
        tsconfigOverride: { compilerOptions: { declaration: false } }
    })
]

export default [
    {
        input: 'index.ts',
        output: [
            {
                name: 'wr',
                format: 'esm',
                file: 'dist/replay.esm.js',
                sourcemap: true
            }
        ],
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
        input: 'index.ts',
        output: {
            name: 'wr',
            format: 'iife',
            file: 'dist/chrome/replay.min.js',
            sourcemap: true,
            globals: {}
        },
        plugins: [
            node(),
            string({
                include: ['**/*.html', '**/*.css'],
                exclude: ['**/index.html', '**/index.css']
            }),
            ...notDeclarationTS
        ]
    },
    {
        input: 'packages/chrome/src/background.ts',
        output: {
            format: 'iife',
            moduleName: 'wr-background',
            file: 'dist/chrome/replay-chrome-background.js'
        },
        plugins: [...notDeclarationTS]
    },
    {
        input: 'packages/chrome/src/content.ts',
        output: {
            format: 'iife',
            moduleName: 'wr-content',
            file: 'dist/chrome/replay-chrome-content.js'
        },
        plugins: [
            ...notDeclarationTS,
            copy({
                targets: [{ src: 'packages/chrome/src/assets/*', dest: 'dist/chrome/' }]
            })
        ]
    }
]
