#!/usr/bin/env node

// Built-in libs
const net = require('net')
const dgram = require('dgram')
const P = (p) => require('path').resolve(__dirname, p)

// Configuration
// FIXME: Must force IP Network range from router on WiFi interface.
//        Otherwiser, the IP Network use with 255.255.255.255 is from ETH interface.
//const BROADCAST_IP = '255.255.255.255'
const BROADCAST_IP = '10.0.50.255'
const PORT = 41234

const mdp = {
    host: 'localhost',
    port: 6600
}

const RGB_MAX_OWL = 1023 // MAX PWM for maximum intensity
const RGB_MAX_ICO = 255  // MAX PWM for maximum intensity

const rfid2action = {
    'F6:14:DD:54': doPlay,
    '36:1A:E5:54': doStop,
    '65:83:DA:54': () => playSound('Bleat-SoundBible.com-893851569.mp3'),
    '04:38:68:A2:C8:48:80': () => playSound('Frog Croaking-SoundBible.com-1053984354.mp3'),
    '04:3E:68:A2:C8:48:80': () => playSound('Cat_Meowing_2-Mr_Smith-780889994.mp3'),
    'C6:6F:F3:4A': (payload) => setPattern(payload, 'ico', 'rainbow'),
    'D0:C8:13:33': (payload) => {
        sendRgbColor(payload, 'owl', [0, 0, 0])
        sendRgbColor(payload, 'ico', [0, 0, 0])
    },
    'F6:28:10:4B': (payload) => {
        sendRgbColor(payload, 'owl', [RGB_MAX_OWL, 0, 0])
        sendRgbColor(payload, 'ico', [RGB_MAX_ICO, 0, 0])
    },
    '36:6F:F3:4A': (payload) => {
        sendRgbColor(payload, 'owl', [0, RGB_MAX_OWL, 0])
        sendRgbColor(payload, 'ico', [0, RGB_MAX_ICO, 0])
    },
    'E6:CC:DE:54': (payload) => {
        sendRgbColor(payload, 'owl', [RGB_MAX_OWL, RGB_MAX_OWL, 0])
        sendRgbColor(payload, 'ico', [RGB_MAX_ICO, RGB_MAX_ICO, 0])
    },
    'E6:05:DE:54': (payload) => {
        sendRgbColor(payload, 'owl', [RGB_MAX_OWL, RGB_MAX_OWL, RGB_MAX_OWL])
        sendRgbColor(payload, 'ico', [RGB_MAX_ICO, RGB_MAX_ICO, RGB_MAX_ICO])
    },
    'A5:CB:6C:44': () => playTrack('Camila Cabello - Havana (Audio) ft. Young Thug-HCjNJDNzw8Y.mp3'),
    'E5:B3:48:44': () => playTrack('Patte patrouille.mp3'),
    '45:A7:38:44': () => playTrack('Mike Posner - I Took A Pill In Ibiza.mp3'),
    '85:FD:39:44': () => playTrack('Richard Desjardins - Buck.mp3'),
    '05:84:70:44': () => playTrack('Star Wars Music Theme.mp3'),
    'F5:27:8F:44': () => playTrack("LITTLE BIG - Everyday I'm drinking.mp3"),
    'E5:AE:66:44': () => playTrack("08 Daft Punk - Get Lucky (feat. Pharrell Williams).mp3"),
    '85:DD:B1:44': () => playTrack("Adele - Hello.mp3"),
    '05:48:3B:44': () => playTrack("Ah Vous dirai-je Maman.mp3"),
    '15:77:8F:44': () => playTrack("Bruno Mars - 24K-Magic.mp3"),
    '85:C9:58:44': () => playTrack("Bryan Adams - Summer Of '69.mp3"),
    '45:45:3A:44': () => playTrack("Calvin Harris - This Is What You Came For.mp3"),
    '05:D5:3A:44': () => playTrack("David Bowie - The Man Who Sold the World.mp3"),
    'E5:64:46:44': () => playTrack("Disturbed- The Sound Of Silence Official Music Video.mp3"),
    '95:88:BE:44': () => playTrack("Elvis Presley- Suspicious Minds.mp3"),
    '65:4E:69:44': () => playTrack("Emile Proulx-Cloutier - Votre cochon s'couche.mp3"),
    '55:C4:46:44': () => playTrack("Everybody knows - Leonard Cohen.mp3"),
    '35:60:70:44': () => playTrack("George Benson - Affirmation.mp3"),
    'E5:91:BE:44': () => playTrack("Jain - Come.mp3"),
    '85:BB:3C:44': () => playTrack("Jennifer Lopez - Dance Again.mp3"),
    '95:09:6D:44': () => playTrack("Kids United - On Ecrit Sur Les Murs.mp3"),
    'B5:95:BD:44': () => playTrack("La Compagnie Creole - Ca Fait Rire Les Oiseaux.mp3"),
    'C5:58:67:44': () => playTrack("La Reine des Neiges.mp3"),
    '85:EB:76:44': () => playTrack("Los del Rio - Macarena.mp3"),
    'C5:F6:6B:44': () => playTrack("Louane - Jour 1.mp3"),
    '85:25:3C:44': () => playTrack("Marie-Mai - Encore une nuit.mp3"),
    '65:51:6D:44': () => playTrack("Mark Ronson - Uptown Funk (feat. Bruno Mars).mp3"),
    '45:35:3A:44': () => playTrack("Merry Go Round of Life - Howl's Moving Castle (Joe Hisaishi).mp3"),
    'F5:20:3B:44': () => playTrack("Mes Aieux - Antonio.mp3"),
    'D5:2F:49:44': () => playTrack("Miraculous Ladybug.mp3"),
    '15:F7:3A:44': () => playTrack("Oldelaf et Monsieur D - Le Cafe.mp3"),
    '35:4C:59:44': () => playTrack("Pentatonix - Daft Punk.mp3"),
    'B5:FF:2E:44': () => playTrack("Pentatonix - Hallelujah.mp3"),
    'A5:11:F8:43': () => playTrack("Pirouette, Cacahuete.mp3"),
    '25:3C:BE:44': () => playTrack("Play That Song - Train.mp3"),
    '35:80:BE:44': () => playTrack("Queen - We Will Rock You.mp3"),
    '85:DA:3C:44': () => playTrack("Sia - Cheap Thrills.mp3"),
    '75:4B:60:44': () => playTrack("Silento Watch Me (Whip Nae Nae).mp3"),
    'F5:FD:8E:44': () => playTrack("The Weather Girls - It's Raining Men.mp3"),
    '95:73:62:44': () => playTrack("Twenty One Pilots - Heathens.mp3"),
    '95:64:4C:44': () => playTrack("Yann Perreau - J'aime les oiseaux.mp3"),
}

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
        const { address, port } = info
        process.stdout.write(`${address}:${port} =>\n  `)
        console.log(payload)

        if(payload.from === 'rfid') {
            const action = rfid2action[payload.rfid]
            if (action) {
                action(payload)
            } else {
                console.log(`WARNING: rfid '${payload.rfid}' not in DB.`)
                playSound('Strange Slip-SoundBible.com-223009506.mp3')
                playSound('Sad_Trombone-Joe_Lamb-665429450.mp3')
            }
        }

        if(payload.from === 'ico') {
            if (payload.accel === 'toc') {
                playSound('Smashing-Yuri_Santana-1233262689.mp3');
            }
            if (payload.status === 'sleep') {
                playSound('Good Bye Female-SoundBible.com-894885957.mp3');
            }
        }
    })
    .on('listening', (z) => {
        process.stdout.write('Server listening at ')
        console.log(server.address())
    })


function setPattern (payload, target, pattern) {
    const targets = [].concat(target) // Convert to array
    targets.forEach(t => {
        server.send(JSON.stringify({
            seq: payload.seq,
            from: 'hub',
            to: t,
            pattern: pattern
        }), PORT, BROADCAST_IP)
    })
}

function sendRgbColor (payload, target, [r, g, b]) {
    const targets = [].concat(target) // Convert to array
    targets.forEach(t => {
        server.send(JSON.stringify({
            seq: payload.seq,
            from: 'hub',
            to: t,
            r: r,
            g: g,
            b: b,
        }) + '\n', PORT, BROADCAST_IP)
    })
}

function playSound (sound) {
    var response = ''
    const mdpClient = new net.Socket()
    .connect(mdp.port, mdp.host)
    .on('ready', () => {
        mdpClient.end([
            'clear',
            `add "${sound}"`,
            'play',
            '',
        ].join('\n'));
        console.log(`  Playing sound '${sound}'`)
    })
    .on('data', data => response += data)
    .on('close', () => {
        const expect = 'OK MPD 0.19.0\nOK\nOK\nOK\n'
        if (response !== expect) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${expect}<\n`)
        }
    })
}

function playTrack (track) {
    var response = ''
    const mdpClient = new net.Socket()
    .connect(mdp.port, mdp.host)
    .on('ready', () => {
        mdpClient.end([
            'clear',
            'add ding.mp3',
            `add "${track}"`,
            'play',
            '',
        ].join('\n'));
        console.log(`  Playing track '${track}'`)
    })
    .on('data', data => response += data)
    .on('close', () => {
        const expect = 'OK MPD 0.19.0\nOK\nOK\nOK\nOK\n'
        if (response !== expect) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${expect}<\n`)
        }
    })
}

function doPlay () {
    var response = ''
    const mdpClient = new net.Socket()
    .connect(mdp.port, mdp.host)
    .on('ready', () => {
        mdpClient.end('play\n')
        console.log(`  Do PLAY`)
    })
    .on('data', data => response += data)
    .on('close', () => {
        const expect = 'OK MPD 0.19.0\nOK\n'
        if (response !== expect) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${expect}<\n`)
        }
    })
}

function doStop () {
    var response = ''
    const mdpClient = new net.Socket()
    .connect(mdp.port, mdp.host)
    .on('ready', () => {
        mdpClient.end('stop\n')
        console.log(`  Do STOP`)
    })
    .on('data', data => response += data)
    .on('close', () => {
        const expect = 'OK MPD 0.19.0\nOK\n'
        if (response !== expect) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${expect}<\n`)
        }
    })
}
