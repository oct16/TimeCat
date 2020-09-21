type pointItem = { x: number; val: number }

export class Heat {
    options = {
        min: 1,
        max: 100,
        size: 3.5,
        maxOpacity: 0.8
    }
    yAxis: number
    target: HTMLCanvasElement
    points: number[]

    constructor(target: HTMLCanvasElement, points: number[]) {
        this.target = target
        this.points = points

        this.draw(target.getContext('2d')!, points)
    }

    initTarget() {
        const target = this.target
        const { offsetWidth: width, offsetHeight: height } = target.parentElement!

        target.width = width
        target.height = height
        target.style.width = width + 'px'
        target.style.height = height + 'px'
        this.yAxis = Math.floor(height / 2)
    }

    draw(context: CanvasRenderingContext2D, points: number[]) {
        this.initTarget()

        const size = this.options.size
        const circle = this.createCircle(size)
        const circleHalfWidth = circle.width / 2
        const circleHalfHeight = circle.height / 2
        const { width, height } = context.canvas
        const gap = width / points.length
        const maxVal = Math.max.apply(null, points)
        const zoom = Math.ceil(100 / maxVal)

        // order by alpha
        const pointsOrderByAlpha = points.reduce((cur, next, i) => {
            const val = next * zoom
            const alpha = Math.min(1, val / this.options.max).toFixed(2)
            ;(cur[alpha] = cur[alpha] || []).push({
                x: gap * (i + 1) + this.options.size / 2,
                val
            })
            return cur
        }, {} as { [key: string]: pointItem[] })

        // draw circles
        Object.keys(pointsOrderByAlpha).forEach(alpha => {
            context.beginPath()
            context.globalAlpha = +alpha
            pointsOrderByAlpha[alpha].forEach(item => {
                context.drawImage(circle, item.x - circleHalfWidth, this.yAxis - circleHalfHeight)
            })
        })

        // draw color
        const intensity = new Intensity()
        const colored = context.getImageData(0, 0, width, height)

        this.colorize(colored.data, intensity.getImageData())
        context.clearRect(0, 0, width, height)
        context.putImageData(colored, 0, 0)
    }

    colorize(pixels: Uint8ClampedArray, gradient: number[]) {
        const options = this.options

        const jMin = 0
        const jMax = 1024

        const maxOpacity = options.maxOpacity
        // range = options.range

        for (let i = 3, len = pixels.length, j; i < len; i += 4) {
            j = pixels[i] * 4 // get gradient color from opacity value

            if (pixels[i] / 256 > maxOpacity) {
                pixels[i] = 256 * maxOpacity
            }

            if (j && j >= jMin && j <= jMax) {
                pixels[i - 3] = gradient[j]
                pixels[i - 2] = gradient[j + 1]
                pixels[i - 1] = gradient[j + 2]
            } else {
                pixels[i] = 0
            }
        }
    }

    createCircle(size: number) {
        const shadowBlur = size / 2
        const r2 = size + shadowBlur
        const offsetDistance = 10000

        const circle = createCanvas(r2 * 2, r2 * 2)
        const context = circle.getContext('2d')!

        context.shadowBlur = shadowBlur
        context.shadowColor = 'black'
        context.shadowOffsetX = context.shadowOffsetY = offsetDistance

        context.beginPath()
        context.arc(r2 - offsetDistance, r2 - offsetDistance, size, 0, Math.PI * 2, true)
        context.closePath()
        context.fill()
        return circle
    }
}

function createCanvas(width: number, height: number) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
}

type IntensityOptions = {
    minSize: number
    maxSize: number
    min: number
    max: number
    gradient: { [key: number]: string }
}

class Intensity {
    paletteCtx: CanvasRenderingContext2D
    gradient: { [key: string]: string }
    minSize: number
    maxSize: number
    min: number
    max: number
    constructor(options?: Partial<IntensityOptions>) {
        this.initOption(options)
        this.initPalette()
    }

    initOption(options?: Partial<IntensityOptions>) {
        options = options || {}
        this.gradient = options.gradient || {
            0.25: 'rgba(0, 0, 255, 1)',
            0.55: 'rgba(0, 255, 0, 1)',
            0.85: 'rgba(255, 255, 0, 1)',
            1.0: 'rgba(255, 0, 0, 1)'
        }
        this.maxSize = options.maxSize || 35
        this.minSize = options.minSize || 0
        this.max = options.max || 100
        this.min = options.min || 0
    }

    initPalette() {
        const gradient = this.gradient
        const canvas = createCanvas(256, 1)
        const paletteCtx = (this.paletteCtx = canvas.getContext('2d')!)
        const lineGradient = paletteCtx.createLinearGradient(0, 0, 256, 1)

        Object.keys(gradient).forEach(key => {
            lineGradient.addColorStop(parseFloat(key), gradient[key])
        })

        paletteCtx.fillStyle = lineGradient
        paletteCtx.fillRect(0, 0, 256, 1)
    }

    getImageData(value?: number) {
        const imageData = this.paletteCtx.getImageData(0, 0, 256, 1).data

        if (value === undefined) {
            return Array.from(imageData)
        }

        const max = this.max
        const min = this.min

        if (value > max) {
            value = max
        }

        if (value < min) {
            value = min
        }

        const index = Math.floor(((value - min) / (max - min)) * (256 - 1)) * 4

        return [imageData[index], imageData[index + 1], imageData[index + 2], imageData[index + 3]]
    }
}
