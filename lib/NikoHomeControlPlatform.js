'use strict';

const niko = require('./niko');

const PLUGIN_NAME   = 'homebridge-nhc-1';
const PLATFORM_NAME = 'NikoHomeControl';

const NikoHomeControlLight  = require('./NikoHomeControlLight');
const NikoHomeControlDimmer = require('./NikoHomeControlDimmer');
const NikoHomeControlBlind  = require('./NikoHomeControlBlind');

const ACTION_TYPE_LIGHT  = 1;
const ACTION_TYPE_DIMMER = 2;
const ACTION_TYPE_BLIND  = 4;

// Change 2: map replaces switch — adding a new type only requires a new entry here
const ACTION_HANDLERS = {
    [ACTION_TYPE_LIGHT]:  NikoHomeControlLight,
    [ACTION_TYPE_DIMMER]: NikoHomeControlDimmer,
    [ACTION_TYPE_BLIND]:  NikoHomeControlBlind,
};

module.exports = NikoHomeControlPlatform;

function NikoHomeControlPlatform(log, config, api) {
    log('NikoHomeControl Init');

    this.accessories = [];
    this.controllers = {};
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
        this.log("ERROR: No IP address configured. Please add 'ip' to your config.json.");
        return;
    }

    this.niko.init({
        ip: this.config.ip,
        port: 8000,
        timeout: 2000,
        events: true
    });

    this.niko.events.removeAllListeners('listactions');
    this.niko.events.on('listactions', this.onEventAction.bind(this));

    this.niko
        .listActions()
        .then(this.listActions.bind(this))
        .catch((err) => {
            this.log(`Error connecting to Niko Home Control: ${err}`);
            this.log('Retrying in 30 seconds...');
            setTimeout(this.run.bind(this), 30000);
        });
};

NikoHomeControlPlatform.prototype.listActions = function(response) {
    if (!response || !response.data) {
        this.log('ERROR: Unexpected response from Niko Home Control');
        return;
    }

    const activeUUIDs = new Set();

    response.data.forEach((action) => {
        if (this.config.exclude && this.config.exclude.includes(action.id)) {
            return;
        }

        const Controller = ACTION_HANDLERS[action.type];
        if (Controller) {
            this.addAccessory(Controller, action);
            activeUUIDs.add(this.api.hap.uuid.generate(action.name + action.id));
        } else {
            this.log(`UNKNOWN ${action.name} type ${action.type}`);
        }
    });

    // Unregister any cached accessories that are now excluded or no longer exist
    const stale = this.accessories.filter(a => !activeUUIDs.has(a.UUID));
    if (stale.length > 0) {
        stale.forEach(a => this.log(`Removing stale accessory: ${a.displayName}`));
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, stale);
        this.accessories = this.accessories.filter(a => activeUUIDs.has(a.UUID));
    }
};

NikoHomeControlPlatform.prototype.addAccessory = function(Controller, action) {
    this.log(`Add ${action.name}`);
    this.controllers[action.id] = new Controller(this, action);
};

NikoHomeControlPlatform.prototype.onEventAction = function(event) {
    event.data.forEach((action) => {
        if (Object.prototype.hasOwnProperty.call(this.controllers, action.id)) {
            this.controllers[action.id].changeValue(null, action.value1);
        }
    });
};
