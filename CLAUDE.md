# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode extension that manages Xdebug configurations in Laravel Herd. It toggles Xdebug on/off by commenting/uncommenting `zend_extension` lines in Herd's php.ini files, then restarting Herd services. Supports macOS and Windows with platform-specific paths and behaviors.

## Common Commands

- `npm run compile` — compile TypeScript to `out/`
- `npm run watch` — compile on file changes (used during development)
- `npm run lint` — run ESLint
- `npm run test` — compile, lint, then run tests via `@vscode/test-cli`
- `npm run vscode:prepublish` — compile for publishing

To debug: press F5 in VSCode to launch the Extension Development Host (configured in `.vscode/launch.json`).

## Architecture

All extension logic lives in a single file: **`src/extension.ts`**. There are no separate modules or services.

### Key concepts

- **Two commands** registered in `package.json`: `enableXdebug` and `disableXdebug`. Both accept an optional `mode` parameter (`'command'`, `'breakpointChange'`, or implicit `'debugSession'`).
- **Three detection modes** control when Xdebug is toggled automatically:
  - `debugSession` (default) — listens to `onDidStartDebugSession` / `onDidTerminateDebugSession`
  - `breakpointChange` — listens to `onDidChangeBreakpoints` and checks for PHP breakpoints
  - `command` — manual only via command palette
- **Herd Pro mode** (macOS only) — writes/removes `.vscode/herd.json` instead of modifying php.ini, letting Herd Pro route Xdebug-enabled requests without a global restart.

### Platform-specific logic

`getIniConfig(phpVersion)` returns the correct php.ini path and Xdebug extension line based on `process.platform`:
- **macOS**: `~/Library/Application Support/Herd/config/php/{version}/php.ini` with `.so` extension
- **Windows**: `~\.config\herd\bin\php{version}\php.ini` with `.dll` extension

### Flow

1. `enableXdebug`/`disableXdebug` → `getPHPVersion()` (runs `herd which`) → `getIniConfig()` → read/modify php.ini → `restartHerd()` (runs `herd restart php-{version}`)
2. Herd CLI interaction goes through `runHerdCommand(args, cwd)` which spawns a child process and returns stdout.

### Extension settings (contributed via `package.json`)

- `herdXdebugToggler.automaticDetection` — enable/disable auto-toggling
- `herdXdebugToggler.detectionMode` — `"breakpointChange"` or `"debugSession"`
- `herdXdebugToggler.showNotifications` — show status notifications
- `herdXdebugToggler.herdPro` — use Herd Pro Xdebug Detection (macOS only)

### Activation

The extension activates on `onLanguage:php` or `workspaceContains:**/artisan`.
