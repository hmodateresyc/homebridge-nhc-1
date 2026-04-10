'use strict';

var BLIND_CMD_DOWN = 254;
var BLIND_CMD_UP   = 255;
var BLIND_CMD_STOP = 253;

function NikoHomeControlBlind(platform, action = null) {
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

    this.accessory.position = action.value1;
    this.accessory.target = action.value1;
    this.accessory.state = 2;

    this.accessory.time = 30;

    if (this.platform.config.time) {
        this.platform.config.time.forEach((ActionTime) => {
            if (ActionTime.id === action.id) {
                this.accessory.time = ActionTime.time;
            }
        });
    }

    this.running = false;
    this.timeout = null;
}

NikoHomeControlBlind.prototype.createAccessory = function(action) {
    var uuid = this.platform.api.hap.uuid.generate(action.name + action.id);
    var PlatformAccessory = this.platform.api.platformAccessory;

    var accessory = new PlatformAccessory(action.name + action.id, uuid);

    this.updateAccessory(accessory, action);

    this.platform.accessories.push(accessory);
    this.platform.api.registerPlatformAccessories("homebridge-nhc-1", "NikoHomeControl", [accessory]);

    return accessory;
}

NikoHomeControlBlind.prototype.updateAccessory = function(accessory, action) {
    accessory.on('identify', this.identify.bind(this));

    var service = accessory.getService(accessory.displayName);

    if (service == undefined) {
        accessory.addService(this.Service.WindowCovering, accessory.displayName)
    }

    accessory.getService(accessory.displayName)
        .getCharacteristic(this.Characteristic.PositionState)
        .onGet(this.getState.bind(this))
    ;

    accessory.getService(accessory.displayName)
        .getCharacteristic(this.Characteristic.CurrentPosition)
        .onGet(this.getPosition.bind(this))
    ;

    accessory.getService(accessory.displayName)
        .getCharacteristic(this.Characteristic.TargetPosition)
        .onGet(this.getTarget.bind(this))
        .onSet(this.setTarget.bind(this))
        .on('change', this.changeTarget.bind(this))
    ;
}

NikoHomeControlBlind.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, "Identify!!!");
    callback();
}

NikoHomeControlBlind.prototype.getState = function() {
    this.platform.log("Get STATE " + this.accessory.displayName + " Blind -> " + this.accessory.state);
    return this.accessory.state;
}

NikoHomeControlBlind.prototype.getPosition = function() {
    this.platform.log("Get Position " + this.accessory.displayName + " Blind -> " + this.accessory.position);
    return this.accessory.position;
}

NikoHomeControlBlind.prototype.getTarget = function() {
    this.platform.log("Get Target " + this.accessory.displayName + " Blind -> " + this.accessory.target);
    return this.accessory.target;
}

NikoHomeControlBlind.prototype.setTarget = function(value) {
    this.accessory.target = value;

    var cmd = this.accessory.target < this.accessory.position ? BLIND_CMD_DOWN : BLIND_CMD_UP;

    this.running = true;
    this.platform.niko.executeActions(this.accessory._id, cmd);
    this.platform.log("Set Target " + this.accessory.displayName + " Blind -> " + this.accessory.target);
}

NikoHomeControlBlind.prototype.move = function() {
    var that = this;
    this.platform.log('move position => ', this.accessory.position, this.accessory.target);
    var direction = this.accessory.target > this.accessory.position ? 1 : -1;

    if (Math.abs(this.accessory.target - this.accessory.position) > 0) {
        that.accessory.position += direction;
        this.timeout = setTimeout(function(){
            that.move();
        }, this.accessory.time * 10);
    } else {
        this.platform.log('DONE');
        this.running = false;
        this.platform.niko.executeActions(this.accessory._id, BLIND_CMD_STOP);
        this.accessory
            .getService(this.accessory.displayName)
            .getCharacteristic(this.Characteristic.CurrentPosition)
            .updateValue(this.accessory.position);
        this.accessory
            .getService(this.accessory.displayName)
            .getCharacteristic(this.Characteristic.PositionState)
            .updateValue(2);
    }
}

NikoHomeControlBlind.prototype.stop = function() {
    if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
    }
    this.running = false;
}

NikoHomeControlBlind.prototype.changeTarget = function(oldValue, newValue) {
    this.platform.log('CHANGE Target');
    if (newValue === undefined) {
        return;
    }

    if (null === oldValue && false === this.running) {
        this.accessory.position = newValue;
        this.accessory.target = newValue;
        this.accessory.state = 2;
        this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.accessory.position);
        this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.accessory.target);
        this.accessory.getService(this.accessory.displayName).getCharacteristic(this.Characteristic.PositionState).updateValue(this.accessory.state);

        this.platform.log('EVENT');
        return;
    }

    this.stop();
    this.move();
}

NikoHomeControlBlind.prototype.changeValue = function(oldValue, newValue) {
    this.platform.log('CHANGE VALUE', oldValue, newValue);
    this.changeTarget(oldValue, newValue);
}

module.exports = NikoHomeControlBlind
