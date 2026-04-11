'use strict';

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
        this.updateAccessory(this.accessory, action);
    }
}

NikoHomeControlAccessory.prototype.createAccessory = function(action, uuid) {
    const accessory = new this.platform.api.platformAccessory(action.name, uuid);
    this.updateAccessory(accessory, action);
    this.platform.accessories.push(accessory);
    this.platform.api.registerPlatformAccessories('homebridge-nhc-1', 'NikoHomeControl', [accessory]);
    return accessory;
};
