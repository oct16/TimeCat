import fs from 'fs'
import { string } from 'rollup-plugin-string'
import html from '@rollup/plugin-html'
import replace from '@rollup/plugin-replace'

function filteringTemplate(tpl) {
    const reg = /<!--env-->[\s\S]*<!--env-->/g
    const isProd = process.env.NODE_ENV === 'production'
    if (!isProd) {
        tpl = tpl.replace(reg, '')
    }
    return tpl
}

export const htmlExamples = () => {
    return [
        html({
            template: () => filteringTemplate(fs.readFileSync('examples/index.html', 'utf8'))
        }),
        html({
            fileName: 'todo.html',
            template: () => filteringTemplate(fs.readFileSync('examples/todo.html', 'utf8'))
        }),
        html({
            fileName: 'tetris.html',
            template: () => filteringTemplate(fs.readFileSync('examples/tetris.html', 'utf8'))
        }),
        html({
            fileName: 'replay.html',
            template: () => filteringTemplate(fs.readFileSync('examples/player.html', 'utf8'))
        }),
        html({
            fileName: 'test.html',
            template: () => fs.readFileSync('examples/test.html', 'utf8')
        }),
        string({
            include: ['**/*.html', '**/*.css'],
            exclude: ['**/index.html', '**/index.css']
        })
    ]
}

export const env = () => {
    return [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
}
