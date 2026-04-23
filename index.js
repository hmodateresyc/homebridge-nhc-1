'use strict'

const NikoHomeControlPlatform = require('./lib/NikoHomeControlPlatform')

module.exports = (api) => {
  api.registerPlatform('NikoHomeControl', NikoHomeControlPlatform)
}
