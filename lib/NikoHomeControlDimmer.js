'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

module.exports = NikoHomeControlDimmer;

function NikoHomeControlDimmer(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);
    this.accessory._id = action.id;
    this.accessory.value = this.convertValue(action.value1);
}

NikoHomeControlDimmer.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlDimmer.prototype.constructor = NikoHomeControlDimmer;

NikoHomeControlDimmer.prototype.convertValue = function(value1) {
    if (value1 === true) return 100;
    if (value1 === false) return 0;
    return value1;
};

NikoHomeControlDimmer.prototype.updateAccessory = function(accessory, action) {
    accessory.on('identify', this.identify.bind(this));

    const service = accessory.getService(this.Service.Lightbulb)
                 || accessory.addService(this.Service.Lightbulb, accessory.displayName);

    service.getCharacteristic(this.Characteristic.On)
        .onGet(this.getValue.bind(this))
        .onSet(this.setValue.bind(this))
        .on('change', this.changeValue.bind(this));

    service.getCharacteristic(this.Characteristic.Brightness)
        .onGet(this.getBrightness.bind(this))
        .onSet(this.setBrightness.bind(this))
        .on('change', this.changeValue.bind(this));
};

NikoHomeControlDimmer.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, 'Identify!!!');
    const initialValue = this.accessory.value;
    this.platform.niko.executeActions(this.accessory._id, initialValue > 0 ? 0 : 100)
        .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err}`));
    setTimeout(() => {
        this.platform.niko.executeActions(this.accessory._id, initialValue)
            .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err}`));
    }, 2000);
    callback();
};

NikoHomeControlDimmer.prototype.getValue = function() {
    this.platform.log(`Get ${this.accessory.displayName} Dimmer -> ${this.accessory.value}`);
    return this.accessory.value > 0;
};

NikoHomeControlDimmer.prototype.setValue = function(value) {
    if (value === true && this.accessory.value === 0) {
        this.platform.niko.executeActions(this.accessory._id, 100)
            .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err}`));
    } else if (value === false && this.accessory.value > 0) {
        this.platform.niko.executeActions(this.accessory._id, 0)
            .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err}`));
    }
};

NikoHomeControlDimmer.prototype.getBrightness = function() {
    this.platform.log(`Get Brightness ${this.accessory.displayName} Dimmer -> ${this.accessory.value}`);
    return this.accessory.value;
};

NikoHomeControlDimmer.prototype.setBrightness = function(value) {
    this.accessory.value = value;
    this.platform.niko.executeActions(this.accessory._id, value)
        .catch(err => this.platform.log(`Error setting brightness ${this.accessory.displayName}: ${err}`));
    this.platform.log(`Set Brightness ${this.accessory.displayName} Dimmer -> ${this.accessory.value}`);
};

NikoHomeControlDimmer.prototype.changeValue = function(oldValue, newValue) {
    if (newValue === undefined) return;
    const value = this.convertValue(newValue);
    if (this.accessory.value !== value) {
        this.accessory.value = value;
        this.platform.log(`Change ${this.accessory.displayName} Dimmer -> ${this.accessory.value}`);
        const service = this.accessory.getService(this.Service.Lightbulb);
        service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.accessory.value);
        service.getCharacteristic(this.Characteristic.On).updateValue(value > 0);
    }
};
