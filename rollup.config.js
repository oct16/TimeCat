import ts from '@rollup/plugin-typescript'
import html from '@rollup/plugin-html'
import browsersync from 'rollup-plugin-browsersync'
import path from 'path'

const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = p => path.resolve(packageDir, p)

const entryFile = 'src/index.ts'
export default {
    input: resolve(entryFile),
    output: {
        file: 'dist/bundle.js',
        format: 'es'
    },
    plugins: [ts(), html({}), browsersync({ server: 'dist', port: 4321 })]
}
