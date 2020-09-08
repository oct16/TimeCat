import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import { string } from 'rollup-plugin-string'
import scss from 'rollup-plugin-scss'
import node from '@rollup/plugin-node-resolve'
import nodePolyfills from 'rollup-plugin-node-polyfills'

if (!process.env.TARGET) {
    throw new Error('TARGET package must be specified via --environment flag.')
}

const masterVersion = require('./package.json').version
const packagesDir = path.resolve(__dirname, 'packages')
const packageDir = path.resolve(packagesDir, process.env.TARGET)
const name = path.basename(packageDir)

const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve(`package.json`))
const packageOptions = pkg.buildOptions || {}

// ensure TS checks only once for each build
let hasTSChecked = false

const outputConfigs = {
    esm: {
        file: resolve(`dist/${name}.esm.js`),
        format: `es`
    },
    cjs: {
        file: resolve(`dist/${name}.cjs.js`),
        format: `cjs`
    },
    global: {
        file: resolve(`dist/${name}.global.js`),
        format: `iife`
    }
}

const defaultFormats = ['esm', 'cjs']
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',')
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats
const packageConfigs = process.env.PROD_ONLY
    ? []
    : packageFormats.map(format => createConfig(format, outputConfigs[format]))

if (process.env.NODE_ENV === 'production') {
    packageFormats.forEach(format => {
        if (packageOptions.prod === false) {
            return
        }
        if (format === 'cjs') {
            packageConfigs.push(createProductionConfig(format))
        }
        if (/^(global|esm)/.test(format)) {
            packageConfigs.push(createMinifiedConfig(format))
        }
    })
}

export default packageConfigs

function createConfig(format, output, plugins = []) {
    if (!output) {
        console.log(require('chalk').yellow(`invalid format: "${format}"`))
        process.exit(1)
    }

    output.sourcemap = !!process.env.SOURCE_MAP
    output.externalLiveBindings = false

    const isProductionBuild = process.env.__DEV__ === 'false' || /\.prod\.js$/.test(output.file)
    const isESMBuild = /esm/.test(format)
    const isNodeBuild = format === 'cjs'
    const isGlobalBuild = /global/.test(format)

    if (isGlobalBuild) {
        output.name = packageOptions.name || name
        if (name !== 'timecat') {
            output.name = 'window'
            output.extend = true
        }
    }
    output.globals = {}
    output.sourcemap = true

    const shouldEmitDeclarations = process.env.TYPES != null && !hasTSChecked

    const tsPlugin = ts({
        check: process.env.NODE_ENV === 'production' && !hasTSChecked,
        tsconfig: path.resolve(__dirname, 'tsconfig.json'),
        cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
        tsconfigOverride: {
            compilerOptions: {
                sourceMap: output.sourcemap,
                declaration: shouldEmitDeclarations,
                declarationMap: shouldEmitDeclarations
            },
            exclude: ['**/test']
        }
    })

    hasTSChecked = true

    const entryFile = /runtime$/.test(format) ? `src/runtime.ts` : `src/index.ts`

    const external = []
    // const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})]

    const defaultPlugins = [
        scss({
            output: false,
            failOnError: true
        }),
        commonjs({
            include: /node_modules/
        }),
        node({
            browser: true,
            mainFields: ['module', 'main']
        }),
        nodePolyfills(),
        json(),
        string({
            include: ['**/*.html', '**/*.css'],
            exclude: ['**/index.html', '**/index.css']
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            __VERSION__: masterVersion
        })
    ]

    return {
        input: resolve(entryFile),
        external,
        plugins: [tsPlugin, ...defaultPlugins, ...plugins],
        output,
        onwarn: (msg, warn) => {
            if (!/Circular/.test(msg)) {
                warn(msg)
            }
        },
        treeshake: {
            moduleSideEffects: false
        }
    }
}

function createProductionConfig(format) {
    return createConfig(format, {
        file: resolve(`dist/${name}.${format}.prod.js`),
        format: outputConfigs[format].format
    })
}

function createMinifiedConfig(format) {
    const { terser } = require('rollup-plugin-terser')
    return createConfig(
        format,
        {
            file: outputConfigs[format].file.replace(/\.js$/, '.prod.js'),
            format: outputConfigs[format].format
        },
        [
            terser({
                module: /^esm/.test(format),
                compress: {
                    ecma: 2015,
                    pure_getters: true
                },
                output: { comments: false }
            })
        ]
    )
}
