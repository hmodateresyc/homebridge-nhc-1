'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

module.exports = NikoHomeControlAction;

function NikoHomeControlAction(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);
    this._id  = action.id;
    this.value = this.convertValue(action.value1);
}

NikoHomeControlAction.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlAction.prototype.constructor = NikoHomeControlAction;

NikoHomeControlAction.prototype.convertValue = function(value1) {
    return value1 === 100;
};

NikoHomeControlAction.prototype.updateAccessory = function(accessory) {
    accessory.on('identify', this.identify.bind(this));

    const service = accessory.getService(this.Service.Switch)
                 || accessory.addService(this.Service.Switch, accessory.displayName);

    service.getCharacteristic(this.Characteristic.On)
        .onGet(this.getValue.bind(this))
        .onSet(this.setValue.bind(this))
        .on('change', this.changeValue.bind(this));
};

NikoHomeControlAction.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, 'Identify!!!');
    const initialValue = this.value;
    this.platform.niko.executeActions(this._id, initialValue ? 0 : 100)
        .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err.message}`));
    setTimeout(() => {
        this.platform.niko.executeActions(this._id, initialValue ? 100 : 0)
            .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err.message}`));
    }, 2000);
    callback();
};

NikoHomeControlAction.prototype.getValue = function() {
    this.platform.log(`Get ${this.accessory.displayName} Action -> ${this.value}`);
    return this.value;
};

NikoHomeControlAction.prototype.setValue = function(value) {
    this.value = value;
    this.platform.niko.executeActions(this._id, value ? 100 : 0)
        .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err.message}`));
    this.platform.log(`Set ${this.accessory.displayName} Action -> ${this.value}`);
};

NikoHomeControlAction.prototype.changeValue = function(oldValue, newValue) {
    if (newValue === undefined) return;
    const value = this.convertValue(newValue);
    if (this.value !== value) {
        this.value = value;
        this.platform.log(`Change ${this.accessory.displayName} Action -> ${this.value}`);
        this.accessory.getService(this.Service.Switch)
            .getCharacteristic(this.Characteristic.On)
            .updateValue(this.value);
    }
};
