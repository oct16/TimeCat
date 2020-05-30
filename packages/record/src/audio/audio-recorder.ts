import { IRecorderOptions, IRecorderStatus } from '../types'
import { float32ArrayToBase64 } from './transform'

export class Recorder {
    private status: IRecorderStatus
    private opts: IRecorderOptions = {}

    private audioContext: AudioContext
    private mediaStream: MediaStream
    private processNode: ScriptProcessorNode
    private mediaNode: MediaStreamAudioSourceNode

    generatedBlobBlobUrl: string

    onProgress: ((audioBase64Data: string[]) => void) | null

    constructor(opts?: IRecorderOptions) {
        this.setOptions(opts)
    }

    getOptions(): IRecorderOptions {
        return this.opts
    }

    setOptions(opts?: IRecorderOptions) {
        const { sampleBits, sampleRate, channelCount, bufferSize } = opts || {}
        this.opts = {
            bufferSize: this.opts.bufferSize || bufferSize || 1024,
            sampleBits: this.opts.sampleBits || sampleBits || 16,
            sampleRate: this.opts.sampleRate || sampleRate || 44100,
            channelCount: this.opts.channelCount || channelCount || 1
        }
    }

    private beginRecord() {
        const b64strArray: string[] = []
        const timerGap = 5 // each duration around 0.092s

        this.audioContext = new window.AudioContext({ sampleRate: this.opts.sampleRate })
        this.mediaNode = this.audioContext.createMediaStreamSource(this.mediaStream)

        let createScript = this.audioContext.createScriptProcessor

        this.processNode = createScript.call(
            this.audioContext,
            this.opts.bufferSize,
            this.opts.channelCount,
            this.opts.channelCount
        )

        this.processNode.connect(this.audioContext.destination)
        this.processNode.onaudioprocess = onAudioProcess.bind(this)

        function onAudioProcess(this: Recorder, event: AudioProcessingEvent) {
            const inputBuffer = event.inputBuffer
            const audioBuffer_0 = inputBuffer.getChannelData(0)

            if (this.onProgress) {
                if (b64strArray.length >= timerGap) {
                    this.onProgress(b64strArray.slice())
                    b64strArray.length = 0
                }

                const b64str = float32ArrayToBase64(audioBuffer_0.slice())
                b64strArray.push(b64str)
            }
        }
        this.mediaNode.connect(this.processNode)
    }

    private async initRecorder(): Promise<MediaStream> {
        return new Promise((resolve, reject) => {
            window.navigator.mediaDevices
                .getUserMedia({
                    audio: {
                        sampleRate: this.opts.sampleRate,
                        channelCount: this.opts.channelCount
                    }
                })
                .then(mediaStream => resolve(mediaStream))
                .catch(err => reject(err))
        })
    }

    public async start(opts?: IRecorderOptions) {
        this.setOptions(opts)
        this.mediaStream = await this.initRecorder()
        this.beginRecord()
    }

    public stop(): void {
        this.mediaStream && this.mediaStream.getAudioTracks()[0].stop()
        this.processNode && this.processNode.disconnect()
        this.mediaNode && this.mediaNode.disconnect()
    }

    public pause(): void {}

    public resume(): void {}
}
