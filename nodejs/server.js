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

const HUE = {
    red: 0,
    yellowRed: 30,
    yellow: 60,
    greenYellow: 90,
    green:120,
    cyanGreen: 150,
    cyan: 180,
    blueCyan: 210,
    blue: 240,
    magentaBlue: 270,
    magenta: 300,
    redMagenta: 330,
}

const RGB_MAX_OWL = 1023 // MAX PWM for maximum intensity
const RGB_MAX = 255

const rfid2action = {
    'F6:14:DD:54': doPlay,
    '36:1A:E5:54': doStop,
    '65:83:DA:54': () => doPlaySound('Bleat-SoundBible.com-893851569.mp3'),
    '04:38:68:A2:C8:48:80': () => doPlaySound('Frog Croaking-SoundBible.com-1053984354.mp3'),
    '04:3E:68:A2:C8:48:80': () => doPlaySound('Cat_Meowing_2-Mr_Smith-780889994.mp3'),
    'B6:4B:0E:4B': () => {
        doSendTo('eqbe5', {speed: 0})
        doSendTo('eqbe8', {speed: 0})
    },
    '96:2E:DF:54': () => {
        doSendTo('eqbe5', {brightness: 0})
        doSendTo('eqbe8', {brightness: 0})
    },
    '56:41:DD:54': () => {
        doSendTo('eqbe5', {pattern: 'juggle'})
        doSendTo('eqbe8', {pattern: 'juggle'})
    },
    '66:E6:F4:4A': () => {
        doSendTo('eqbe5', {pattern: 'bpm'})
        doSendTo('eqbe8', {pattern: 'bpm'})
    },
    '66:2A:1A:4B': () => {
        doSendTo('eqbe5', {pattern: 'sinelon'})
        doSendTo('eqbe8', {pattern: 'sinelon'})
        doSendTo('ico', {pattern: 'sinelon'})
    },
    '16:30:FC:4A': () => {
        doSendTo('eqbe5', {pattern: 'confetti'})
        doSendTo('eqbe8', {pattern: 'confetti'})
        doSendTo('ico', {pattern: 'confetti'})
    },
    'C6:6F:F3:4A': () => {
        doSendTo('ico', {pattern: 'rainbow'})
        doSendTo('eqbe5', {pattern: 'rainbow', brightness: 50})
        doSendTo('eqbe8', {pattern: 'rainbow'})
    },
    '06:1A:E4:54': () => {
        doSendTo('ico', {pattern: 'pulse', hue: HUE.red})
    },
    '46:3E:FB:4A': () => {
        doSendTo('ico', {pattern: 'rainbow-glitter'})
    },
    'D0:C8:13:33': () => {
        doSendTo('owl', {r: 0, g: 0, b: 0})
        doSendTo('ico', {brightness: 0})
        doSendTo('eqbe5', {brightness: 0})
        doSendTo('eqbe8', {brightness: 0})
    },
    'F6:28:10:4B': () => { // Solid: RED
        doSendTo('owl', {r: RGB_MAX_OWL, g: 0, b: 0})
        doSendTo('ico', {pattern: 'solid', hue: HUE.red})
        doSendTo('eqbe5', {pattern: 'solid', hue: HUE.red, speed: 0})
        doSendTo('eqbe8', {pattern: 'solid', hue: HUE.red, speed: 0})
    },
    '36:6F:F3:4A': () => {
        doSendTo('owl', {r: 0, g: RGB_MAX_OWL, b: 0})
        doSendTo('ico', {pattern: 'solid', hue: HUE.greenYellow})
        doSendTo('eqbe5', {pattern: 'solid', hue: HUE.greenYellow, speed: 0})
        doSendTo('eqbe8', {pattern: 'solid', hue: HUE.greenYellow, speed: 0})
    },
    'E6:CC:DE:54': () => {
        doSendTo('owl', {r: RGB_MAX_OWL, g: RGB_MAX_OWL, b: 0})
        doSendTo('ico', {pattern: 'solid', hue: HUE.yellow})
        doSendTo('eqbe5', {pattern: 'solid', hue: HUE.yellow, speed: 0})
        doSendTo('eqbe8', {pattern: 'solid', hue: HUE.yellow, speed: 0})
    },
    'E6:05:DE:54': () => {
        doSendTo('owl', {r: RGB_MAX_OWL, g: RGB_MAX_OWL, b: RGB_MAX_OWL})
        doSendTo('ico', {pattern: 'solid', saturation: 0})
        doSendTo('eqbe5', {pattern: 'solid', saturation: 0, speed: 0})
        doSendTo('eqbe8', {pattern: 'solid', saturation: 0, speed: 0})
    },
    '05:87:48:44': () => doPlayTrack("Love Song Beautiful Chinese Song-25uLhe4gl8Q.mp3"),
    'D5:25:92:44': () => doPlayTrack("Rag'n'Bone Man - Human (Official Video)-L3wKzyIN1yk.mp3"),
    'A5:CB:6C:44': () => doPlayTrack('Camila Cabello - Havana (Audio) ft. Young Thug-HCjNJDNzw8Y.mp3'),
    'E5:B3:48:44': () => doPlayTrack('Patte patrouille.mp3'),
    '45:A7:38:44': () => doPlayTrack('Mike Posner - I Took A Pill In Ibiza.mp3'),
    '85:FD:39:44': () => doPlayTrack('Richard Desjardins - Buck.mp3'),
    '05:84:70:44': () => doPlayTrack('Star Wars Music Theme.mp3'),
    'F5:27:8F:44': () => doPlayTrack("LITTLE BIG - Everyday I'm drinking.mp3"),
    'E5:AE:66:44': () => doPlayTrack("08 Daft Punk - Get Lucky (feat. Pharrell Williams).mp3"),
    '85:DD:B1:44': () => doPlayTrack("Adele - Hello.mp3"),
    '05:48:3B:44': () => doPlayTrack("Ah Vous dirai-je Maman.mp3"),
    '15:77:8F:44': () => doPlayTrack("Bruno Mars - 24K-Magic.mp3"),
    '85:C9:58:44': () => doPlayTrack("Bryan Adams - Summer Of '69.mp3"),
    '45:45:3A:44': () => doPlayTrack("Calvin Harris - This Is What You Came For.mp3"),
    '05:D5:3A:44': () => doPlayTrack("David Bowie - The Man Who Sold the World.mp3"),
    'E5:64:46:44': () => doPlayTrack("Disturbed- The Sound Of Silence Official Music Video.mp3"),
    '95:88:BE:44': () => doPlayTrack("Elvis Presley- Suspicious Minds.mp3"),
    '65:4E:69:44': () => doPlayTrack("Emile Proulx-Cloutier - Votre cochon s'couche.mp3"),
    '55:C4:46:44': () => doPlayTrack("Everybody knows - Leonard Cohen.mp3"),
    '35:60:70:44': () => doPlayTrack("George Benson - Affirmation.mp3"),
    'E5:91:BE:44': () => doPlayTrack("Jain - Come.mp3"),
    '85:BB:3C:44': () => doPlayTrack("Jennifer Lopez - Dance Again.mp3"),
    '95:09:6D:44': () => doPlayTrack("Kids United - On Ecrit Sur Les Murs.mp3"),
    'B5:95:BD:44': () => doPlayTrack("La Compagnie Creole - Ca Fait Rire Les Oiseaux.mp3"),
    'C5:58:67:44': () => doPlayTrack("La Reine des Neiges.mp3"),
    '85:EB:76:44': () => doPlayTrack("Los del Rio - Macarena.mp3"),
    'C5:F6:6B:44': () => doPlayTrack("Louane - Jour 1.mp3"),
    '85:25:3C:44': () => doPlayTrack("Marie-Mai - Encore une nuit.mp3"),
    '65:51:6D:44': () => doPlayTrack("Mark Ronson - Uptown Funk (feat. Bruno Mars).mp3"),
    '45:35:3A:44': () => doPlayTrack("Merry Go Round of Life - Howl's Moving Castle (Joe Hisaishi).mp3"),
    'F5:20:3B:44': () => doPlayTrack("Mes Aieux - Antonio.mp3"),
    'D5:2F:49:44': () => doPlayTrack("Miraculous Ladybug.mp3"),
    '15:F7:3A:44': () => doPlayTrack("Oldelaf et Monsieur D - Le Cafe.mp3"),
    '35:4C:59:44': () => doPlayTrack("Pentatonix - Daft Punk.mp3"),
    'B5:FF:2E:44': () => doPlayTrack("Pentatonix - Hallelujah.mp3"),
    'A5:11:F8:43': () => doPlayTrack("Pirouette, Cacahuete.mp3"),
    '25:3C:BE:44': () => doPlayTrack("Play That Song - Train.mp3"),
    '35:80:BE:44': () => doPlayTrack("Queen - We Will Rock You.mp3"),
    '85:DA:3C:44': () => doPlayTrack("Sia - Cheap Thrills.mp3"),
    '75:4B:60:44': () => doPlayTrack("Silento Watch Me (Whip Nae Nae).mp3"),
    'F5:FD:8E:44': () => doPlayTrack("The Weather Girls - It's Raining Men.mp3"),
    '95:73:62:44': () => doPlayTrack("Twenty One Pilots - Heathens.mp3"),
    '95:64:4C:44': () => doPlayTrack("Yann Perreau - J'aime les oiseaux.mp3"),
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
                action()
            } else {
                console.log(`WARNING: rfid '${payload.rfid}' not in DB.`)
                doPlaySound('Sad_Trombone-Joe_Lamb-665429450.mp3')
            }
        }

        if(payload.from === 'ico') {
            if (payload.accel === 'toc') {
                doPlaySound('Smashing-Yuri_Santana-1233262689.mp3');
            }
            if (payload.status === 'sleep') {
                doPlaySound('Good Bye Female-SoundBible.com-894885957.mp3');
            }
        }
    })
    .on('listening', (z) => {
        process.stdout.write('Server listening at ')
        console.log(server.address())
    })

function doSendTo(target, data) {
    const payload = JSON.stringify(Object.assign({
        from: 'hub',
        to: target,
    }, data))

    server.send(payload, PORT, BROADCAST_IP)
}

function doPlaySound (sound) {
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
        const re = /OK MPD 0.\d\d.0\nOK\nOK\nOK\n/m
        if (!response.match(re)) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${re}<\n`)
        }
    })
}

function doPlayTrack (track) {
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
        const re = /OK MPD 0.\d\d.0\nOK\nOK\nOK\nOK\n/m
        if (!response.match(re)) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${re}<\n`)
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
        const re = /OK MPD 0.\d\d.0\nOK\n/m
        if (!response.match(re)) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${re}<\n`)
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
        const re = /OK MPD 0.\d\d.0\nOK\n/m
        if (!response.match(re)) {
            console.log(`  PROBLEM!\n    Got >${response}<\n  but expect\n    >${re}<\n`)
        }
    })
}
