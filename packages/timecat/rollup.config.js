import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'

const env = () => {
    return [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
}

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'timecat',
                format: 'esm',
                file: 'dist/timecatjs.esm.js'
            },
            {
                name: 'timecat',
                format: 'cjs',
                file: 'dist/timecatjs.cjs.js'
            },
            {
                name: 'timecat',
                format: 'iife',
                file: 'dist/timecatjs.min.js'
            }
        ],
        plugins: [
            ts(),
            node({
                browser: true
            }),
            ...env(),
            commonjs({
                include: /node_modules/
            })
        ]
    }
]
