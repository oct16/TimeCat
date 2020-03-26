import ts from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy'
import replace from '@rollup/plugin-replace'

const defaultPlugin = [
    ts({
        tsconfigOverride: { compilerOptions: { declaration: false } }
    }),
    replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
]

export default [
    {
        input: 'packages/chrome/src/background.ts',
        output: {
            format: 'iife',
            moduleName: 'wr-background',
            file: 'dist/chrome/replay-chrome-background.js'
        },
        plugins: [...defaultPlugin]
    },
    {
        input: 'packages/chrome/src/page.ts',
        output: {
            format: 'iife',
            moduleName: 'wr-page',
            file: 'dist/chrome/replay-chrome-page.js'
        },
        plugins: [...defaultPlugin]
    },
    {
        input: 'packages/chrome/src/content.ts',
        output: {
            format: 'iife',
            moduleName: 'wr-content',
            file: 'dist/chrome/replay-chrome-content.js'
        },
        plugins: [
            ...defaultPlugin,
            copy({
                targets: [{ src: 'packages/chrome/src/assets/*', dest: 'dist/chrome/' }]
            })
        ]
    }
]
