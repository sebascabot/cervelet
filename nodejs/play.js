#!/usr/bin/env node

const player = require('play-sound')(opts = {})

console.log('X')
player.play('./snd/Pop.wav')
console.log('Y')
player.play('./media/trumpet-12.wav')
console.log('Z')
