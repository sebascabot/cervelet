#!/usr/bin/env node

// Configuration
const PORT = 41234
const HOST = '255.255.255.255'

// Built-in lib
const dgram = require('dgram')

const server = dgram.createSocket('udp4')

server
    .bind(PORT, () => {
        server.setBroadcast(true)
    })
    .on('error', (err) => {
        console.log(`server error:\n${err.stack}`)
        server.close()
    })
    .on('message', (payload, rinfo) => {
        payload = JSON.parse(payload)

        console.log(rinfo)
        console.log(payload)
        console.log()

        if(payload.from === 'rfid') {
            const cardId = payload.rfid.map(x => ("0" + x.toString(16)).slice(-2).toUpperCase()).join(':')
            const action = cardId2action[cardId]
            if (action) {
                action()
            } else {
                console.log(`No action bind to cardId '${cardId}'`)
            }
        }
    })
    .on('listening', (z) => {
        const { address, port } = server.address()
        // console.log(server.address())
        console.log(`server listening ${address}:${port}`)
    })

const MAX = 1023 // MAX PWM for maximum intensity
const cardId2action = {
    'D0:C8:13:33': () => setColor([0, 0, 0]),
    'F6:28:10:4B': () => setColor([MAX, 0, 0]),
    '36:6F:F3:4A': () => setColor([0, MAX, 0]),
    '36:1A:E5:54': () => setColor([0, 0, MAX]),
    'E6:CC:DE:54': () => setColor([MAX, MAX, 0]),
    '65:95:77:44': () => setColor([MAX, MAX, MAX]),
}

function setColor(rgb) {
    console.log(`RGB: ${rgb}`)
    const json = {
        from: 'hub',
        to: 'owl',
        red: rgb[0],
        green: rgb[1],
        blue: rgb[2],
    }
    server.send(JSON.stringify(json), PORT, HOST)
}
