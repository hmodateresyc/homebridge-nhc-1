'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

module.exports = NikoHomeControlLight;

function NikoHomeControlLight(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);
    this._id = action.id;                              // Change 1: state on controller
    this.value = this.convertValue(action.value1);     // Change 1: state on controller
}

NikoHomeControlLight.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlLight.prototype.constructor = NikoHomeControlLight;

NikoHomeControlLight.prototype.convertValue = function(value1) {
    return value1 === 100;
};

NikoHomeControlLight.prototype.updateAccessory = function(accessory) {  // Change 3: no action param
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
    const initialValue = this.value;  // Change 1
    this.platform.niko.executeActions(this._id, initialValue ? 0 : 100)  // Change 1
        .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err}`));
    setTimeout(() => {
        this.platform.niko.executeActions(this._id, initialValue ? 100 : 0)  // Change 1
            .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err}`));
    }, 2000);
    callback();
};

NikoHomeControlLight.prototype.getValue = function() {
    this.platform.log(`Get ${this.accessory.displayName} Light -> ${this.value}`);  // Change 1
    return this.value;  // Change 1
};

NikoHomeControlLight.prototype.setValue = function(value) {
    this.value = value;  // Change 1
    this.platform.niko.executeActions(this._id, value ? 100 : 0)  // Change 1
        .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err}`));
    this.platform.log(`Set ${this.accessory.displayName} Light -> ${this.value}`);  // Change 1
};

NikoHomeControlLight.prototype.changeValue = function(oldValue, newValue) {
    if (newValue === undefined) return;
    const value = this.convertValue(newValue);
    if (this.value !== value) {  // Change 1
        this.value = value;      // Change 1
        this.platform.log(`Change ${this.accessory.displayName} Light -> ${this.value}`);  // Change 1
        this.accessory.getService(this.Service.Lightbulb)
            .getCharacteristic(this.Characteristic.On)
            .updateValue(this.value);  // Change 1
    }
};
