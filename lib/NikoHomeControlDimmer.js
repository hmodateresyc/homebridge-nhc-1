'use strict';

function NikoHomeControlDimmer(platform, action = null) {
  this.platform = platform;
  this.Service = platform.api.hap.Service;
  this.Characteristic = platform.api.hap.Characteristic;

  var uuid = this.platform.api.hap.uuid.generate(action.name + action.id);
  var foundAccessory = null;

  this.platform.accessories.forEach((access) => {
    if (access.UUID === uuid) {
      foundAccessory = access;
    }
  });

  if (foundAccessory === null) {
    this.accessory = this.createAccessory(action);
  } else {
    this.accessory = foundAccessory;
    this.updateAccessory(this.accessory, action);
  }

  this.accessory._id = action.id;
  this.accessory.value = this.convertValue(action.value1);
}

NikoHomeControlDimmer.prototype.createAccessory = function(action) {
  var uuid = this.platform.api.hap.uuid.generate(action.name + action.id);
  var PlatformAccessory = this.platform.api.platformAccessory;

  var accessory = new PlatformAccessory(action.name + action.id, uuid);

  this.updateAccessory(accessory, action);

  this.platform.accessories.push(accessory);
  this.platform.api.registerPlatformAccessories("homebridge-nhc-1", "NikoHomeControl", [accessory]);

  return accessory;
}

NikoHomeControlDimmer.prototype.updateAccessory = function(accessory, action) {
  accessory.on('identify', this.identify.bind(this));

  var service = accessory.getService(accessory.displayName);

  if (service == undefined) {
    accessory.addService(this.Service.Lightbulb, accessory.displayName)
  }

  accessory.getService(accessory.displayName)
    .getCharacteristic(this.Characteristic.On)
    .onGet(this.getValue.bind(this))
    .onSet(this.setValue.bind(this))
    .on('change', this.changeValue.bind(this))
  ;

  accessory.getService(accessory.displayName)
    .getCharacteristic(this.Characteristic.Brightness)
    .onGet(this.getBrightness.bind(this))
    .onSet(this.setBrightness.bind(this))
    .on('change', this.changeValue.bind(this))
  ;
}

NikoHomeControlDimmer.prototype.convertValue = function(value1) {
  if (value1 === true) {
    return 100;
  } else if (value1 === false) {
    return 0;
  }
  return value1;
}

NikoHomeControlDimmer.prototype.identify = function(callback) {
  this.platform.log(this.accessory.displayName, "Identify!!!");

  var initialValue = this.accessory.value;
  var that = this;

  if (initialValue > 0) {
    this.platform.niko.executeActions(this.accessory._id, 0);
  } else {
    this.platform.niko.executeActions(this.accessory._id, 100);
  }

  setTimeout(function() {
    that.platform.niko.executeActions(that.accessory._id, initialValue);
  }, 2000);

  callback();
}

NikoHomeControlDimmer.prototype.getValue = function() {
  this.platform.log("Get " + this.accessory.displayName + " Dimmer -> " + this.accessory.value);

  return this.accessory.value > 0;
}

NikoHomeControlDimmer.prototype.setValue = function(value) {
  if (value === true && this.accessory.value === 0) {
    this.platform.niko.executeActions(this.accessory._id, 100);
  } else if (value === false && this.accessory.value > 0) {
    this.platform.niko.executeActions(this.accessory._id, 0);
  }
}

NikoHomeControlDimmer.prototype.getBrightness = function() {
  this.platform.log("Get Brightness " + this.accessory.displayName + " Dimmer -> " + this.accessory.value);

  return this.accessory.value;
}

NikoHomeControlDimmer.prototype.setBrightness = function(value) {
  this.accessory.value = value;

  this.platform.niko.executeActions(this.accessory._id, value);
  this.platform.log("Set Brightness " + this.accessory.displayName + " Dimmer -> " + this.accessory.value);
}

NikoHomeControlDimmer.prototype.changeValue = function(oldValue, newValue) {
  if (newValue === undefined) {
    return;
  }

  var value = this.convertValue(newValue);

  if (this.accessory.value !== value) {
    this.accessory.value = value;

    this.platform.log("Change " + this.accessory.displayName + " Dimmer -> " + this.accessory.value);
    this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.Brightness).updateValue(this.accessory.value);
    if (value === 0) {
      this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.On).updateValue(false);
    } else {
      this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.On).updateValue(true);
    }
  }
}

module.exports = NikoHomeControlDimmer
