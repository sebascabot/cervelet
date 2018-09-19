#!/usr/bin/env node

// The 'cervelet' is a simple UDP server


// Built-in lib
const dgram = require('dgram')

// Configuration
const PORT = 41234

const server = dgram.createSocket('udp4')

server
    .bind(PORT)
    .on('error', (err) => {
        console.log(`server error:\n${err.stack}`)
        server.close()
    })
    .on('message', (payload, rinfo) => {
        const json = JSON.parse(payload)
        console.log([
            json.rfid.map(x => ("0" + x.toString(16)).slice(-2).toUpperCase()).join(':'),
            '  ---  ',
            `JSON payload \`${payload}\` from ${rinfo.address}:${rinfo.port}`,
            JSON.stringify(rinfo, null, 2),
        ].join(''))
    })
    .on('listening', (z) => {
        const { address, port } = server.address()
        // console.log(server.address())
        console.log(`server listening ${address}:${port}`)
    })

