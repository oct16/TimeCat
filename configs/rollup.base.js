import fs from 'fs'
import { string } from 'rollup-plugin-string'
import html from '@rollup/plugin-html'
import replace from '@rollup/plugin-replace'

function filteringTemplate(tpl) {
    const reg = /<!--env-->[\s\S]*<!--env-->/g
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
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
            fileName: 'live.html',
            template: () => filteringTemplate(fs.readFileSync('examples/live.html', 'utf8'))
        }),
        (() => {
            if (fs.existsSync('examples/test.html')) {
                return html({
                    fileName: 'test.html',
                    template: () => filteringTemplate(fs.readFileSync('examples/test.html', 'utf8'))
                })
            }
            return null
        })(),
        string({
            include: ['**/*.html', '**/*.css'],
            exclude: ['**/index.html', '**/index.css']
        })
    ].filter(Boolean)
}

export const env = () => {
    return [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
}
