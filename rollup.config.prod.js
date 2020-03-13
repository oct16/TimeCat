import ts from 'rollup-plugin-typescript2'
import html from '@rollup/plugin-html'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import { terser } from 'rollup-plugin-terser'

import fs from 'fs'
import { string } from 'rollup-plugin-string'

export default {
    input: 'index.ts',
    output: [
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
        terser()
    ]
}
