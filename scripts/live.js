const appPort = 9527
const socketPort = 9528
const Koa = require('koa')
const io = require('socket.io')(socketPort)
const app = new Koa()

io.on('connection', socket => {
    console.log('Socket Connection')

    socket.on('record-msg', (html, data) => {
        socket.broadcast.emit('record-data', html, data)
    })
})

app.listen(appPort, () => {
    console.log('Server start at http://localhost:' + appPort)
})
