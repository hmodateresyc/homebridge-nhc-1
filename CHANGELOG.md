# Changelog

## [1.6.5] - 2026-04-11
### Added
- `funding` field in `package.json` for Homebridge UI donate button

## [1.6.4] - 2026-04-11
### Added
- Buy Me a Coffee badge in README
- `FUNDING.yml` for GitHub Sponsor button on repository page

## [1.6.3] - 2026-04-11
### Changed
- README rewritten with full configuration docs, options table, supported devices table, and blind travel time explanation

## [1.6.2] - 2026-04-11
### Changed
- Added Node.js 24 to supported engine range (`^18.20.4 || ^20.15.1 || ^22.0.0 || ^24.0.0`)

## [1.6.1] - 2026-04-11
### Security
- H2: Whitelist allowed event names before emitting — prevents process crash via injected `error` event from malicious TCP payload
- M1: Validate `id` and `value` in `executeActions` before sending to controller
- M2: Cap TCP buffer at 64 KB in both request socket and event socket
- M3: Remove `config.json` from git tracking, add to `.gitignore`
- M4: Log `err.message` instead of full error object in all `.catch()` handlers
- L1: Add 10-second connect timeout on event socket to handle stalled connections
- L2: Reset reconnect state on socket close so re-init starts cleanly
- L3: Encapsulate module-level globals in `NikoClient` class
- L4: Fix `http://` → `https://` in `package.json` bugs URL

## [1.6.0] - 2026-04-11
### Changed
- Controller state (`id`, `value`, `position`, etc.) moved from accessory object to controller object (SRP)
- `ACTION_HANDLERS` map replaces switch/case — adding a new device type only requires one new entry (OCP)
- `updateAccessory()` signature cleaned up, removed unused `action` parameter
- `changeValue` and `changeTarget` merged into a single method in Blind
- `PLUGIN_NAME` and `PLATFORM_NAME` defined as named constants

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
