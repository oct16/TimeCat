import ts from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy'
import replace from '@rollup/plugin-replace'

const notDeclarationTS = [
    ts({
        tsconfigOverride: { compilerOptions: { declaration: false } }
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
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
            }),
            copy({
                targets: [{ src: 'packages/chrome/src/assets/*', dest: 'dist/chrome/' }]
            })
        ]
    }
]
