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
    const files = fs.readdirSync(examplesPath)
    return files.map(fileName =>
        html({
            fileName,
            template: () => filteringTemplate(fs.readFileSync(resolve(fileName), 'utf8'))
        })
    )
}

export const env = () => {
    return [
        replace({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
}
