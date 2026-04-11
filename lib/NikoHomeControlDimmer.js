'use strict';

var NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

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

    var service = accessory.getService(accessory.displayName);
    if (!service) {
        accessory.addService(this.Service.Lightbulb, accessory.displayName);
    }

    accessory.getService(accessory.displayName)
        .getCharacteristic(this.Characteristic.On)
        .onGet(this.getValue.bind(this))
        .onSet(this.setValue.bind(this))
        .on('change', this.changeValue.bind(this));

    accessory.getService(accessory.displayName)
        .getCharacteristic(this.Characteristic.Brightness)
        .onGet(this.getBrightness.bind(this))
        .onSet(this.setBrightness.bind(this))
        .on('change', this.changeValue.bind(this));
};

NikoHomeControlDimmer.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, 'Identify!!!');
    var initialValue = this.accessory.value;
    this.platform.niko.executeActions(this.accessory._id, initialValue > 0 ? 0 : 100)
        .catch(err => this.platform.log('Error identifying ' + this.accessory.displayName + ': ' + err));
    setTimeout(() => {
        this.platform.niko.executeActions(this.accessory._id, initialValue)
            .catch(err => this.platform.log('Error identifying ' + this.accessory.displayName + ': ' + err));
    }, 2000);
    callback();
};

NikoHomeControlDimmer.prototype.getValue = function() {
    this.platform.log('Get ' + this.accessory.displayName + ' Dimmer -> ' + this.accessory.value);
    return this.accessory.value > 0;
};

NikoHomeControlDimmer.prototype.setValue = function(value) {
    if (value === true && this.accessory.value === 0) {
        this.platform.niko.executeActions(this.accessory._id, 100)
            .catch(err => this.platform.log('Error setting ' + this.accessory.displayName + ': ' + err));
    } else if (value === false && this.accessory.value > 0) {
        this.platform.niko.executeActions(this.accessory._id, 0)
            .catch(err => this.platform.log('Error setting ' + this.accessory.displayName + ': ' + err));
    }
};

NikoHomeControlDimmer.prototype.getBrightness = function() {
    this.platform.log('Get Brightness ' + this.accessory.displayName + ' Dimmer -> ' + this.accessory.value);
    return this.accessory.value;
};

NikoHomeControlDimmer.prototype.setBrightness = function(value) {
    this.accessory.value = value;
    this.platform.niko.executeActions(this.accessory._id, value)
        .catch(err => this.platform.log('Error setting brightness ' + this.accessory.displayName + ': ' + err));
    this.platform.log('Set Brightness ' + this.accessory.displayName + ' Dimmer -> ' + this.accessory.value);
};

NikoHomeControlDimmer.prototype.changeValue = function(oldValue, newValue) {
    if (newValue === undefined) return;
    var value = this.convertValue(newValue);
    if (this.accessory.value !== value) {
        this.accessory.value = value;
        this.platform.log('Change ' + this.accessory.displayName + ' Dimmer -> ' + this.accessory.value);
        var service = this.accessory.getService(this.accessory.displayName);
        service.getCharacteristic(this.Characteristic.Brightness).updateValue(this.accessory.value);
        service.getCharacteristic(this.Characteristic.On).updateValue(value > 0);
    }
};
