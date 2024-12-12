import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let homeDir = os.homedir();
let outputChannel = vscode.window.createOutputChannel('Herd Xdebug Toggler');

function activate(context: vscode.ExtensionContext) {
    let enableXdebugCommand = vscode.commands.registerCommand('herd-xdebug-toggler.enableXdebug', async () => {
		// Get the PHP versions from the configuration file
		let config = vscode.workspace.getConfiguration('herdXdebugToggler');
		let phpVersions = config.get('phpVersions');

		// Check if phpVersions is an array
		if (!Array.isArray(phpVersions)) {
			throw new Error('PHP versions are missing or invalid in the configuration file. Please check the README file for more information.');
		}

		let phpVersion = await vscode.window.showQuickPick(phpVersions, { placeHolder: 'Select PHP version' });
		
		if (!phpVersion) {
			vscode.window.showErrorMessage('PHP version is required');
			return;
		}

		// Remove the dot from the version
		let phpVersionShort = phpVersion.replace('.', '');
		
		// Determine the path to the php.ini file
		let phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');

		let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';

        // Read the file
        fs.readFile(phpIniPath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
                return;
            }

			// Check if the extension is already enabled
			if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
				vscode.window.showInformationMessage('Xdebug extension is already enabled');
				return;
			}
	
			// Check if the extension is not present in the file
			if (!data.includes(extensionLine)) {
				data = extensionLine + '\n' + data;
			} else {
				// Modify the file to enable the extension
				data = data.replace(';' + extensionLine, extensionLine);
			}

            // Write the modified data back to the file
            fs.writeFile(phpIniPath, data, 'utf8', err => {
                if (err) {
                    vscode.window.showErrorMessage('Could not modify php.ini file');
                    return;
                }

                vscode.window.showInformationMessage('Successfully enabled Xdebug extension');

				const { exec } = require('child_process');
				
				exec('herd restart', (error: any, stdout: any, stderr: any) => {
					let timestamp = new Date().toISOString();

					outputChannel.appendLine('Herd Xdebug Toggler -- Restarting Herd @ ' + timestamp);

					if (error) {
						outputChannel.appendLine(`Execution error: ${error}`);
						return;
					} else {
						outputChannel.appendLine(stdout);
					}
				});
            });
        });
    });

    let disableXdebugCommand = vscode.commands.registerCommand('herd-xdebug-toggler.disableXdebug', async () => {
		// Get the PHP versions from the configuration file
		let config = vscode.workspace.getConfiguration('herdXdebugToggler');
		let phpVersions = config.get('phpVersions');

		// Check if phpVersions is an array
		if (!Array.isArray(phpVersions)) {
			throw new Error('PHP versions are missing or invalid in the configuration file. Please check the README file for more information.');
		}

		let phpVersion = await vscode.window.showQuickPick(phpVersions, { placeHolder: 'Select PHP version' });
		
		if (!phpVersion) {
			vscode.window.showErrorMessage('PHP version is required');
			return;
		}

		// Remove the dot from the version
		let phpVersionShort = phpVersion.replace('.', '');
		
		// Determine the path to the php.ini file
		let phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');

		let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';

        // Read the file
        fs.readFile(phpIniPath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
                return;
            }

			// Check if the extension is already disabled
			if (data.includes(';' + extensionLine)) {
				vscode.window.showInformationMessage('Xdebug extension is already disabled');
				return;
			}

            // Modify the file to enable or disable the extension
            let modifiedData = data.replace(extensionLine, ';' + extensionLine);

            // Write the modified data back to the file
            fs.writeFile(phpIniPath, modifiedData, 'utf8', err => {
                if (err) {
                    vscode.window.showErrorMessage('Could not modify php.ini file');
                    return;
                }

                vscode.window.showInformationMessage('Successfully disabled Xdebug extension');

				const { exec } = require('child_process');

				exec('herd restart', (error: any, stdout: any, stderr: any) => {
					let timestamp = new Date().toISOString();

					outputChannel.appendLine('Herd Xdebug Toggler -- Restarting Herd @ ' + timestamp);

					if (error) {
						outputChannel.appendLine(`Execution error: ${error}`);
						return;
					} else {
						outputChannel.appendLine(stdout);
					}
				});
            });
        });
    });

	let hasBreakpoints = false; // Tracks if any breakpoints are currently set

	// Function to check PHP breakpoints
    const checkPhpBreakpoints = () => {
		let config = vscode.workspace.getConfiguration('herdXdebugToggler');

		// Check if breakpoint detection is enabled
		let breakpointDetection = config.get('breakpointDetection');
		if (!breakpointDetection) {
			return;
		}
		
		// Get the PHP versions from the configuration file
		let phpVersions = config.get('phpVersions');

		// Check if phpVersions is an array
		if (!Array.isArray(phpVersions)) {
			throw new Error('PHP versions are missing or invalid in the configuration file. Please check the README file for more information.');
		}
	
		// Function to enable Xdebug
		const enableXdebug = async () => {
			let phpUpdated = false;
		
			const updatePhpIni = (phpVersion: string, phpVersionShort: string, phpIniPath: string, extensionLine: string) => {
				return new Promise<void>((resolve, reject) => {
					fs.readFile(phpIniPath, 'utf8', (err, data) => {
						if (err) {
							vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
							outputChannel.appendLine('Could not find php.ini file for PHP ' + phpVersion);
							return reject(err);
						}
		
						if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
							outputChannel.appendLine('Xdebug extension is already enabled for PHP ' + phpVersion);
							return resolve();
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
							phpUpdated = true;
							resolve();
						});
					});
				});
			};
		
			const promises = phpVersions.map(phpVersion => {
				let phpVersionShort = phpVersion.replace('.', '');
				let phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
				let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
				return updatePhpIni(phpVersion, phpVersionShort, phpIniPath, extensionLine);
			});
		
			await Promise.all(promises);
		
			if (!phpUpdated) {
				return;
			}
		
			const { exec } = require('child_process');
			exec('herd restart', (error: any, stdout: any, stderr: any) => {
				let timestamp = new Date().toISOString();
				outputChannel.appendLine('Herd Xdebug Toggler -- Restarting Herd @ ' + timestamp);
		
				if (error) {
					outputChannel.appendLine(`Execution error: ${error}`);
					return;
				} else {
					outputChannel.appendLine(stdout);
				}
			});
		
			vscode.window.showInformationMessage('Xdebug extension enabled');
		};

		// Function to disable Xdebug
		const disableXdebug = async () => {
			let phpUpdated = false;
		
			const updatePhpIni = (phpVersion: string, phpVersionShort: string, phpIniPath: string, extensionLine: string) => {
				return new Promise<void>((resolve, reject) => {
					fs.readFile(phpIniPath, 'utf8', (err, data) => {
						if (err) {
							vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
							outputChannel.appendLine('Could not find php.ini file for PHP ' + phpVersion);
							return reject(err);
						}
		
						if (data.includes(';' + extensionLine)) {
							outputChannel.appendLine('Xdebug extension is already disabled for PHP ' + phpVersion);
							return resolve();
						}
		
						let modifiedData = data.replace(extensionLine, ';' + extensionLine);
		
						fs.writeFile(phpIniPath, modifiedData, 'utf8', err => {
							if (err) {
								vscode.window.showErrorMessage('Could not modify php.ini file');
								outputChannel.appendLine('Could not modify php.ini file');
								return reject(err);
							}
							outputChannel.appendLine('Xdebug extension disabled for PHP ' + phpVersion);
							phpUpdated = true;
							resolve();
						});
					});
				});
			};
		
			const promises = phpVersions.map(phpVersion => {
				let phpVersionShort = phpVersion.replace('.', '');
				let phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
				let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';
				return updatePhpIni(phpVersion, phpVersionShort, phpIniPath, extensionLine);
			});
		
			await Promise.all(promises);
		
			if (!phpUpdated) {
				return;
			}
		
			const { exec } = require('child_process');
			exec('herd restart', (error: any, stdout: any, stderr: any) => {
				let timestamp = new Date().toISOString();
				outputChannel.appendLine('Herd Xdebug Toggler -- Restarting Herd @ ' + timestamp);
		
				if (error) {
					outputChannel.appendLine(`Execution error: ${error}`);
					return;
				} else {
					outputChannel.appendLine(stdout);
				}
			});
		
			vscode.window.showInformationMessage('Xdebug extension disabled');
		};

        const breakpoints = vscode.debug.breakpoints;

        const phpBreakpoints = breakpoints.filter(bp => {
            if (bp instanceof vscode.SourceBreakpoint && bp.location?.uri) {
                return bp.location.uri.fsPath.endsWith('.php');
            }
            return false;
        });

        if (phpBreakpoints.length > 0) {
			if (!hasBreakpoints) {
				hasBreakpoints = true;
				outputChannel.appendLine('Breakpoints set in PHP files.');
				enableXdebug();
			}
		} else {
			hasBreakpoints = false;
			outputChannel.appendLine('No breakpoints set in PHP files.');
			disableXdebug();
		}
    };

	context.subscriptions.push(enableXdebugCommand);
	context.subscriptions.push(disableXdebugCommand);

	// Register a listener for breakpoint changes
    const breakpointListener = vscode.debug.onDidChangeBreakpoints(() => {
        checkPhpBreakpoints();
    });
	context.subscriptions.push(breakpointListener);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};
