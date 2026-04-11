'use strict';

const net = require('net');
const EventEmitter = require('events');

const events = new EventEmitter();
let _options = null;

function request(obj) {
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        let buffer = '';

        const timer = setTimeout(() => {
            socket.destroy();
            reject(new Error('Timeout'));
        }, (_options && _options.timeout) || 2000);

        socket.connect((_options && _options.port) || 8000, _options.ip, () => {
            socket.write(JSON.stringify(obj) + '\r\n');
        });

        socket.on('data', chunk => {
            buffer += chunk.toString();
        });

        socket.on('end', () => {
            clearTimeout(timer);
            try {
                const response = JSON.parse(buffer);
                if (response && response.error) {
                    const codes = { 100: 'NOT_FOUND', 200: 'SYNTAX_ERROR' };
                    reject(new Error(codes[response.error] || 'ERROR'));
                } else {
                    resolve(response);
                }
            } catch (e) {
                reject(new Error('Invalid response'));
            }
        });

        socket.on('error', err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

function connectEventSocket() {
    const socket = new net.Socket();
    let buffer = '';

    socket.connect(_options.port || 8000, _options.ip, () => {
        socket.write(JSON.stringify({ cmd: 'startevents' }) + '\r\n');
    });

    socket.on('data', chunk => {
        buffer += chunk.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop(); // keep incomplete trailing data
        lines.forEach(line => {
            if (!line) return;
            try {
                const messages = JSON.parse(line);
                if (Array.isArray(messages)) {
                    messages.forEach(msg => {
                        if (msg.cmd) events.emit(msg.cmd, msg);
                    });
                }
            } catch (e) {
                // ignore malformed line
            }
        });
    });

    socket.on('error', () => {
        socket.destroy();
    });

    socket.on('close', () => {
        setTimeout(connectEventSocket, 5000);
    });
}

function init(opts) {
    _options = opts;
    if (opts.events) {
        connectEventSocket();
    }
}

function listActions() {
    return request({ cmd: 'listactions' });
}

function executeActions(id, value) {
    return request({ cmd: 'executeactions', id: id, value1: value });
}

module.exports = { init, events, listActions, executeActions };
