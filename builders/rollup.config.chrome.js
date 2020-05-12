import ts from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy'
import replace from '@rollup/plugin-replace'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const defaultPlugin = [
    ts({
        tsconfigOverride: { compilerOptions: { declaration: false } }
    }),
    node({
        browser: true
    }),
    commonjs(),
    replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.LIVE_MODE': JSON.stringify(process.env.LIVE_MODE)
    })
]

const isDev = process.env.NODE_ENV !== 'production'

const dest = isDev ? 'dist/chrome/' : 'chrome/'

const copyTargets = [
    { src: 'packages/chrome/src/assets/*', dest },
    !isDev ? { src: 'dist/timecat.min.js', dest } : null
].filter(Boolean)

export default [
    {
        input: 'packages/chrome/src/background.ts',
        output: {
            format: 'iife',
            moduleName: 'cat-background',
            file: dest + 'timecat-chrome-background.js'
        },
        plugins: [...defaultPlugin]
    },
    {
        input: 'packages/chrome/src/page.ts',
        output: {
            format: 'iife',
            moduleName: 'cat-page',
            file: dest + 'timecat-chrome-page.js'
        },
        plugins: [...defaultPlugin]
    },
    {
        input: 'packages/chrome/src/content.ts',
        output: {
            format: 'iife',
            moduleName: 'cat-content',
            file: dest + 'timecat-chrome-content.js'
        },
        plugins: [
            ...defaultPlugin,
            copy({
                targets: copyTargets
            })
        ]
    }
]
