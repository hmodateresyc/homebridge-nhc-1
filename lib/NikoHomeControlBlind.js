'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

const BLIND_CMD_DOWN         = 254;
const BLIND_CMD_UP           = 255;
const BLIND_CMD_STOP         = 253;
const POSITION_STATE_STOPPED = 2;

module.exports = NikoHomeControlBlind;

function NikoHomeControlBlind(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);

    this.accessory._id = action.id;
    this.accessory.position = action.value1;
    this.accessory.target = action.value1;
    this.accessory.state = POSITION_STATE_STOPPED;
    this.accessory.time = 30;

    if (this.platform.config.time) {
        this.platform.config.time.forEach((actionTime) => {
            if (actionTime.id === action.id) {
                this.accessory.time = actionTime.time;
            }
        });
    }

    this.running = false;
    this.timeout = null;
}

NikoHomeControlBlind.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlBlind.prototype.constructor = NikoHomeControlBlind;

NikoHomeControlBlind.prototype.updateAccessory = function(accessory, action) {
    accessory.on('identify', this.identify.bind(this));

    const service = accessory.getService(this.Service.WindowCovering)
                 || accessory.addService(this.Service.WindowCovering, accessory.displayName);

    service.getCharacteristic(this.Characteristic.PositionState)
        .onGet(this.getState.bind(this));

    service.getCharacteristic(this.Characteristic.CurrentPosition)
        .onGet(this.getPosition.bind(this));

    service.getCharacteristic(this.Characteristic.TargetPosition)
        .onGet(this.getTarget.bind(this))
        .onSet(this.setTarget.bind(this))
        .on('change', this.changeTarget.bind(this));
};

NikoHomeControlBlind.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, 'Identify!!!');
    callback();
};

NikoHomeControlBlind.prototype.getState = function() {
    this.platform.log(`Get STATE ${this.accessory.displayName} Blind -> ${this.accessory.state}`);
    return this.accessory.state;
};

NikoHomeControlBlind.prototype.getPosition = function() {
    this.platform.log(`Get Position ${this.accessory.displayName} Blind -> ${this.accessory.position}`);
    return this.accessory.position;
};

NikoHomeControlBlind.prototype.getTarget = function() {
    this.platform.log(`Get Target ${this.accessory.displayName} Blind -> ${this.accessory.target}`);
    return this.accessory.target;
};

NikoHomeControlBlind.prototype.setTarget = function(value) {
    this.accessory.target = value;
    if (this.accessory.target === this.accessory.position) return;
    const cmd = this.accessory.target < this.accessory.position ? BLIND_CMD_DOWN : BLIND_CMD_UP;
    this.running = true;
    this.platform.niko.executeActions(this.accessory._id, cmd)
        .catch(err => this.platform.log(`Error setting blind target ${this.accessory.displayName}: ${err}`));
    this.platform.log(`Set Target ${this.accessory.displayName} Blind -> ${this.accessory.target}`);
};

NikoHomeControlBlind.prototype.move = function() {
    this.platform.log('move position => ', this.accessory.position, this.accessory.target);

    if (this.accessory.target !== this.accessory.position) {
        const direction = this.accessory.target > this.accessory.position ? 1 : -1;
        this.accessory.position += direction;
        this.timeout = setTimeout(() => {
            this.timeout = null;
            this.move();
        }, this.accessory.time * 10);
    } else {
        this.platform.log('DONE');
        this.running = false;
        this.platform.niko.executeActions(this.accessory._id, BLIND_CMD_STOP)
            .catch(err => this.platform.log(`Error stopping blind ${this.accessory.displayName}: ${err}`));
        const service = this.accessory.getService(this.Service.WindowCovering);
        service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.accessory.position);
        service.getCharacteristic(this.Characteristic.PositionState).updateValue(POSITION_STATE_STOPPED);
    }
};

NikoHomeControlBlind.prototype.stop = function() {
    if (this.timeout !== null) {
        clearTimeout(this.timeout);
        this.timeout = null;
    }
    this.running = false;
};

NikoHomeControlBlind.prototype.changeTarget = function(oldValue, newValue) {
    this.platform.log('CHANGE Target');
    if (newValue === undefined) return;

    if (oldValue === null && !this.running) {
        this.accessory.position = newValue;
        this.accessory.target = newValue;
        this.accessory.state = POSITION_STATE_STOPPED;
        const service = this.accessory.getService(this.Service.WindowCovering);
        service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.accessory.position);
        service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.accessory.target);
        service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.accessory.state);
        this.platform.log('EVENT');
        return;
    }

    this.stop();
    this.move();
};

NikoHomeControlBlind.prototype.changeValue = function(oldValue, newValue) {
    this.platform.log('CHANGE VALUE', oldValue, newValue);
    this.changeTarget(oldValue, newValue);
};
