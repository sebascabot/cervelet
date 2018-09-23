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
    '45:A7:38:44': () => player.play(P('./media/Mike Posner - I Took A Pill In Ibiza.mp3')),
    '85:FD:39:44': () => player.play(P('./media/Richard Desjardins - Buck.mp3')),
    '05:84:70:44': () => player.play(P('./media/Star Wars Music Theme.mp3')),
    'F5:27:8F:44': () => player.play(P("./media/LITTLE BIG - Everyday I'm drinking.mp3")),
    'E5:AE:66:44': () => player.play(P("./media/08 Daft Punk - Get Lucky (feat. Pharrell Williams).mp3")),
    '85:DD:B1:44': () => player.play(P("./media/Adele - Hello.mp3")),
    '05:48:3B:44': () => player.play(P("./media/Ah Vous dirai-je Maman.mp3")),
    '15:77:8F:44': () => player.play(P("./media/Bruno Mars - 24K-Magic.mp3")),
    '85:C9:58:44': () => player.play(P("./media/Bryan Adams - Summer Of '69.mp3")),
    '45:45:3A:44': () => player.play(P("./media/Calvin Harris - This Is What You Came For.mp3")),
    '05:D5:3A:44': () => player.play(P("./media/David Bowie - The Man Who Sold the World.mp3")),
    'E5:64:46:44': () => player.play(P("./media/Disturbed- The Sound Of Silence Official Music Video.mp3")),
    '95:88:BE:44': () => player.play(P("./media/Elvis Presley- Suspicious Minds.mp3")),
    '65:4E:69:44': () => player.play(P("./media/Emile Proulx-Cloutier - Votre cochon s'couche.mp3")),
    '55:C4:46:44': () => player.play(P("./media/Everybody knows - Leonard Cohen.mp3")),
    '35:60:70:44': () => player.play(P("./media/George Benson - Affirmation.mp3")),
    'E5:91:BE:44': () => player.play(P("./media/Jain - Come.mp3")),
    '85:BB:3C:44': () => player.play(P("./media/Jennifer Lopez - Dance Again.mp3")),
    '95:09:6D:44': () => player.play(P("./media/Kids United - On Ecrit Sur Les Murs.mp3")),
    'B5:95:BD:44': () => player.play(P("./media/La Compagnie Creole - Ca Fait Rire Les Oiseaux.mp3")),
    'C5:58:67:44': () => player.play(P("./media/La Reine des Neiges.mp3")),
    '85:EB:76:44': () => player.play(P("./media/Los del Rio - Macarena.mp3")),
    'C5:F6:6B:44': () => player.play(P("./media/Louane - Jour 1.mp3")),
    '85:25:3C:44': () => player.play(P("./media/Marie-Mai - Encore une nuit.mp3")),
    '65:51:6D:44': () => player.play(P("./media/Mark Ronson - Uptown Funk (feat. Bruno Mars).mp3")),
    '45:35:3A:44': () => player.play(P("./media/Merry Go Round of Life - Howl's Moving Castle (Joe Hisaishi).mp3")),
    'F5:20:3B:44': () => player.play(P("./media/Mes Aieux - Antonio.mp3")),
    'D5:2F:49:44': () => player.play(P("./media/Miraculous Ladybug.mp3")),
    '15:F7:3A:44': () => player.play(P("./media/Oldelaf et Monsieur D - Le Cafe.mp3")),
    '35:4C:59:44': () => player.play(P("./media/Pentatonix - Daft Punk.mp3")),
    'B5:FF:2E:44': () => player.play(P("./media/Pentatonix - Hallelujah.mp3")),
    'A5:11:F8:43': () => player.play(P("./media/Pirouette, Cacahuete.mp3")),
    '25:3C:BE:44': () => player.play(P("./media/Play That Song - Train.mp3")),
    '35:80:BE:44': () => player.play(P("./media/Queen - We Will Rock You.mp3")),
    '85:DA:3C:44': () => player.play(P("./media/Sia - Cheap Thrills.mp3")),
    '75:4B:60:44': () => player.play(P("./media/Silento Watch Me (Whip Nae Nae).mp3")),
    'F5:FD:8E:44': () => player.play(P("./media/The Weather Girls - It's Raining Men.mp3")),
    '95:73:62:44': () => player.play(P("./media/Twenty One Pilots - Heathens.mp3")),
    '95:64:4C:44': () => player.play(P("./media/Yann Perreau - J'aime les oiseaux.mp3")),
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

        console.log()
        process.stdout.write(' Sender: ')
        console.log(info)
        process.stdout.write('Payload: ')
        console.log(payload)

        if(payload.from === 'rfid') {
            const action = rfid2action[payload.rfid]
            if (action) {
                player.play(P('./snd/Pop.wav'))
                action()
            } else {
                player.play(P('./snd/Laser2.wav'))
                console.log(`WARNING: rfid '${payload.rfid}' not in DB.`)
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
