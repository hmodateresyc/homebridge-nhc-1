# Changelog

## [1.5.2] - 2026-04-11
### Fixed
- Connection to Niko controller no longer times out. The controller keeps TCP connections open after responding; we now parse the response as it arrives instead of waiting for the connection to close.

## [1.5.1] - 2026-04-11
### Changed
- `var` → `const`/`let` throughout all files
- Log messages use template literals instead of string concatenation
- Services looked up by type (`Lightbulb`, `WindowCovering`) instead of display name, making lookups more robust
- `controllers` changed from array to plain object
- Action types replaced with named constants (`ACTION_TYPE_LIGHT`, `ACTION_TYPE_DIMMER`, `ACTION_TYPE_BLIND`)
- `POSITION_STATE_STOPPED` constant replaces magic number `2` in blind handling
- `indexOf` → `includes` for exclude list check
- `Object.prototype.hasOwnProperty.call` for safe property check on controllers
- `ActionTime` loop variable renamed to `actionTime`
- `Math.abs(...) > 0` → `!==` in blind movement logic
- No-op guard added in `setTarget` when blind is already at target position

### Fixed
- Duplicate event listeners added on each connection retry — `removeAllListeners` now called before re-registering
- UUID generated twice in accessory creation — now computed once and passed through
- `getService` called multiple times per `updateAccessory` — now retrieved once and reused
- Accessory display name no longer includes the action ID (was "Living Room42", now "Living Room")

## [1.5.0] - 2026-04-11
### Added
- `NikoHomeControlAccessory` base class extracts shared UUID lookup and `createAccessory` logic, eliminating ~60 lines of duplication across device files

### Fixed
- TCP event stream now correctly splits on `\r\n` — previously tried to parse each raw chunk as complete JSON
- Event socket silently ignored errors; now destroys the socket on error and reconnects after 5 seconds
- `executeActions()` calls now have `.catch()` handlers — failed commands are logged instead of silently ignored
- `eventSocketStarted` flag prevents duplicate event socket connections on connection retry
- `== undefined` → `!service` in all `updateAccessory` methods

## [1.4.0] - 2026-04-11
### Changed
- Inlined the `niko-home-control` dependency — the plugin now has zero external runtime dependencies
- Replaced `bluebird` promises with native Node.js promises

### Fixed
- Injection vulnerability in `executeActions()`: values are now serialized via `JSON.stringify` instead of string concatenation
- Event socket reconnects automatically after disconnect

## [1.3.3] - 2026-04-11
### Added
- `config.schema.json` for Homebridge plugin settings UI — IP address, excluded actions, and blind travel times can now be configured through the Homebridge UI

## [1.3.2] - 2026-04-11
### Added
- `author` field in `package.json` for npm discoverability

## [1.3.1] - 2026-04-10
### Changed
- Maintainer email updated to GitHub no-reply address for privacy

## [1.3.0] - 2026-04-10
### Added
- Homebridge v2 compatibility: migrated characteristic handlers to `onGet`/`onSet` API
- Connection retry after 30 seconds when Niko controller is unreachable at startup
- Early error log when no IP address is configured

### Fixed
- Removed deprecated `reachable` property
- Strict equality (`==` → `===`) across all accessory types

### Changed
- Node.js engine requirement updated to `^18.20.4 || ^20.15.1 || ^22`
- Renamed from `homebridge-nhc` fork, published as `homebridge-nhc-1`
