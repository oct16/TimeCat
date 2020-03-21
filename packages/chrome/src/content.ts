console.log('load content')

// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
var wr: any
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { type } = request

    switch (type) {
        case 'RECORD':
            record()
            break
    }
})

function record() {
    const wr = window.wr
    const { DB, record } = wr
    DB.then((db: any) => {
        db.clear()
        const ctr = record({
            emitter: (data: any) => {
                db.add(data)
            }
        })

        setTimeout(() => {
            ctr.uninstall()
            console.log('ready')
        }, 8000)
    })
}
