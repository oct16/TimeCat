'use strict'

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/timecat.cjs.prod.js')
} else {
    module.exports = require('./dist/timecat.cjs.js')
}
