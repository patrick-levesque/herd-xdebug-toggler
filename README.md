# Herd Xdebug Toggler

A Visual Studio Code extension for managing Xdebug configurations in [Laravel Herd](https://herd.laravel.com/).

## Features

- Quickly enable or disable the Xdebug extension for a PHP version using the command palette.
- Automatically detects breakpoint changes and enable or disable the Xdebug extension for all PHP versions  in the extension settings.
- Restarts Herd services when required to apply changes seamlessly.

## Requirements

This extension is specifically designed to work with **Laravel Herd** on macOS.

Its primary function is to enable or disable the **Xdebug PHP extension** in Herd's PHP configuration files. It does not automatically manage other configuration options. You will need to manually include at least the following Xdebug options in your `php.ini` files, as described in the [Herd documentation](https://herd.laravel.com/docs/1/debugging/xdebug):

```ini
xdebug.mode=debug,develop
xdebug.start_with_request=yes
xdebug.start_upon_error=yes
```

## Extension Settings

By default, PHP versions 7.4 to 8.4 are defined. However, you can customize the versions you use and that will appear in the dropdown or automatically updated on breakpoint changes.

```json
"herdXdebugToggler.phpVersions": [
    "8.3",
    "8.4"
],
```
