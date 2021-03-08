import { convertVNode, createElement } from '@timecat/virtual-dom'

function parseHtmlStr(htmlStr: string) {
    const parser = new DOMParser()
    const children = parser.parseFromString(htmlStr, 'text/html').body.children
    return [...children] as HTMLElement[]
}

describe('serialize and deserialize', () => {
    test('pure html', () => {
        const html = document.createElement('html')
        html.setAttribute('lang', 'en')
        html.innerHTML = `
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body>
        </body>`
        const initial = html.outerHTML
        const result = convertVNode(createElement(html))!.outerHTML
        expect(initial).toEqual(result)
    })

    test('pure html element', () => {
        const initial = parseHtmlStr('<h1>123</h1>')[0]
        const result = convertVNode(createElement(initial))
        expect(initial).toEqual(result)
    })

    test('html element with properties', () => {
        const initial = parseHtmlStr('<div><h1 data-test="test" test="test-test">123</h1></div>')[0]
        const result = convertVNode(createElement(initial))
        expect(initial).toEqual(result)
    })

    test('html element with properties', () => {
        const initial = parseHtmlStr(
            '<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg>'
        )[0]
        const result = convertVNode(createElement(initial))
        expect(initial).toEqual(result)
    })

    test('html element and svg', () => {
        const initial = parseHtmlStr(`
        <svg height="130" width="500">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color: rgb(255, 255, 0); stop-opacity: 1;" />
                <stop offset="100%" style="stop-color: rgb(255, 0, 0); stop-opacity: 1;" />
                </linearGradient>
            </defs>
            <ellipse cx="100" cy="70" rx="85" ry="55" fill="url(#grad1)" />
            <text fill="#ffffff" font-size="45" font-family="Verdana" x="50" y="86">SVG</text>
            Sorry, your browser does not support inline SVG.
        </svg>
        `)[0]
        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('A form with input fields for text', () => {
        const initial = parseHtmlStr(`
        <form>
            <label for="fname">First name:</label><br>
            <input type="text" id="fname" name="fname"><br>
            <label for="lname">Last name:</label><br>
            <input type="text" id="lname" name="lname">
        </form>
        `)[0]
        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('A form with radio buttons', () => {
        const initial = parseHtmlStr(`
        <form>
            <input type="radio" id="male" name="gender" value="male">
            <label for="male">Male</label><br>
            <input type="radio" id="female" name="gender" value="female">
            <label for="female">Female</label><br>
            <input type="radio" id="other" name="gender" value="other">
            <label for="other">Other</label>
        </form>
        `)[0]
        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('A form with checkboxes', () => {
        const initial = parseHtmlStr(`
        <form>
            <input type="checkbox" id="vehicle1" name="vehicle1" value="Bike">
            <label for="vehicle1"> I have a bike</label><br>
            <input type="checkbox" id="vehicle2" name="vehicle2" value="Car">
            <label for="vehicle2"> I have a car</label><br>
            <input type="checkbox" id="vehicle3" name="vehicle3" value="Boat">
            <label for="vehicle3"> I have a boat</label>
        </form>
        `)[0]

        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('A select with option', () => {
        const initial = parseHtmlStr(`
        <select id="cars">
            <option value="volvo">Volvo</option>
            <option value="saab">Saab</option>
            <option value="opel">Opel</option>
            <option value="audi">Audi</option>
        </select>
        `)[0]
        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('A element with href', () => {
        const initial = parseHtmlStr(`
        <a href="https://timecatjs.com/"></a>
        `)[0]
        const result = convertVNode(createElement(initial))!
        expect(result.outerHTML).toEqual('<a href="https://timecatjs.com/" target="_blank"></a>')
    })

    test('A href start with #', () => {
        const html = document.createElement('div')
        html.innerHTML = `<a href="#/xxx"></a>`
        const initial = html.firstElementChild!
        const result = convertVNode(createElement(initial))!
        expect(result.outerHTML).toEqual(`<a target="_blank"></a>`)
    })

    test('element with scroll', () => {
        const initial = parseHtmlStr(`
        <textarea></textarea>
        `)[0]
        initial.scrollTop = 100
        initial.scrollLeft = 100
        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('style element with content', () => {
        const html = document.createElement('div')
        html.innerHTML = `<div><style>.test{}</style></div>`
        const initial = html.firstElementChild!
        const result = convertVNode(createElement(initial))!
        expect(initial).toEqual(result)
    })

    test('script with src', () => {
        const html = document.createElement('div')
        html.innerHTML = `<script src="//timecatjs.com/xxx.js"></script>`
        const initial = html.firstElementChild!
        const result = convertVNode(createElement(initial))!
        expect(result.outerHTML).toEqual('<noscript></noscript>')
    })

    test('element with comment', () => {
        const initial = parseHtmlStr(`<div><!-- This is comment --><p></p></div>`)[0]
        const result = convertVNode(createElement(initial))!
        expect(result).toEqual(initial)
    })
})
