# Herd Xdebug Toggler

A Visual Studio Code extension for managing Xdebug configurations in [Laravel Herd](https://herd.laravel.com/).

## Features

- Enable or disable the Xdebug extension for the current project's PHP version from the Command Palette.
- Automatically detects active debug sessions or breakpoint changes and toggles Xdebug accordingly.
- Restarts Herd services seamlessly when required to apply configuration changes.
- Customizable detection modes: choose between detecting debug sessions or breakpoint changes.
- Supports macOS and Windows.
- Integration with Herd Pro [Xdebug Detection](https://herd.laravel.com/docs/macos/debugging/xdebug-detection) (macOS only).

## Usage

- Run **“Enable Xdebug”** or **“Disable Xdebug”** from the Command Palette (`⌘⇧P` / `Ctrl+Shift+P`) to enable or disable Xdebug manually.
- When **Automatic Detection** is enabled, the extension will toggle Xdebug automatically based on your chosen detection mode.

## Requirements

This extension is currently designed to work exclusively with **Laravel Herd** on macOS and Windows.

Its primary function is to enable or disable the **Xdebug PHP extension** in Herd's PHP configuration files. It does not modify other configuration options automatically. Make sure your `php.ini` files include the following Xdebug settings (see the Herd docs for [macOS](https://herd.laravel.com/docs/macos/debugging/xdebug) / [Windows](https://herd.laravel.com/docs/windows/debugging/xdebug)):

```ini
xdebug.mode=debug,develop
xdebug.start_with_request=yes
xdebug.start_upon_error=yes
```

## Extension Settings

#### Automatic Detection

When enabled, Xdebug will be toggled automatically during debug sessions or breakpoint changes.

#### Detection Mode

Specifies how automatic detection operates (only applies when **Automatic Detection** is enabled):

- **Debug Session** (default): Enables Xdebug when a debug session starts and disables it when the session ends. This mode is more reliable and ensures Xdebug is active only when needed.

- **Breakpoint Detection**: Monitors breakpoints in the current workspace and enables Xdebug when a breakpoint is added. Xdebug is disabled when all breakpoints are removed. At least one breakpoint must be toggled to activate Xdebug after opening a project.

#### Show Notifications

When enabled, notifications appear when Xdebug is enabled or disabled. If disabled, logs remain available in the **Output → Herd Xdebug Toggler** channel.

#### Herd Pro Xdebug Detection (**macOS only**)

When enabled, integrates with Herd Pro [Xdebug Detection](https://herd.laravel.com/docs/macos/debugging/xdebug-detection) to automatically route requests to a PHP process with Xdebug, without requiring Xdebug to be globally enabled and Herd services to restart. Works even for embedded web applications where Xdebug browser extensions cannot be used. Requires [Herd Pro](https://herd.laravel.com/).
