import { PlayerComponent } from './components/player'
import { PlayerModule } from './main'
import { PlayerEventTypes } from './types'
import { observer, PlayerReducerTypes, Store } from './utils'

type CMD = {
    cmd: 'speed' | 'jump' | 'pause'
    value?: any
}

// TODO
export class Ctrl {
    constructor(playModule: PlayerModule) {
        this.getPlayer()
        observer.on(PlayerEventTypes.INIT, () => {
            const { player } = playModule?.c?.panel || {}
            this.player = player
            this.initResolve(this.player)
            this.execLastCommand()
        })
    }

    private commands: CMD[] = []
    private player: PlayerComponent
    private initResolve: any

    private commandsGetHandle = (target: any, prop: string, receiver: any) => {
        if (prop === 'push') {
            if (this.player) {
                setTimeout(() => this.execLastCommand())
            }
        }
        return Reflect.get(target, prop, receiver)
    }
    private proxyCommands: CMD[] = new Proxy(this.commands, { get: this.commandsGetHandle })

    private command(cmd: CMD) {
        this.proxyCommands.push(cmd)
    }

    private execLastCommand() {
        let command
        while ((command = this.commands.shift())) {
            const { cmd, value } = command
            this.getPlayer().then(player => {
                switch (cmd) {
                    case 'jump':
                        const { startTime } = Store.getState().progress
                        this.player.jump({ index: 0, time: startTime + value })
                    case 'speed':
                        Store.dispatch({
                            type: PlayerReducerTypes.SPEED,
                            data: { speed: value }
                        })
                        break
                    case 'pause':
                        player.pause()
                        break
                }
            })
        }
    }

    public get duration() {
        const { duration } = Store.getState().progress
        return duration
    }

    public get paused() {
        return this.player.speed === 0
    }

    public get frames() {
        return {
            index: this.player.frameIndex,
            total: this.player.frames.length
        }
    }

    public get currentTime() {
        const { duration } = Store.getState().progress
        const { index, total } = this.frames
        return +((index / total) * duration).toFixed(0)
    }

    public set currentTime(time: number) {
        this.setCurrentTime(time)
    }

    public async setCurrentTime(time: number) {
        this.command({ cmd: 'jump', value: time })
    }

    private async getPlayer(): Promise<PlayerComponent> {
        return await new Promise(r => {
            if (!this.initResolve) {
                this.initResolve = r
            } else {
                r(this.player)
            }
        })
    }

    public async play() {
        this.command({ cmd: 'speed', value: 1 })
    }

    public async pause() {
        this.command({ cmd: 'pause' })
    }
}
