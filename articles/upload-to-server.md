## TimeCat 进阶：把数据上传到服务器

### 欢迎一起来研究 TimeCat !

在第一部分 [TimeCat 入门：我们的第一个应用](./record-and-replay.md) 结束时，我们已经成功的在本地运行了 TimeCat，并实现了本地的录制功能，不过由于业务需要，我们通常需要将数据保存到服务器中，再从数据库获取数据进行录像回放

那么在接下来的演示中，我们将利用 ``TimeCat`` 和 ``NodeJs`` 来实现这一功能

### 创建一个 NodeJs 新项目

我们利用 ``Koa2`` 来创建一个非常简单的 ``NodeJs`` 服务，首先安装 ``koa2`` 以及相应的中间件

```bash
$ npm i koa koa-router koa-bodyparser koa-logger
```

新建 main.js 文件，并写入示例代码

```js
// project/server/main.js

const Koa = require('koa')
const Router = require('koa-router')
const bodyParser = require('koa-bodyparser')
const logger = require('koa-logger')
const cors = require('@koa/cors')

const app = new Koa()
const port = 5000
const router = new Router()

let records = []

router.post('/records', (ctx, next) => {
    const data = ctx.request.body
    records = records.concat(data)
    ctx.status = 204
})

router.get('/records', (ctx, next) => {
    ctx.body = records
})

router.delete('/records', (ctx, next) => {
    records.length = 0
    ctx.status = 204
})

app.use(cors())
app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())
app.use(logger())
app.listen(port)

console.log('server is running at prot: http://localhost:' + port)
```


我们利用 ``koa`` 创建了 ``http`` 服务，利用 ``koa-router`` 创建了 ``Restful`` 接口，借助``koa-logger``打印了请求日志，通过 ``koa-bodyparser`` 解析了请求体

同时我们创建了3个接口: ``post`` ``get`` ``delete``, 分别用于存储、读取和删除录制数据

执行 main.js 启动服务

```bash
$ node main.js
```

如果看到以下日志，说明候我们的服务已经跑起来了

```bash
server is running at: http://localhost:5000
```

### 改造我们的 TimeCat 应用

> 原项目请参考我们上一篇教程：[TimeCat 入门：我们的第一个应用](./record-and-replay.md)

我们把后端应用放置到 server 目录中，把前端应用放置到 app 目录中，此时的项目结构为：

```bash
- project   // 项目根目录
  - app     // 前端应用
  - server  // 后端应用
```
#### 为 ``Record.tsx`` 加入上传功能

首先在组件中加入两个方法，用于上传数据到服务器中和清空服务器已经保存的所有数据
```tsx
// project/app/src/components/Record.tsx

uploadService(records: RecordData[]) {
    return fetch('http://localhost:5000/records', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(records)
    })
}

clearService() {
    return fetch('http://localhost:5000/records', {
        method: 'delete'
    })
}
```

接下来改造 ``componentDidMount`` 方法
在录制初始化之前，我们需要调用 ``await this.clearService()`` 清空服务器已经存储的录制数据

使用 ``Recorder`` 实例上的 ``onData``方法，可以在回调函数中获取每次录制事件的数据，不过由于 ``onData`` 调用频率非常高，最好不要将数据直接发送到服务器中，因为大量的请求将会严重的影响到服务器的性能

我们利用类似 ``Debounce`` 的机制来实现一个缓冲器，例如一个最简单的策略是：

1. 如果有新的数据产生，我们每隔 5 秒上传一次数据
2. 每次至多上传 30 条数据，剩余的数据移交至下一次进行上传，以此来控制数据包体积

代码如下

```tsx
// project/app/src/components/Record.tsx

async componentDidMount() {
    await this.clearService()
    this.recorder = new Recorder()
    this.recorder.onData(record => {
        addRecord(record)
    })

    const upLoader = (options = { interval: 5000, max: 30 }) => {
        const records = [] as RecordData[]
        const { max, interval } = options
        let timer: number | undefined
        const self = this

        return function (record?: RecordData) {
            if (record) {
                records.push(record)
            }
            if (!timer && records.length) {
                timer = window.setTimeout(uploadRecords, interval)
            }
        }

        async function uploadRecords() {
            clearTimeout(timer as number)
            timer = undefined
            const maxIndex = Math.min(max, records.length)
            return self.uploadService(records.slice(0, maxIndex))
                .then(() => {
                    records.splice(0, maxIndex)
                    if (records.length) {
                        addRecord()
                    }
                })
        }
    }

    const addRecord = upLoader()
}

```

运行之后，我们的数据已经悄咪咪的在后台自动进行上传了

#### 让 ``Player`` 从服务器获取数据并进行播放

播放器的改造非常简单，首先从服务器中下载数据，再让播放器加载下载到的数据，就可以正常播放了，改造如下：

```tsx
// project/app/src/components/Replay.tsx

async componentDidMount() {
    const records = await this.getRecords()
    this.player = new Player({
        target: '.timecat-replay',
        records
    })
}

getRecords() {
    return fetch('http://localhost:5000/records')
        .then(res => res.json()) as Promise<RecordData[]>
}

```

这时候已经可以看到录制效果了

---

以上代码详见: https://github.com/oct16/timecat-demo/tree/upload-to-server

##### [🏠Homepage](../README.md) 


