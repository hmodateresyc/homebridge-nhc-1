'use strict';

function NikoHomeControlLight(platform, action = null) {
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

NikoHomeControlLight.prototype.createAccessory = function(action) {
  var uuid = this.platform.api.hap.uuid.generate(action.name + action.id);
  var PlatformAccessory = this.platform.api.platformAccessory;

  var accessory = new PlatformAccessory(action.name + action.id, uuid);

  this.updateAccessory(accessory, action);

  this.platform.accessories.push(accessory);
  this.platform.api.registerPlatformAccessories("homebridge-nhc-1", "NikoHomeControl", [accessory]);

  return accessory;
}

NikoHomeControlLight.prototype.updateAccessory = function(accessory, action) {
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
}

NikoHomeControlLight.prototype.convertValue = function(value1) {
  return value1 === 100;
}

NikoHomeControlLight.prototype.identify = function(callback) {
  this.platform.log(this.accessory.displayName, "Identify!!!");

  var that = this;
  var initialValue = this.accessory.value;

  if (initialValue === true) {
    this.platform.niko.executeActions(this.accessory._id, 0);
  } else {
    this.platform.niko.executeActions(this.accessory._id, 100);
  }

  setTimeout(function() {
    that.platform.niko.executeActions(that.accessory._id, initialValue ? 100 : 0);
  }, 2000);

  callback();
}

NikoHomeControlLight.prototype.getValue = function() {
  this.platform.log("Get " + this.accessory.displayName + " Light -> " + this.accessory.value);

  return this.accessory.value;
}

NikoHomeControlLight.prototype.setValue = function(value) {
  this.accessory.value = value;

  this.platform.niko.executeActions(this.accessory._id, value ? 100 : 0);
  this.platform.log("Set " + this.accessory.displayName + " Light -> " + this.accessory.value);
}

NikoHomeControlLight.prototype.changeValue = function(oldValue, newValue) {
  if (newValue === undefined) {
    return;
  }

  var value = this.convertValue(newValue);

  if (this.accessory.value !== value) {
    this.accessory.value = value;
    this.platform.log("Change " + this.accessory.displayName + " Light -> " + this.accessory.value);
    this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.On).updateValue(this.accessory.value);
  }
}

module.exports = NikoHomeControlLight
