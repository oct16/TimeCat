if (!/yarn\.js$/.test(process.env.npm_execpath || '')) {
    console.warn('\u001b[33mThis repository requires Yarn for scripts to work properly.\u001b[39m\n')
    process.exit(1)
}
