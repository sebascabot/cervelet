#!/usr/bin/env node

// Configuration
const PORT = 41234
const HOST = '255.255.255.255'

// Built-in lib
const dgram = require('dgram')

const client = dgram.createSocket('udp4');

client.bind(PORT, () => {
    client.setBroadcast(true)

    const json = { from: 'hub', to: 'owl', solid: 'red' }
    client.send(JSON.stringify(json), PORT, HOST, function(err, bytes) {
        if (err) {
            throw err
        }
        console.log(`UDP payload of ${bytes} bytes sent to port ${PORT}`)
        client.close()
    })
})
