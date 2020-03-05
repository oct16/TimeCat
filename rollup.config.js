import ts from '@rollup/plugin-typescript'
import html from '@rollup/plugin-html'
import browsersync from 'rollup-plugin-browsersync'
import path from 'path'
import fs from 'fs'
import { string } from 'rollup-plugin-string'

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = p => path.resolve(packageDir, p)

const entryFile = 'src/index.ts'
export default {
    input: resolve(entryFile),
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
            include: '**/*.html',
            // Undefined by default
            exclude: ['**/index.html']
        }),
        browsersync({ server: 'dist', port: 4321, notify: false })
    ]
}
