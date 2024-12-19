import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cp from 'child_process';
import { promisify } from 'util';

const homeDir = os.homedir();
const outputChannel = vscode.window.createOutputChannel('Herd Xdebug Toggler');

const exec = promisify(cp.exec);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const isXdebugEnabled = async () => {
    try {
        const { stdout } = await exec('herd php -m');
        return stdout.includes('xdebug');
    } catch (err) {
        throw new Error(`Error checking PHP modules: ${(err as Error).message}`);
    }
};

const getPHPVersion = async () => {
    try {
        const { stdout } = await exec('herd php -v');
        const version = stdout.match(/PHP ([\d.]+)/);
        if (version) {
            return [version[1]];
        } else {
            throw new Error('Error getting PHP version');
        }
    } catch (err) {
        throw new Error(`Error getting PHP version: ${(err as Error).message}`);
    }
};

const restartHerd = async () => {
    try {
        const { stdout } = await exec('herd restart');
        const timestamp = new Date().toISOString();
        outputChannel.appendLine('Restarting Herd @ ' + timestamp);
        outputChannel.appendLine(stdout);
    } catch (err) {
        throw new Error(`Error restarting Herd: ${(err as Error).message}`);
    }
};

const enableXdebug = async (mode: string = 'command') => {
    const config = vscode.workspace.getConfiguration('herdXdebugToggler');

    if (mode !== 'command' && !(config.get('automaticDetection') && config.get('detectionMode') === mode)) {
        return;
    }

    const showNotifications = config.get('showNotifications');

    const updatePhpIni = async (phpVersion: string, phpIniPath: string, extensionLine: string) => {
        try {
            let data = await readFile(phpIniPath, 'utf8');
            if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
                if (showNotifications) {
                    vscode.window.showInformationMessage('Xdebug extension is already enabled for PHP ' + phpVersion);
                }
                throw new Error('Xdebug extension is already enabled for PHP ' + phpVersion);
            }

            if (!data.includes(extensionLine)) {
                data = extensionLine + '\n' + data;
            } else {
                data = data.replace(';' + extensionLine, extensionLine);
            }

            await writeFile(phpIniPath, data, 'utf8');
            outputChannel.appendLine('Xdebug extension enabled for PHP ' + phpVersion);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
				vscode.window.showErrorMessage('php.ini file not found for PHP ' + phpVersion);
			}
			throw err;
        }
    };

    try {
        const version = await getPHPVersion();
        const phpVersionShort = version[0].split('.').slice(0, 2).join('');
        const phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
        const extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
        await updatePhpIni(version[0], phpIniPath, extensionLine);
        await restartHerd();
        if (showNotifications) {
            vscode.window.showInformationMessage('Xdebug extension enabled');
        }
    } catch (err) {
        outputChannel.appendLine((err as Error).message);
    }
};

const disableXdebug = async (mode: string = 'command') => {
    const config = vscode.workspace.getConfiguration('herdXdebugToggler');

    if (mode !== 'command' && !(config.get('automaticDetection') && config.get('detectionMode') === mode)) {
        return;
    }

    const showNotifications = config.get('showNotifications');

    const updatePhpIni = async (phpVersion: string, phpIniPath: string, extensionLine: string) => {
        try {
            let data = await readFile(phpIniPath, 'utf8');
            if (data.includes(';' + extensionLine)) {
                if (showNotifications) {
                    vscode.window.showInformationMessage('Xdebug extension is already disabled for PHP ' + phpVersion);
                }
                throw new Error('Xdebug extension is already disabled for PHP ' + phpVersion);
            }

            if (data.includes(extensionLine)) {
                data = data.replace(extensionLine, ';' + extensionLine);
            }

            await writeFile(phpIniPath, data, 'utf8');
            outputChannel.appendLine('Xdebug extension disabled for PHP ' + phpVersion);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
				vscode.window.showErrorMessage('php.ini file not found for PHP ' + phpVersion);
			}
			throw err;
        }
    };

    try {
        const version = await getPHPVersion();
        const phpVersionShort = version[0].split('.').slice(0, 2).join('');
        const phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
        const extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
        await updatePhpIni(version[0], phpIniPath, extensionLine);
        await restartHerd();
        if (showNotifications) {
            vscode.window.showInformationMessage('Xdebug extension disabled');
        }
    } catch (err) {
        outputChannel.appendLine((err as Error).message);
    }
};

const checkPhpBreakpoints = async () => {
    const config = vscode.workspace.getConfiguration('herdXdebugToggler');

    if (!(config.get('automaticDetection') && config.get('detectionMode') === 'breakpointChange')) {
        return;
    }

    const breakpoints = vscode.debug.breakpoints;
    const phpBreakpoints = breakpoints.filter(bp => {
        if (bp instanceof vscode.SourceBreakpoint && bp.location?.uri) {
            return bp.location.uri.fsPath.endsWith('.php');
        }
        return false;
    });

    if (phpBreakpoints.length > 0) {
        outputChannel.appendLine('Breakpoints detected in PHP files.');
        try {
            const enabled = await isXdebugEnabled();
            if (enabled) {
                outputChannel.appendLine('Xdebug is already enabled for the current project');
            } else {
                await enableXdebug('breakpointChange');
            }
        } catch (err) {
            outputChannel.appendLine((err as Error).message);
        }
    } else {
        outputChannel.appendLine('No breakpoints detected in PHP files.');
        try {
            const enabled = await isXdebugEnabled();
            if (enabled) {
                await disableXdebug('breakpointChange');
            } else {
                outputChannel.appendLine('Xdebug is already disabled for the current project');
            }
        } catch (err) {
            outputChannel.appendLine((err as Error).message);
        }
    }
};

function activate(context: vscode.ExtensionContext) {
    const platform = os.platform();

    if (platform === 'linux') {
        vscode.window.showErrorMessage('The Herd Xdebug Toggler extension is not supported on Linux.');
        return;
    }
    
	const enableXdebugCommand = vscode.commands.registerCommand('herd-xdebug-toggler.enableXdebug', () => {
		enableXdebug();
	});

    const disableXdebugCommand = vscode.commands.registerCommand('herd-xdebug-toggler.disableXdebug', () => {
		disableXdebug();
	});

    const startDebugListener = vscode.debug.onDidStartDebugSession(() => {
		enableXdebug('debugSession');
	});

	const stopDebugListener = vscode.debug.onDidTerminateDebugSession(() => {
		disableXdebug('debugSession');
	});

	const breakpointListener = vscode.debug.onDidChangeBreakpoints(() => {
		checkPhpBreakpoints();
    });
	
	context.subscriptions.push(enableXdebugCommand);
	context.subscriptions.push(disableXdebugCommand);
    context.subscriptions.push(startDebugListener);
    context.subscriptions.push(stopDebugListener);
	context.subscriptions.push(breakpointListener);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
