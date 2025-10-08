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
const mkdir = promisify(fs.mkdir);

const getWorkspaceRoot = () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Please open a PHP project to enable Xdebug Detection.');
        throw new Error('No workspace is open.');
    }

    return workspaceFolders[0].uri.fsPath;
};

const getPHPVersion = async () => {
    try {
        const workspaceRoot = getWorkspaceRoot();
        const { stdout } = await exec('herd php -v', { cwd: workspaceRoot });
        const version = stdout.match(/PHP ([\d.]+)/);
        if (version && version[1]) {
            return version[1];
        } else {
            throw new Error('Error getting PHP version');
        }
    } catch (err) {
        throw new Error(`Error getting PHP version: ${(err as Error).message}`);
    }
};

const restartHerd = async (phpVersion: string) => {
    const workspaceRoot = getWorkspaceRoot();
    const phpVersionShortDot = phpVersion.split('.').slice(0, 2).join('.');

    try {
        const { stdout: useStdout } = await exec(`herd use ${phpVersionShortDot}`, { cwd: workspaceRoot });
        outputChannel.appendLine(useStdout);

        const { stdout } = await exec('herd restart', { cwd: workspaceRoot });
        outputChannel.appendLine(`Restarting Herd @ ${new Date().toISOString()}`);
        outputChannel.appendLine(stdout);
    } catch (err) {
        throw new Error(`Error restarting Herd: ${(err as Error).message}`);
    }
};

const getIniConfig = async (phpVersion: string) => {
    const phpVersionShort = phpVersion.split('.').slice(0, 2).join('');
    const phpVersionShortDot = phpVersion.split('.').slice(0, 2).join('.');
    let phpIniPath: string;
    let extensionLine: string;
    
    if (os.platform() === 'win32') {
        phpIniPath = path.join(homeDir, '.config', 'herd', 'bin', 'php' + phpVersionShort, 'php.ini');
        extensionLine = 'zend_extension=C:\\Program Files\\Herd\\resources\\app.asar.unpacked\\resources\\bin\\xdebug\\xdebug-' + phpVersionShortDot + '.dll';
    } else {
        phpIniPath = path.join(homeDir, 'Library', 'Application Support', 'Herd', 'config', 'php', phpVersionShort, 'php.ini');
        extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
    }

    return [phpIniPath, extensionLine];
};

const getOrCreateHerdConfigPath = async () => {
    const projectRoot = getWorkspaceRoot();
    const configDir = path.join(projectRoot, '.vscode');
    const configPath = path.join(configDir, 'herd.json');

    try {
        // Ensure the .vscode directory exists
        await mkdir(configDir, { recursive: true });

        // Ensure the herd.json file exists
        try {
            const fileContent = await readFile(configPath, 'utf8');
            if (!fileContent.trim()) {
                const defaultContent = JSON.stringify({ debug: false }, null, 4);
                await writeFile(configPath, defaultContent, 'utf8');
                outputChannel.appendLine('herd.json file was empty and has been reset to default settings.');
            }
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                const defaultContent = JSON.stringify({ debug: false }, null, 4);
                await writeFile(configPath, defaultContent, 'utf8');
                outputChannel.appendLine('herd.json file was created with default settings.');
            } else {
                throw err;
            }
        }

        return configPath;
    } catch (err) {
        throw new Error(`Failed to create or read herd.json: ${(err as Error).message}`);
    }
};

const enableXdebug = async (mode: string = 'command') => {
    const config = vscode.workspace.getConfiguration('herdXdebugToggler');

    if (mode !== 'command' && !(config.get('automaticDetection') && config.get('detectionMode') === mode)) {
        return;
    }

    const showNotifications = config.get('showNotifications');

    const enablePro = async () => {
        try {
            const configPath = await getOrCreateHerdConfigPath();
            const configContent = await readFile(configPath, 'utf8');
            const config = JSON.parse(configContent);

            if (config.debug) {
                if (mode !== 'breakpointChange') {
                    if (showNotifications) {
                        vscode.window.showInformationMessage('Xdebug Detection for Herd Pro is already enabled');
                    }
                    outputChannel.appendLine('Xdebug Detection for Herd Pro is already enabled');
                }
                return;
            }

            config.debug = true;
            await writeFile(configPath, JSON.stringify(config, null, 4), 'utf8');

            if (showNotifications) {
                vscode.window.showInformationMessage('Xdebug Detection for Herd Pro enabled');
            }
            outputChannel.appendLine('Xdebug Detection for Herd Pro enabled');
        } catch (err) {
            vscode.window.showErrorMessage('Failed to enable Xdebug Detection for Herd Pro');
            outputChannel.appendLine(`Failed to update herd.json: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const updatePhpIni = async (phpVersion: string, phpIniPath: string, extensionLine: string) => {
        try {
            let data = await readFile(phpIniPath, 'utf8');
            if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
                if (showNotifications && mode !== 'breakpointChange') {
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
        if (config.get('herdPro') && os.platform() === 'darwin') {
            await enablePro();
        } else {
            const version = await getPHPVersion();
            const iniConfig = await getIniConfig(version);
            const phpIniPath = iniConfig[0];
            const extensionLine = iniConfig[1];
    
            await updatePhpIni(version, phpIniPath, extensionLine);
            await restartHerd(version);
            
            if (showNotifications) {
                vscode.window.showInformationMessage('Xdebug extension enabled');
            }
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

    const disablePro = async () => {
        try {
            const configPath = await getOrCreateHerdConfigPath();
            const configContent = await readFile(configPath, 'utf8');
            const config = JSON.parse(configContent);

            if (!config.debug) {
                if (mode !== 'breakpointChange') {
                    if (showNotifications) {
                        vscode.window.showInformationMessage('Xdebug Detection for Herd Pro is already disabled');
                    }
                    outputChannel.appendLine('Xdebug Detection for Herd Pro is already disabled');
                }
                return;
            }

            config.debug = false;
            await writeFile(configPath, JSON.stringify(config, null, 4), 'utf8');

            if (showNotifications) {
                vscode.window.showInformationMessage('Xdebug Detection for Herd Pro disabled');
            }
            outputChannel.appendLine('Xdebug Detection for Herd Pro disabled');
        } catch (err) {
            vscode.window.showErrorMessage('Failed to disable Xdebug Detection for Herd Pro');
            outputChannel.appendLine(`Failed to update herd.json: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const updatePhpIni = async (phpVersion: string, phpIniPath: string, extensionLine: string) => {
        try {
            let data = await readFile(phpIniPath, 'utf8');
            if (data.includes(';' + extensionLine)) {
                if (showNotifications && mode !== 'breakpointChange') {
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
        if (config.get('herdPro') && os.platform() === 'darwin') {
            await disablePro();
        } else {
            const version = await getPHPVersion();
            const iniConfig = await getIniConfig(version);
            const phpIniPath = iniConfig[0];
            const extensionLine = iniConfig[1];
    
            await updatePhpIni(version, phpIniPath, extensionLine);
            await restartHerd(version);

            if (showNotifications) {
                vscode.window.showInformationMessage('Xdebug extension disabled');
            }
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
        outputChannel.appendLine('Breakpoints detected in PHP files');
        await enableXdebug('breakpointChange');
    } else {
        outputChannel.appendLine('No breakpoints detected in PHP files');
        await disableXdebug('breakpointChange');
    }
};

function activate(context: vscode.ExtensionContext) {
    const platform = os.platform();

    if (platform !== 'win32' && platform !== 'darwin') {
        vscode.window.showErrorMessage('Herd Xdebug Toggler is not supported on your platform.');
        outputChannel.appendLine(`Herd Xdebug Toggler extension is not supported on ${platform} platform`);
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

    outputChannel.appendLine(`Herd Xdebug Toggler extension activated @ ${new Date().toISOString()}`);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
