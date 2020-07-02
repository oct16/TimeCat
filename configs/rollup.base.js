import fs from 'fs'
import path from 'path'
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
const examplesPath = path.resolve(__dirname, '../examples')


const resolve = p => path.resolve(examplesPath, p)

export const htmlExamples = () => {
    return [
        html({
            template: () => filteringTemplate(fs.readFileSync(resolve('index.html'), 'utf8'))
        }),
        html({
            fileName: 'todo.html',
            template: () => filteringTemplate(fs.readFileSync(resolve('todo.html'), 'utf8'))
        }),
        html({
            fileName: 'tetris.html',
            template: () => filteringTemplate(fs.readFileSync(resolve('tetris.html'), 'utf8'))
        }),
        html({
            fileName: 'replay.html',
            template: () => filteringTemplate(fs.readFileSync(resolve('player.html'), 'utf8'))
        }),
        html({
            fileName: 'live.html',
            template: () => filteringTemplate(fs.readFileSync(resolve('live.html'), 'utf8'))
        }),
        (() => {
            if (fs.existsSync(resolve('test.html'))) {
                return html({
                    fileName: 'test.html',
                    template: () => filteringTemplate(fs.readFileSync(resolve('test.html'), 'utf8'))
                })
            }
            return null
        })()
    ].filter(Boolean)
}

export const env = () => {
    return [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
}
