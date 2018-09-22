#!/usr/bin/env node

const player = require('play-sound')(opts = {})

// Configuration
const PORT = 41234
const HOST = '255.255.255.255'

const rfid2action = {
    'D0:C8:13:33': () => setColor([0, 0, 0]),
    'F6:28:10:4B': () => setColor([MAX, 0, 0]),
    '36:6F:F3:4A': () => setColor([0, MAX, 0]),
    '36:1A:E5:54': () => setColor([0, 0, MAX]),
    'E6:CC:DE:54': () => setColor([MAX, MAX, 0]),
    '65:95:77:44': () => setColor([MAX, MAX, MAX]),
    '45:A7:38:44': () => player.play('./media/Mike Posner - I Took A Pill In Ibiza.mp3'),
}

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
    .on('message', (payload, info) => {
        payload = JSON.parse(payload)

        console.log()
        process.stdout.write(' Sender: ')
        console.log(info)
        process.stdout.write('Payload: ')
        console.log(payload)

        if(payload.from === 'rfid') {
            const rfid = payload.rfid.map(x => ("0" + x.toString(16)).slice(-2).toUpperCase()).join(':')
            const action = rfid2action[rfid]
            if (action) {
                player.play('./snd/Pop.wav')
                action()
            } else {
                player.play('./snd/Laser2.wav')
                console.log(`WARNING: rfid '${rfid}' not in DB.`)
            }
        }
    })
    .on('listening', (z) => {
        process.stdout.write('Server listening at ')
        console.log(server.address())
    })

const MAX = 1023 // MAX PWM for maximum intensity

function setColor(rgb) {
    const json = {
        from: 'hub',
        to: 'owl',
        red: rgb[0],
        green: rgb[1],
        blue: rgb[2],
    }
    server.send(JSON.stringify(json), PORT, HOST)
}
