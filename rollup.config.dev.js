import ts from 'rollup-plugin-typescript2'
import html from '@rollup/plugin-html'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import replace from '@rollup/plugin-replace'

import browsersync from 'rollup-plugin-browsersync'
import fs from 'fs'
import { string } from 'rollup-plugin-string'

function filteringTemplate(tpl) {
    const reg = /<!--env-->[\s\S]*<!--env-->/g
    const isProd = process.env.NODE_ENV === 'production'
    if (!isProd) {
        tpl = tpl.replace(reg, '')
    }
    return tpl
}

export default [
    {
        input: 'index.ts',
        output: {
            name: 'wr',
            format: 'iife',
            file: 'dist/replay.js',
            sourcemap: true
        },
        plugins: [
            ts(),
            node(),
            sourcemaps(),
            html({
                template: () => filteringTemplate(fs.readFileSync('tpls/todo.html', 'utf8'))
            }),
            html({
                fileName: 'replay.html',
                template: () => fs.readFileSync('tpls/replay.html')
            }),
            string({
                include: ['**/*.html', '**/*.css'],
                exclude: ['**/index.html', '**/index.css']
            }),
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }),
            browsersync({ codeSync: false, server: 'dist', port: 4321, notify: false, open: false })
        ]
    }
]
