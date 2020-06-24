import ts from 'rollup-plugin-typescript2'
import node from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import scss from 'rollup-plugin-scss'
import { string } from 'rollup-plugin-string'

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                name: 'player',
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
            }),
            scss({
                output: false,
                failOnError: true
            }),
            string({
                include: ['**/*.html', '**/*.css'],
                exclude: ['**/index.html', '**/index.css']
            })
        ]
    }
]
