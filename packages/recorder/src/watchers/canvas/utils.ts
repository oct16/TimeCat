export function strokesManager(opts: { keys: string[]; fn: Function; wait: number; blockInstances: any[] }) {
    const tasks = Object.create(null) as { [key: number]: { name: any | number; args: any[] }[] }
    const timeouts = Object.create(null) as { [key: number]: number }

    function emitData(this: any, canvasId: number) {
        const timeout = timeouts[canvasId]
        clearTimeout(timeout)
        timeouts[canvasId] = 0
        const calls = tasks[canvasId].slice()
        tasks[canvasId].length = 0

        opts.fn.call(this, canvasId, calls)
    }

    return function (this: any, canvasId: number, name: any, args: any) {
        if (!tasks[canvasId]) {
            tasks[canvasId] = []
        }

        if (!opts.blockInstances.some(instance => args instanceof instance)) {
            tasks[canvasId].push({
                name,
                args
            })
        }

        if (!timeouts[canvasId]) {
            const timeout = window.setTimeout(() => {
                emitData(canvasId)
            }, opts.wait)
            timeouts[canvasId] = timeout
        }
    }
}
