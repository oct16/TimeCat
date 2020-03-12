import ts from '@rollup/plugin-typescript'
import html from '@rollup/plugin-html'
import node from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'

import fs from 'fs'
import { string } from 'rollup-plugin-string'

export default {
    input: 'index.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'umd',
        sourcemap: true
    },
    plugins: [
        ts(),
        node({
            jsnext: true
        }),
        sourcemaps(),
        html({
            // template: () => fs.readFileSync('examples/test.html')
            template: () => fs.readFileSync('examples/todo.html')
        }),
        string({
            // Required to be specified
            include: ['**/*.html', '**/*.css'],
            // Undefined by default
            exclude: ['**/index.html', '**/index.css']
        })
    ]
}
