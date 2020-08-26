'use strict'

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/virtual-dom.cjs.prod.js')
} else {
    module.exports = require('./dist/virtual-dom.cjs.js')
}
