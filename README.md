# Herd Xdebug Toggler

A Visual Studio Code extension for managing Xdebug configurations in [Laravel Herd](https://herd.laravel.com/).

## Features

- Enable or disable the Xdebug extension for the current project's PHP version using the command palette.
- Automatically detects breakpoint changes or debug sessions and toggles the Xdebug extension for the current project's PHP version.
- Restarts Herd services seamlessly when required to apply changes.
- Customizable detection modes: Choose between detecting breakpoint changes or debug sessions to toggle Xdebug.

## Requirements

This extension is currently designed to work exclusively with **Laravel Herd** on macOS.

Its primary function is to enable or disable the **Xdebug PHP extension** in Herd's PHP configuration files. It does not automatically manage other configuration options. You will need to manually include at least the following Xdebug options in your `php.ini` files, as described in the [Herd documentation](https://herd.laravel.com/docs/1/debugging/xdebug):

```ini
xdebug.mode=debug,develop
xdebug.start_with_request=yes
xdebug.start_upon_error=yes
```

## Extension Settings

This extension provides the following configurable settings:

#### Automatic Detection

When enabled, Xdebug will be automatically toggled on breakpoint changes or debug sessions.

#### Detection Mode

Allows you to select the detection mode for toggling Xdebug. This setting only applies when **Automatic Detection** is enabled.

- **Debug Session** (default): Enables Xdebug when a debug session is started and disables Xdebug when the debug session is stopped. This mode is more reliable as it automatically manages Xdebug activation, ensuring it is only enabled when needed.

- **Breakpoint Detection**: Monitors breakpoints in the current workspace and automatically enables Xdebug when a breakpoint is added. It will disable Xdebug when all breakpoints are removed. In this mode, at least one breakpoint must be added or removed to toggle Xdebug when a project is opened.

#### Show Notifications

When enabled, the extension will show notifications when Xdebug is toggled (enabled/disabled). When disabled, extension logs can still be found in the Output Panel under **Herd Xdebug Toggler**.
