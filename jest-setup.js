const indexedDB = require('fake-indexeddb')
global.window.indexedDB = indexedDB
jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn())
