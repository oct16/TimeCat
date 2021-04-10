jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn())
require('fake-indexeddb/auto')
require('jest-webgl-canvas-mock')

if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
    process.on('unhandledRejection', reason => {
        throw reason
    })
    // Avoid memory leak by adding too many listeners
    process.env.LISTENING_TO_UNHANDLED_REJECTION = true
}
