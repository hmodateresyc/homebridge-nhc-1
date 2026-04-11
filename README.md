# homebridge-nhc-1

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support%20this%20project-yellow?logo=buy-me-a-coffee)](https://buymeacoffee.com/hmodateresyc)

A [Homebridge](https://homebridge.io) plugin for **Niko Home Control 1** (the first-generation NHC controller). Exposes your lights, dimmers, and blinds to Apple HomeKit via the Home app or Siri.

## Requirements

- Niko Home Control 1 controller on your local network
- Homebridge v1.6.0 or v2.0.0+
- Node.js 18, 20, 22, or 24

## Installation

Install via the Homebridge UI (search for `homebridge-nhc-1`), or manually:

```
npm install -g homebridge-nhc-1
```

## Configuration

Add the platform to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "NikoHomeControl",
      "name": "NikoHomeControl",
      "ip": "192.168.1.10"
    }
  ]
}
```

### Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ip` | string | Yes | IP address of the NHC controller |
| `exclude` | integer[] | No | Action IDs to hide from HomeKit (e.g. actions used only in scenes) |
| `time` | object[] | No | Override travel time per blind (see below) |

### Blind travel time

Blinds are controlled by timing: the plugin calculates position by running the motor for a fraction of the total travel time. The default is **30 seconds**. If your blind takes a different amount of time to go from fully open to fully closed, override it per action ID:

```json
{
  "platforms": [
    {
      "platform": "NikoHomeControl",
      "name": "NikoHomeControl",
      "ip": "192.168.1.10",
      "exclude": [31],
      "time": [
        { "id": 2, "time": 20 },
        { "id": 5, "time": 45 }
      ]
    }
  ]
}
```

## Supported devices

| NHC type | HomeKit service |
|----------|----------------|
| Light (type 1) | Lightbulb (on/off) |
| Dimmer (type 2) | Lightbulb (on/off + brightness) |
| Blind (type 4) | Window Covering (position) |

## Notes

- The NHC controller communicates over TCP port 8000 on your local network. No cloud connection is required.
- Real-time events from the controller are supported: if you change a light from a physical switch, HomeKit reflects the new state automatically.
