'use strict'

if (process.env.NODE_ENV === 'production') {
    module.exports = require('./dist/player.cjs.prod.js')
} else {
    module.exports = require('./dist/player.cjs.js')
}
