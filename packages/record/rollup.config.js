import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'record',
                format: 'esm',
                file: 'dist/index.esm.js'
            }
        ],
        plugins: [
            ts(),
            node({
                browser: true
            }),
            commonjs({
                include: /node_modules/
            })
        ]
    }
]
