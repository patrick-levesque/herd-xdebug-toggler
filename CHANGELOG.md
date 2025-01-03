### 1.2.1 - 2024-12-18
- Add support for Windows

### 1.2.0 - 2024-12-16
- Add listeners for debug sessions
- Add logic for detection mode
- Allow to disable automatic detection
- Allow to disable notifications
- Set default detection mode to debug session

### 1.1.3 - 2024-12-16
- Refactor with promisify
- Use onLanguage:php in activationEvents

### 1.1.2 - 2024-12-13
- Update README

### 1.1.1 - 2024-12-12
- Use current project PHP version instead of an array of PHP versions
- Automatically checks if Xdebug is already enabled
- Update commands to enable/disable Xdebug for the current project only
- Removed PHP versions array in Settings
- Refactor and cleanup code

### 1.1.0 - 2024-12-11
- Add automatic enable/disable on breakpoints changes
- Update and cleanup code

### 1.0.1 - 2024-02-28
- Use createOutputChannel for logging herd restart in OUTPUT
- Extension icon

### 1.0.0 - 2024-02-19
- Use config and no terminal
- Uses child_process to call “herd restart” and log output in console

### 0.0.1 - 2024-02-07
- Initial release