/**
 * Copyright (c) oct16.
 * https://github.com/oct16
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Here is references and sources from https://github.com/vuejs/vue-next/tree/master/scripts
 */

const chalk = require('chalk')
const msgPath = process.env.HUSKY_GIT_PARAMS || process.env.GIT_PARAMS
const msg = require('fs').readFileSync(msgPath, 'utf-8').trim()
const commitRE = /^(revert: )?(feat|fix|docs|dx|style|refactor|perf|test|workflow|build|ci|chore|types|wip|release)(\(.+\))?: .{1,50}/

if (!commitRE.test(msg)) {
    console.error(
        `  ${chalk.bgRed.white(' ERROR ')} ${chalk.red(`invalid commit message format.`)}\n\n` +
            chalk.red(`  Proper commit message format is required for automated changelog generation. Examples:\n\n`) +
            `    ${chalk.green(`feat(recorder): add 'comments' option`)}\n` +
            `    ${chalk.green(`fix(player): handle events on blur (close #28)`)}\n\n` +
            chalk.red(`  See https://www.conventionalcommits.org/en/v1.0.0/ for more details.\n`)
    )
    process.exit(1)
}
