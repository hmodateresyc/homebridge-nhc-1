'use strict';

const niko = require('./niko');

const NikoHomeControlLight = require('./NikoHomeControlLight');
const NikoHomeControlDimmer = require('./NikoHomeControlDimmer');
const NikoHomeControlBlind = require('./NikoHomeControlBlind');

module.exports = NikoHomeControlPlatform;

function NikoHomeControlPlatform(log, config, api) {
    log('NikoHomeControl Init');

    this.accessories = [];
    this.controllers = [];
    this.niko = niko;
    this.log = log;
    this.config = config;

    if (api) {
        this.api = api;
        this.api.on('didFinishLaunching', () => {
            this.log('DidFinishLaunching');
            this.run();
        });
    }
}

NikoHomeControlPlatform.prototype.configureAccessory = function(accessory) {
    this.log(accessory.displayName, 'Configure Accessory');
    this.accessories.push(accessory);
};

NikoHomeControlPlatform.prototype.run = function() {
    this.log('Run');

    if (!this.config.ip) {
        this.log('ERROR: No IP address configured. Please add \'ip\' to your config.json.');
        return;
    }

    this.niko.init({
        ip: this.config.ip,
        port: 8000,
        timeout: 2000,
        events: true
    });

    niko.events.on('listactions', this.onEventAction.bind(this));

    niko
        .listActions()
        .then(this.listActions.bind(this))
        .catch((err) => {
            this.log('Error connecting to Niko Home Control: ' + err);
            this.log('Retrying in 30 seconds...');
            setTimeout(this.run.bind(this), 30000);
        });
};

NikoHomeControlPlatform.prototype.listActions = function(response) {
    if (!response || !response.data) {
        this.log('ERROR: Unexpected response from Niko Home Control');
        return;
    }

    response.data.forEach((action) => {
        if (this.config.exclude && this.config.exclude.indexOf(action.id) !== -1) {
            return;
        }

        switch (action.type) {
            case 1: this.addAccessory(NikoHomeControlLight, action); break;
            case 2: this.addAccessory(NikoHomeControlDimmer, action); break;
            case 4: this.addAccessory(NikoHomeControlBlind, action); break;
            default: this.log('UNKNOWN ' + action.name + ' type ' + action.type);
        }
    });
};

NikoHomeControlPlatform.prototype.addAccessory = function(className, action) {
    this.log('Add ' + action.name);
    this.controllers[action.id] = new className(this, action);
};

NikoHomeControlPlatform.prototype.onEventAction = function(event) {
    event.data.forEach((action) => {
        if (this.controllers.hasOwnProperty(action.id)) {
            this.controllers[action.id].changeValue(null, action.value1);
        }
    });
};
