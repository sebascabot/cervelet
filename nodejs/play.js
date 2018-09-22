#!/usr/bin/env node

const player = require('play-sound')(opts = {})

console.log('X')
player.play('./snd/ding.mp3')
console.log('Y')
player.play('./media/trumpet-12.wav')
console.log('Z')
