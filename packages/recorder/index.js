'use strict'

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/recorder.cjs.prod.js')
} else {
    module.exports = require('./dist/recorder.cjs.js')
}
