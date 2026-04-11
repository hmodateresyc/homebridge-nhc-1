'use strict';

const NikoHomeControlAccessory = require('./NikoHomeControlAccessory');

const BLIND_CMD_DOWN         = 254;
const BLIND_CMD_UP           = 255;
const BLIND_CMD_STOP         = 253;
const POSITION_STATE_STOPPED = 2;

module.exports = NikoHomeControlBlind;

function NikoHomeControlBlind(platform, action) {
    NikoHomeControlAccessory.call(this, platform, action);

    // Change 1: all state lives on the controller, not the accessory object
    this._id      = action.id;
    this.position = action.value1;
    this.target   = action.value1;
    this.state    = POSITION_STATE_STOPPED;
    this.time     = 30;

    if (this.platform.config.time) {
        this.platform.config.time.forEach((actionTime) => {
            if (actionTime.id === action.id) {
                this.time = actionTime.time;
            }
        });
    }

    this.running = false;
    this.timeout = null;
}

NikoHomeControlBlind.prototype = Object.create(NikoHomeControlAccessory.prototype);
NikoHomeControlBlind.prototype.constructor = NikoHomeControlBlind;

NikoHomeControlBlind.prototype.updateAccessory = function(accessory) {  // Change 3: no action param
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
        .on('change', this.changeValue.bind(this));  // Change 4: was changeTarget
};

NikoHomeControlBlind.prototype.identify = function(callback) {
    this.platform.log(this.accessory.displayName, 'Identify!!!');
    callback();
};

NikoHomeControlBlind.prototype.getState = function() {
    this.platform.log(`Get STATE ${this.accessory.displayName} Blind -> ${this.state}`);  // Change 1
    return this.state;  // Change 1
};

NikoHomeControlBlind.prototype.getPosition = function() {
    this.platform.log(`Get Position ${this.accessory.displayName} Blind -> ${this.position}`);  // Change 1
    return this.position;  // Change 1
};

NikoHomeControlBlind.prototype.getTarget = function() {
    this.platform.log(`Get Target ${this.accessory.displayName} Blind -> ${this.target}`);  // Change 1
    return this.target;  // Change 1
};

NikoHomeControlBlind.prototype.setTarget = function(value) {
    this.target = value;  // Change 1
    if (this.target === this.position) return;  // Change 1
    const cmd = this.target < this.position ? BLIND_CMD_DOWN : BLIND_CMD_UP;  // Change 1
    this.running = true;
    this.platform.niko.executeActions(this._id, cmd)  // Change 1
        .catch(err => this.platform.log(`Error setting blind target ${this.accessory.displayName}: ${err}`));
    this.platform.log(`Set Target ${this.accessory.displayName} Blind -> ${this.target}`);  // Change 1
};

NikoHomeControlBlind.prototype.move = function() {
    this.platform.log('move position => ', this.position, this.target);  // Change 1

    if (this.target !== this.position) {  // Change 1
        const direction = this.target > this.position ? 1 : -1;  // Change 1
        this.position += direction;  // Change 1
        this.timeout = setTimeout(() => {
            this.timeout = null;
            this.move();
        }, this.time * 10);  // Change 1
    } else {
        this.platform.log('DONE');
        this.running = false;
        this.platform.niko.executeActions(this._id, BLIND_CMD_STOP)  // Change 1
            .catch(err => this.platform.log(`Error stopping blind ${this.accessory.displayName}: ${err}`));
        const service = this.accessory.getService(this.Service.WindowCovering);
        service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.position);  // Change 1
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

// Change 4: merged changeValue and changeTarget — removed the pass-through indirection
NikoHomeControlBlind.prototype.changeValue = function(oldValue, newValue) {
    this.platform.log('CHANGE Target');
    if (newValue === undefined) return;

    if (oldValue === null && !this.running) {
        this.position = newValue;  // Change 1
        this.target   = newValue;  // Change 1
        this.state    = POSITION_STATE_STOPPED;  // Change 1
        const service = this.accessory.getService(this.Service.WindowCovering);
        service.getCharacteristic(this.Characteristic.CurrentPosition).updateValue(this.position);  // Change 1
        service.getCharacteristic(this.Characteristic.TargetPosition).updateValue(this.target);    // Change 1
        service.getCharacteristic(this.Characteristic.PositionState).updateValue(this.state);      // Change 1
        this.platform.log('EVENT');
        return;
    }

    this.stop();
    this.move();
};
