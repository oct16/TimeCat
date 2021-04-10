/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const execa = require('execa')
const path = require('path')
const browserSync = require('browser-sync')
const env = 'development'
const args = require('minimist')(process.argv.slice(2))
const target = 'timecat'
const formats = args.formats || args.f
const sourceMap = args.sourcemap || args.s || true
const resolveRoot = file => path.resolve('.', file)
const resolvePackage = name => path.resolve(resolveRoot('packages'), target, name)

run()

async function run() {
    execa(
        'rollup',
        [
            '-wc',
            '--environment',
            [
                `NODE_ENV:${env}`,
                `TARGET:${target}`,
                `FORMATS:${formats || 'global|esm|cjs'}`,
                sourceMap ? `SOURCE_MAP:true` : ``
            ]
        ],
        {
            stdio: 'inherit'
        }
    )

    await new Promise(r => setTimeout(() => r(), 2000))

    browserSync({
        codeSync: false,
        server: [resolvePackage('dist'), resolveRoot('examples')],
        port: 4321,
        notify: false,
        open: false,
        cors: true,
        rewriteRules: [
            {
                match: '//cdn.jsdelivr.net/npm/timecatjs',
                replace: './timecat.global.js'
            }
        ]
    })
}
