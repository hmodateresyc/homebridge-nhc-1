'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

module.exports = NikoHomeControlLight;

function NikoHomeControlLight(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);
    this.accessory._id = action.id;
    this.accessory.value = this.convertValue(action.value1);
}

NikoHomeControlLight.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlLight.prototype.constructor = NikoHomeControlLight;

NikoHomeControlLight.prototype.convertValue = function(value1) {
    return value1 === 100;
};

NikoHomeControlLight.prototype.updateAccessory = function(accessory, action) {
    accessory.on('identify', this.identify.bind(this));

    const service = accessory.getService(this.Service.Lightbulb)
                 || accessory.addService(this.Service.Lightbulb, accessory.displayName);

    service.getCharacteristic(this.Characteristic.On)
        .onGet(this.getValue.bind(this))
        .onSet(this.setValue.bind(this))
        .on('change', this.changeValue.bind(this));
};

NikoHomeControlLight.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, 'Identify!!!');
    const initialValue = this.accessory.value;
    this.platform.niko.executeActions(this.accessory._id, initialValue ? 0 : 100)
        .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err}`));
    setTimeout(() => {
        this.platform.niko.executeActions(this.accessory._id, initialValue ? 100 : 0)
            .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err}`));
    }, 2000);
    callback();
};

NikoHomeControlLight.prototype.getValue = function() {
    this.platform.log(`Get ${this.accessory.displayName} Light -> ${this.accessory.value}`);
    return this.accessory.value;
};

NikoHomeControlLight.prototype.setValue = function(value) {
    this.accessory.value = value;
    this.platform.niko.executeActions(this.accessory._id, value ? 100 : 0)
        .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err}`));
    this.platform.log(`Set ${this.accessory.displayName} Light -> ${this.accessory.value}`);
};

NikoHomeControlLight.prototype.changeValue = function(oldValue, newValue) {
    if (newValue === undefined) return;
    const value = this.convertValue(newValue);
    if (this.accessory.value !== value) {
        this.accessory.value = value;
        this.platform.log(`Change ${this.accessory.displayName} Light -> ${this.accessory.value}`);
        this.accessory.getService(this.Service.Lightbulb)
            .getCharacteristic(this.Characteristic.On)
            .updateValue(this.accessory.value);
    }
};
