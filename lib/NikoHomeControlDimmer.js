'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

module.exports = NikoHomeControlDimmer;

function NikoHomeControlDimmer(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);
    this._id = action.id;                              // Change 1: state on controller
    this.value = this.convertValue(action.value1);     // Change 1: state on controller
}

NikoHomeControlDimmer.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlDimmer.prototype.constructor = NikoHomeControlDimmer;

NikoHomeControlDimmer.prototype.convertValue = function(value1) {
    if (value1 === true) return 100;
    if (value1 === false) return 0;
    return value1;
};

NikoHomeControlDimmer.prototype.updateAccessory = function(accessory) {  // Change 3: no action param
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
    const initialValue = this.value;  // Change 1
    this.platform.niko.executeActions(this._id, initialValue > 0 ? 0 : 100)  // Change 1
        .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err.message}`));
    setTimeout(() => {
        this.platform.niko.executeActions(this._id, initialValue)  // Change 1
            .catch(err => this.platform.log(`Error identifying ${this.accessory.displayName}: ${err.message}`));
    }, 2000);
    callback();
};

NikoHomeControlDimmer.prototype.getValue = function() {
    this.platform.log(`Get ${this.accessory.displayName} Dimmer -> ${this.value}`);  // Change 1
    return this.value > 0;  // Change 1
};

NikoHomeControlDimmer.prototype.setValue = function(value) {
    if (value === true && this.value === 0) {  // Change 1
        this.platform.niko.executeActions(this._id, 100)  // Change 1
            .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err.message}`));
    } else if (value === false && this.value > 0) {  // Change 1
        this.platform.niko.executeActions(this._id, 0)  // Change 1
            .catch(err => this.platform.log(`Error setting ${this.accessory.displayName}: ${err.message}`));
    }
};

NikoHomeControlDimmer.prototype.getBrightness = function() {
    this.platform.log(`Get Brightness ${this.accessory.displayName} Dimmer -> ${this.value}`);  // Change 1
    return this.value;  // Change 1
};

NikoHomeControlDimmer.prototype.setBrightness = function(value) {
    this.value = value;  // Change 1
    this.platform.niko.executeActions(this._id, value)  // Change 1
        .catch(err => this.platform.log(`Error setting brightness ${this.accessory.displayName}: ${err.message}`));
    this.platform.log(`Set Brightness ${this.accessory.displayName} Dimmer -> ${this.value}`);  // Change 1
};

NikoHomeControlDimmer.prototype.changeValue = function(oldValue, newValue) {
    if (newValue === undefined) return;
    const value = this.convertValue(newValue);
    if (this.value !== value) {  // Change 1
        this.value = value;      // Change 1
        this.platform.log(`Change ${this.accessory.displayName} Dimmer -> ${this.value}`);  // Change 1
        const service = this.accessory.getService(this.Service.Lightbulb);
        service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.value);  // Change 1
        service.getCharacteristic(this.Characteristic.On).updateValue(value > 0);
    }
};
