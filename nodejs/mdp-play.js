#!/usr/bin/env node

const net = require('net')

var client = new net.Socket();

client.connect(6600, 'localhost', () => client.write([
    'clear',
    'add "Adele - Hello.mp3"',
    'play',
    '',
].join('\n')));
