# Herd Xdebug Toggler

Herd Xdebug toggler extension for Visual Studio Code.

## Features

- Allows to easily enable/disable Xdebug extension for any installed PHP version.
- Restart Herd services when required.

## Requirements

You'll need to manually add any additional Xdebug options to your php.ini files as necessary. This extension is designed solely to enable or disable the Xdebug PHP extension and doesn't handle other configuration options automatically.

## Extension Settings

By default, the dropdown menu offers PHP versions 7.4, 8.0, 8.1, 8.2, and 8.3. However, you can customize which versions appear in the dropdown.

```json
"herdXdebugToggler.phpVersions": [
    "8.2",
    "8.3"
],
```
