#!/usr/bin/env node

// Built-in libs
const net = require('net')

const mdp = {
    host: 'localhost',
    port: 6600
}
const mdpClient = new net.Socket()
mdpClient
    .on('connect', (x) => console.log('Connected to mdp server.'))
    .connect(mdp.port, mdp.host)

// Configuration
const PORT = 41234
const HOST = '255.255.255.255'

const rfid2action = {
    'D0:C8:13:33': (payload) => setColor(payload, [0, 0, 0]),
    'F6:28:10:4B': (payload) => setColor(payload, [MAX, 0, 0]),
    '36:6F:F3:4A': (payload) => setColor(payload, [0, MAX, 0]),
    '36:1A:E5:54': (payload) => setColor(payload, [0, 0, MAX]),
    'E6:CC:DE:54': (payload) => setColor(payload, [MAX, MAX, 0]),
    '65:95:77:44': (payload) => setColor(payload, [MAX, MAX, MAX]),
    '45:A7:38:44': () => play('Mike Posner - I Took A Pill In Ibiza.mp3'),
    '85:FD:39:44': () => play('Richard Desjardins - Buck.mp3'),
    '05:84:70:44': () => play('Star Wars Music Theme.mp3'),
    'F5:27:8F:44': () => play("LITTLE BIG - Everyday I'm drinking.mp3"),
    'E5:AE:66:44': () => play("08 Daft Punk - Get Lucky (feat. Pharrell Williams).mp3"),
    '85:DD:B1:44': () => play("Adele - Hello.mp3"),
    '05:48:3B:44': () => play("Ah Vous dirai-je Maman.mp3"),
    '15:77:8F:44': () => play("Bruno Mars - 24K-Magic.mp3"),
    '85:C9:58:44': () => play("Bryan Adams - Summer Of '69.mp3"),
    '45:45:3A:44': () => play("Calvin Harris - This Is What You Came For.mp3"),
    '05:D5:3A:44': () => play("David Bowie - The Man Who Sold the World.mp3"),
    'E5:64:46:44': () => play("Disturbed- The Sound Of Silence Official Music Video.mp3"),
    '95:88:BE:44': () => play("Elvis Presley- Suspicious Minds.mp3"),
    '65:4E:69:44': () => play("Emile Proulx-Cloutier - Votre cochon s'couche.mp3"),
    '55:C4:46:44': () => play("Everybody knows - Leonard Cohen.mp3"),
    '35:60:70:44': () => play("George Benson - Affirmation.mp3"),
    'E5:91:BE:44': () => play("Jain - Come.mp3"),
    '85:BB:3C:44': () => play("Jennifer Lopez - Dance Again.mp3"),
    '95:09:6D:44': () => play("Kids United - On Ecrit Sur Les Murs.mp3"),
    'B5:95:BD:44': () => play("La Compagnie Creole - Ca Fait Rire Les Oiseaux.mp3"),
    'C5:58:67:44': () => play("La Reine des Neiges.mp3"),
    '85:EB:76:44': () => play("Los del Rio - Macarena.mp3"),
    'C5:F6:6B:44': () => play("Louane - Jour 1.mp3"),
    '85:25:3C:44': () => play("Marie-Mai - Encore une nuit.mp3"),
    '65:51:6D:44': () => play("Mark Ronson - Uptown Funk (feat. Bruno Mars).mp3"),
    '45:35:3A:44': () => play("Merry Go Round of Life - Howl's Moving Castle (Joe Hisaishi).mp3"),
    'F5:20:3B:44': () => play("Mes Aieux - Antonio.mp3"),
    'D5:2F:49:44': () => play("Miraculous Ladybug.mp3"),
    '15:F7:3A:44': () => play("Oldelaf et Monsieur D - Le Cafe.mp3"),
    '35:4C:59:44': () => play("Pentatonix - Daft Punk.mp3"),
    'B5:FF:2E:44': () => play("Pentatonix - Hallelujah.mp3"),
    'A5:11:F8:43': () => play("Pirouette, Cacahuete.mp3"),
    '25:3C:BE:44': () => play("Play That Song - Train.mp3"),
    '35:80:BE:44': () => play("Queen - We Will Rock You.mp3"),
    '85:DA:3C:44': () => play("Sia - Cheap Thrills.mp3"),
    '75:4B:60:44': () => play("Silento Watch Me (Whip Nae Nae).mp3"),
    'F5:FD:8E:44': () => play("The Weather Girls - It's Raining Men.mp3"),
    '95:73:62:44': () => play("Twenty One Pilots - Heathens.mp3"),
    '95:64:4C:44': () => play("Yann Perreau - J'aime les oiseaux.mp3"),
}

// Built-in lib
const dgram = require('dgram')

const server = dgram.createSocket('udp4')

function P (p) {
    return require('path').resolve(__dirname, p)
}

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
        const { address, port } = info
        process.stdout.write(`${address}:${port} => `)
        console.log(payload)

        if(payload.from === 'rfid') {
            const action = rfid2action[payload.rfid]
            if (action) {
                action(payload)
            } else {
                console.log(`WARNING: rfid '${payload.rfid}' not in DB.`)
            }
        }
    })
    .on('listening', (z) => {
        process.stdout.write('Server listening at ')
        console.log(server.address())
    })

const MAX = 1023 // MAX PWM for maximum intensity

function setColor (payload, rgb) {
    const json = {
        seq: payload.seq,
        from: 'hub',
        to: 'owl',
        red: rgb[0],
        green: rgb[1],
        blue: rgb[2],
    }
    server.send(JSON.stringify(json), PORT, HOST)
}

function play (track) {
    mdpClient.write([
        'clear',
        `add "${track}"`,
        'play',
        '',
    ].join('\n'));
}
