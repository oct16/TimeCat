import { RecorderOptions, IRecorderStatus } from '../types'
import { float32ArrayToBase64 } from '@TimeCat/utils'

export class Recorder {
    static defaultRecordOptions = {
        sampleBits: 8,
        sampleRate: 8000,
        channelCount: 1
    } as RecorderOptions

    private status: IRecorderStatus
    private opts: RecorderOptions

    private audioContext: AudioContext
    private mediaStream: MediaStream
    private processNode: ScriptProcessorNode
    private mediaNode: MediaStreamAudioSourceNode

    generatedBlobBlobUrl: string

    onProgress: ((audioBase64Data: string[]) => void) | null

    constructor(opts: Partial<RecorderOptions> = Recorder.defaultRecordOptions) {
        this.setOptions(opts)
    }

    getOptions(): RecorderOptions {
        return this.opts
    }

    setOptions(opts: Partial<RecorderOptions> = Recorder.defaultRecordOptions) {
        this.opts = { ...this.opts, ...opts }
    }

    private beginRecord() {
        this.audioContext = new window.AudioContext({ sampleRate: this.opts.sampleRate })

        this.mediaNode = this.audioContext.createMediaStreamSource(this.mediaStream)

        let createScript = this.audioContext.createScriptProcessor

        this.processNode = createScript.call(this.audioContext, 4096, this.opts.channelCount, this.opts.channelCount)

        this.processNode.connect(this.audioContext.destination)
        this.processNode.onaudioprocess = onAudioProcess.bind(this)

        function onAudioProcess(this: Recorder, event: AudioProcessingEvent) {
            const inputBuffer = event.inputBuffer

            // 1 channel, temporarily
            const audioBuffer_0 = inputBuffer.getChannelData(0).slice()

            if (this.onProgress) {
                const data = [float32ArrayToBase64(audioBuffer_0)]
                this.onProgress(data)
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

    public async start(opts: Partial<RecorderOptions> = Recorder.defaultRecordOptions) {
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
