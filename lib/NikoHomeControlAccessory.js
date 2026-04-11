'use strict';

const PLUGIN_NAME   = 'homebridge-nhc-1';
const PLATFORM_NAME = 'NikoHomeControl';

module.exports = NikoHomeControlAccessory;

function NikoHomeControlAccessory(platform, action) {
    this.platform = platform;
    this.Service = platform.api.hap.Service;
    this.Characteristic = platform.api.hap.Characteristic;

    const uuid = platform.api.hap.uuid.generate(action.name + action.id);
    const found = platform.accessories.find(a => a.UUID === uuid) || null;

    if (found === null) {
        this.accessory = this.createAccessory(action, uuid);
    } else {
        this.accessory = found;
        this.updateAccessory(this.accessory);  // Change 3: removed unused action param
    }
}

NikoHomeControlAccessory.prototype.createAccessory = function(action, uuid) {
    const accessory = new this.platform.api.platformAccessory(action.name, uuid);
    this.updateAccessory(accessory);  // Change 3: removed unused action param
    this.platform.accessories.push(accessory);
    this.platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);  // Change 5
    return accessory;
};
