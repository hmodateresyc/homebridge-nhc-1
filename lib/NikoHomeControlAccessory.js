'use strict';

const { version } = require('../package.json');

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
        this.setAccessoryInfo(action);
        this.updateAccessory(this.accessory);
    }
}

NikoHomeControlAccessory.prototype.setAccessoryInfo = function(action) {
    this.accessory.getService(this.Service.AccessoryInformation)
        .setCharacteristic(this.Characteristic.Manufacturer, 'Niko')
        .setCharacteristic(this.Characteristic.Model, 'Home Control')
        .setCharacteristic(this.Characteristic.SerialNumber, String(action.id))
        .setCharacteristic(this.Characteristic.FirmwareRevision, version);
};

NikoHomeControlAccessory.prototype.createAccessory = function(action, uuid) {
    const accessory = new this.platform.api.platformAccessory(action.name, uuid);
    this.updateAccessory(accessory);
    this.setAccessoryInfo(action);
    this.platform.accessories.push(accessory);
    this.platform.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
};
