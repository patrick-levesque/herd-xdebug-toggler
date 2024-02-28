import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

let outputChannel = vscode.window.createOutputChannel('Herd Xdebug Toggler');

export function activate(context: vscode.ExtensionContext) {
    let enableDisposable = vscode.commands.registerCommand('herd-xdebug-toggler.enableXdebug', async () => {
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
		let homeDir = os.homedir();
		let phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
		
		// The lines to check
		// let configLines = [
		// 	'xdebug.mode=debug,develop',
		// 	'xdebug.start_with_request=yes',
		// 	'xdebug.start_upon_error=yes'
		// ];

		let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersionShort + '-arm64.so';

        // Read the file
        fs.readFile(phpIniPath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage('Could not find php.ini file for PHP ' + phpVersion);
                return;
            }

			// Check if the extension is already enabled
			if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
				vscode.window.showInformationMessage('Xdebug  extension is already enabled');
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

    let disableDisposable = vscode.commands.registerCommand('herd-xdebug-toggler.disableXdebug', async () => {
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
		let homeDir = os.homedir();
		let phpIniPath = path.join(homeDir, 'Library/Application Support/Herd/config/php/', phpVersionShort, 'php.ini');
		
		// The lines to check
		// let configLines = [
		// 	'xdebug.mode=debug,develop',
		// 	'xdebug.start_with_request=yes',
		// 	'xdebug.start_upon_error=yes'
		// ];

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

    context.subscriptions.push(enableDisposable);
    context.subscriptions.push(disableDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
