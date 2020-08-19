const chalk = require('chalk')
const msgPath = process.env.GIT_PARAMS
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
