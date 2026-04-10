'use strict'

const NikoHomeControlPlatform = require('./lib/NikoHomeControlPlatform')

module.exports = function (homebridge) {
  homebridge.registerPlatform('homebridge-nhc-1', 'NikoHomeControl', NikoHomeControlPlatform, true)
}
