import ts from '@rollup/plugin-typescript'
import html from '@rollup/plugin-html'
import browsersync from 'rollup-plugin-browsersync'
import fs from 'fs'
import { string } from 'rollup-plugin-string'

export default {
    input: 'index.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'umd'
    },
    plugins: [
        ts(),
        html({
            template: () => fs.readFileSync('examples/dom-update.html')
        }),
        string({
            // Required to be specified
            include: ['**/*.html', '**/*.css'],
            // Undefined by default
            exclude: ['**/index.html', '**/index.css']
        }),
        browsersync({ server: 'dist', port: 4321, notify: false })
    ]
}
