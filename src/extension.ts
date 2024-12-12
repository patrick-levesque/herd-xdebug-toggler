import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cp from 'child_process';

const homeDir = os.homedir();
const outputChannel = vscode.window.createOutputChannel('Herd Xdebug Toggler');

const isXdebugEnabled = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        cp.exec('herd php -m', (err, stdout) => {
            if (err) {
                reject(`Error checking PHP modules: ${err.message}`);
                return;
            }
            resolve(stdout.includes('xdebug'));
        });
    });
};

const getPHPVersion = (): Promise<string[]> => {
	return new Promise((resolve, reject) => {
		cp.exec('herd php -v', (err, stdout) => {
			if (err) {
				reject(`Error getting PHP version: ${err.message}`);
				return;
			}
			const version = stdout.match(/PHP ([\d.]+)/);
			if (version) {
				resolve([version[1]]);
			} else {
				reject('Error getting PHP version');
			}
		});
	});
};

const restartHerd = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		cp.exec('herd restart', (err, stdout) => {
			const timestamp = new Date().toISOString();
			outputChannel.appendLine('Herd Xdebug Toggler -- Restarting Herd @ ' + timestamp);
			if (err) {
				reject(`Error restarting Herd: ${err.message}`);
				return;
			}
			outputChannel.appendLine(stdout);
			resolve();
		});
	});
};

const enableXdebug = async (showNotification: boolean = false) => {
	const updatePhpIni = (phpVersion: string, phpIniPath: string, extensionLine: string) => {
		return new Promise<void>((resolve, reject) => {
			fs.readFile(phpIniPath, 'utf8', (err, data) => {
				if (err) {
					vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
					outputChannel.appendLine('Could not find php.ini file for PHP ' + phpVersion);
					return reject(err);
				}

				if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
					if (showNotification) {
						vscode.window.showInformationMessage('Xdebug extension is already enabled for PHP ' + phpVersion);
					}
                    return reject('Xdebug extension is already enabled for PHP ' + phpVersion);
                }

				if (!data.includes(extensionLine)) {
					data = extensionLine + '\n' + data;
				} else {
					data = data.replace(';' + extensionLine, extensionLine);
				}

				fs.writeFile(phpIniPath, data, 'utf8', err => {
					if (err) {
						vscode.window.showErrorMessage('Could not modify php.ini file');
						outputChannel.appendLine('Could not modify php.ini file');
						return reject(err);
					}
					outputChannel.appendLine('Xdebug extension enabled for PHP ' + phpVersion);
					resolve();
				});
			});
		});
	};

	getPHPVersion()
		.then(version => {
			const phpVersionShort = version[0].split('.').slice(0, 2).join('');
			const phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
			const extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
			return updatePhpIni(version[0], phpIniPath, extensionLine);
		})
		.then(() => {
			restartHerd()
				.then(() => vscode.window.showInformationMessage('Xdebug extension enabled'))
				.catch(err => outputChannel.appendLine(err));
		})
		.catch(err => outputChannel.appendLine(err));
};

const disableXdebug = async (showNotification: boolean = false) => {
	const updatePhpIni = (phpVersion: string, phpIniPath: string, extensionLine: string) => {
		return new Promise<void>((resolve, reject) => {
			fs.readFile(phpIniPath, 'utf8', (err, data) => {
				if (err) {
					vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
					outputChannel.appendLine('Could not find php.ini file for PHP ' + phpVersion);
					return reject(err);
				}

				if (data.includes(';' + extensionLine)) {
					if (showNotification) {
						vscode.window.showInformationMessage('Xdebug extension is already disabled for PHP ' + phpVersion);
					}
                    return reject('Xdebug extension is already disabled for PHP ' + phpVersion);
                }

				const modifiedData = data.replace(extensionLine, ';' + extensionLine);

				fs.writeFile(phpIniPath, modifiedData, 'utf8', err => {
					if (err) {
						vscode.window.showErrorMessage('Could not modify php.ini file');
						outputChannel.appendLine('Could not modify php.ini file');
						return reject(err);
					}
					outputChannel.appendLine('Xdebug extension disabled for PHP ' + phpVersion);
					resolve();
				});
			});
		});
	};

	getPHPVersion()
		.then(version => {
			const phpVersionShort = version[0].split('.').slice(0, 2).join('');
			const phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
			const extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
			return updatePhpIni(version[0], phpIniPath, extensionLine);
		})
		.then(() => {
			restartHerd()
				.then(() => vscode.window.showInformationMessage('Xdebug extension disabled'))
				.catch(err => outputChannel.appendLine(err));
		})
		.catch(err => outputChannel.appendLine(err));
};

const checkPhpBreakpoints = () => {
	const config = vscode.workspace.getConfiguration('herdXdebugToggler');
	
	const breakpointDetection = config.get('breakpointDetection');
	if (!breakpointDetection) {
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
		isXdebugEnabled()
			.then(enabled => {
				if (enabled) {
					outputChannel.appendLine('Xdebug is already enabled for the current project');
				} else {
					enableXdebug();
				}
			})
			.catch(err => outputChannel.appendLine(err));
	} else {
		outputChannel.appendLine('No breakpoints detected in PHP files.');
		isXdebugEnabled()
			.then(enabled => {
				if (enabled) {
					disableXdebug();
				} else {
					outputChannel.appendLine('Xdebug is already disabled for the current project');
				}
			})
			.catch(err => outputChannel.appendLine(err));
	}
};

function activate(context: vscode.ExtensionContext) {
	const enableXdebugCommand = vscode.commands.registerCommand('herd-xdebug-toggler.enableXdebug', () => {
		enableXdebug(true);
	});

    const disableXdebugCommand = vscode.commands.registerCommand('herd-xdebug-toggler.disableXdebug', () => {
		disableXdebug(true);
	});
	
	const breakpointListener = vscode.debug.onDidChangeBreakpoints(() => {
		checkPhpBreakpoints();
    });
	
	context.subscriptions.push(enableXdebugCommand);
	context.subscriptions.push(disableXdebugCommand);
	context.subscriptions.push(breakpointListener);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
