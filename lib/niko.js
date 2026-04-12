'use strict';

const net = require('net');
const EventEmitter = require('events');

const ALLOWED_EVENTS    = new Set(['listactions', 'getactions', 'executeactions']);
const MAX_BUFFER_BYTES  = 64 * 1024;   // 64 KB — guards against unbounded growth
const CONNECT_TIMEOUT   = 10000;       // ms — event socket stall guard

class NikoClient {
    constructor() {
        this.events       = new EventEmitter();
        this._options     = null;
        this._eventSocket = null;     // current event socket instance
        this._reconnecting = false;   // true while setTimeout is pending
    }

    init(opts) {
        this._options = opts;
        if (opts.events) {
            // Destroy any existing socket so a fresh one is created (handles re-init)
            if (this._eventSocket) {
                this._eventSocket.destroy();
                this._eventSocket = null;
            }
            if (!this._reconnecting) {
                this._connectEventSocket();
            }
        }
    }

    listActions() {
        return this._request({ cmd: 'listactions' });
    }

    executeActions(id, value) {
        // M1: validate at the protocol boundary before sending to controller
        if (!Number.isInteger(id) || id < 0) {
            return Promise.reject(new Error(`Invalid action id: ${id}`));
        }
        if (typeof value !== 'number' && typeof value !== 'boolean') {
            return Promise.reject(new Error(`Invalid action value: ${value}`));
        }
        return this._request({ cmd: 'executeactions', id, value1: value });
    }

    _request(obj) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            let buffer  = '';
            let settled = false;

            function settle(fn, value) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                socket.destroy();
                fn(value);
            }

            const timer = setTimeout(
                () => settle(reject, new Error('Timeout')),
                this._options.timeout || 2000
            );

            socket.connect(this._options.port || 8000, this._options.ip, () => {
                socket.write(JSON.stringify(obj) + '\r\n');
            });

            socket.on('data', chunk => {
                buffer += chunk.toString();
                // M2: reject if the controller sends an unexpectedly large response
                if (buffer.length > MAX_BUFFER_BYTES) {
                    settle(reject, new Error('Response too large'));
                    return;
                }
                const lines = buffer.split('\r\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (!line) continue;
                    try {
                        const response = JSON.parse(line);
                        if (response && response.error) {
                            const codes = { 100: 'NOT_FOUND', 200: 'SYNTAX_ERROR' };
                            settle(reject, new Error(codes[response.error] || 'ERROR'));
                        } else {
                            settle(resolve, response);
                        }
                    } catch (e) {
                        // incomplete / malformed line — wait for more data
                    }
                }
            });

            socket.on('error', err => settle(reject, err));
        });
    }

    _connectEventSocket() {
        this._reconnecting = false;
        const socket = new net.Socket();
        this._eventSocket = socket;
        let buffer = '';

        // L1: guard against stalled connections that never close
        socket.setTimeout(CONNECT_TIMEOUT, () => socket.destroy());

        socket.connect(this._options.port || 8000, this._options.ip, () => {
            socket.setTimeout(0);  // disable stall guard once connected
            socket.write(JSON.stringify({ cmd: 'startevents' }) + '\r\n');
        });

        socket.on('data', chunk => {
            buffer += chunk.toString();
            // M2: drop oversized payloads on the event socket too
            if (buffer.length > MAX_BUFFER_BYTES) {
                socket.destroy();
                return;
            }
            const lines = buffer.split('\r\n');
            buffer = lines.pop();
            lines.forEach(line => {
                if (!line) return;
                console.log('[NHC DEBUG] event socket raw line:', line);
                try {
                    const parsed = JSON.parse(line);
                    // Controller sends either a plain object or an array of objects
                    const messages = Array.isArray(parsed) ? parsed : [parsed];
                    messages.forEach(msg => {
                        console.log('[NHC DEBUG] msg.cmd:', msg && msg.cmd, '| allowed:', msg && msg.cmd && ALLOWED_EVENTS.has(msg.cmd));
                        // H2: whitelist allowed event names — prevents crash via
                        // injected 'error' or 'newListener' events
                        if (msg && msg.cmd && ALLOWED_EVENTS.has(msg.cmd)) {
                            this.events.emit(msg.cmd, msg);
                        }
                    });
                } catch (e) {
                    console.log('[NHC DEBUG] parse error:', e.message);
                }
            });
        });

        socket.on('error', () => socket.destroy());

        socket.on('close', () => {
            this._eventSocket = null;
            // L2: reset flag so init() or close-triggered reconnect can start fresh
            this._reconnecting = true;
            setTimeout(() => this._connectEventSocket(), 5000);
        });
    }
}

// L3: state is encapsulated in the class instance rather than bare module globals
module.exports = new NikoClient();
