# Herd Xdebug Toggler

A Visual Studio Code extension for managing Xdebug configurations in [Laravel Herd](https://herd.laravel.com/).

## Features

- Enable or disable the Xdebug extension for the current project's PHP version using the command palette.
- Automatically detects breakpoint changes and toggle the Xdebug extension for the current project's PHP version.
- Restarts Herd services seamlessly when required to apply changes.

## Requirements

This extension is currently designed to work exclusively with **Laravel Herd** on macOS.

Its primary function is to enable or disable the **Xdebug PHP extension** in Herd's PHP configuration files. It does not automatically manage other configuration options. You will need to manually include at least the following Xdebug options in your `php.ini` files, as described in the [Herd documentation](https://herd.laravel.com/docs/1/debugging/xdebug):

```ini
xdebug.mode=debug,develop
xdebug.start_with_request=yes
xdebug.start_upon_error=yes
```

## Extension Settings

This extension provides the following configurable setting:

#### Breakpoint Detection

Enable or disable the automatic detection of breakpoint changes. When enabled, the extension monitors breakpoints in the current workspace and automatically toggles Xdebug as needed.
