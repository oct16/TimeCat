const args = require('minimist')(process.argv.slice(2))
const { prompt } = require('enquirer')
const fs = require('fs-extra')
const path = require('path')
const execa = require('execa')
const chalk = require('chalk')
const semver = require('semver')

const skipBuild = args.skipBuild
const isDryRun = args.dry
const skipTests = args.skipTests
const currentVersion = require('../package.json').version
const prerelease = semver.prerelease(currentVersion)
const preId = args.preid || (prerelease && prerelease[0]) || 'alpha'
const versionIncrements = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease']
const packages = fs
    .readdirSync(path.resolve(__dirname, '../packages'))
    .filter(p => !p.endsWith('.ts') && !p.startsWith('.'))
const dryRun = (bin, args, opts = {}) => console.log(chalk.blue(`[dryrun] ${bin} ${args.join(' ')}`), opts)
const inc = i => semver.inc(currentVersion, i, preId)
const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts })
const runIfNotDry = isDryRun ? dryRun : run
const step = msg => console.log(chalk.cyan(msg))
const bin = name => path.resolve(__dirname, '../node_modules/.bin/' + name)
const getPkgRoot = pkg => path.resolve(__dirname, '../packages/' + pkg)
let targetVersion = args._[0]

async function main() {
    if (!targetVersion) {
        // no explicit version, offer suggestions
        const { release } = await prompt({
            type: 'select',
            name: 'release',
            message: 'Select release type',
            choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(['custom'])
        })

        if (release === 'custom') {
            targetVersion = (
                await prompt({
                    type: 'input',
                    name: 'version',
                    message: 'Input custom version',
                    initial: currentVersion
                })
            ).version
        } else {
            targetVersion = release.match(/\((.*)\)/)[1]
        }
    }

    if (!semver.valid(targetVersion)) {
        throw new Error(`invalid target version: ${targetVersion}`)
    }

    const { yes } = await prompt({
        type: 'confirm',
        name: 'yes',
        message: `Releasing v${targetVersion}. Confirm?`
    })

    if (!yes) {
        return
    }

    await runSteps()
}

async function runSteps() {
    // run tests before release
    step('\nRunning tests...')
    if (!skipTests && !isDryRun) {
        await run(bin('jest'), ['--clearCache'])
        await run('yarn', ['test'])
    } else {
        console.log(`(skipped)`)
    }

    // update all package versions and inter-dependencies
    step('\nUpdating cross dependencies...')
    updateVersions(targetVersion)

    // build all packages with types
    step('\nBuilding all packages...')
    if (!skipBuild && !isDryRun) {
        await run('yarn', ['build', '--release'])
        // test generated dts files
        // step('\nVerifying type declarations...')
        // await run('yarn', ['test-dts-only'])
    } else {
        console.log(`(skipped)`)
    }

    // publish packages
    step('\nPublishing packages...')
    for (const pkg of packages) {
        await publishPackage(pkg, targetVersion, runIfNotDry)
    }
}

main()

function updateVersions(version) {
    // 1. update root package.json
    updatePackage(path.resolve(__dirname, '..'), version)
    // 2. update all packages
    packages.forEach(p => updatePackage(getPkgRoot(p), version))
}

function updatePackage(pkgRoot, version) {
    const pkgPath = path.resolve(pkgRoot, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    pkg.version = version
    updateDeps(pkg, 'dependencies', version)
    updateDeps(pkg, 'peerDependencies', version)
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n')
}

function updateDeps(pkg, depType, version) {
    const deps = pkg[depType]
    if (!deps) return
    Object.keys(deps).forEach(dep => {
        if (dep === 'timecatjs' || (dep.startsWith('@timecat') && packages.includes(dep.replace(/^@timecat\//, '')))) {
            console.log(chalk.yellow(`${pkg.name} -> ${depType} -> ${dep}@${version}`))
            deps[dep] = version
        }
    })
}

async function publishPackage(pkgName, version, runIfNotDry) {
    const pkgRoot = getPkgRoot(pkgName)
    const pkgPath = path.resolve(pkgRoot, 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    if (pkg.private) {
        return
    }

    step(`Publishing ${pkgName}...`)
    try {
        await runIfNotDry('yarn', ['publish', '--new-version', version, '--access', 'public'], {
            cwd: pkgRoot,
            stdio: 'pipe'
        })
        console.log(chalk.green(`Successfully published ${pkgName}@${version}`))
    } catch (e) {
        if (e.stderr.match(/previously published/)) {
            console.log(chalk.red(`Skipping already published: ${pkgName}`))
        } else {
            throw e
        }
    }
}
