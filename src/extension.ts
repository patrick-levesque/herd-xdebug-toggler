// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('Congratulations, your extension "toggle-xdebug" is now active!');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	let disposable = vscode.commands.registerCommand('toggle-xdebug.helloWorld', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('Hello PARALEL New!');
// 	});

// 	context.subscriptions.push(disposable);”
// }

export function activate(context: vscode.ExtensionContext) {
    let enableDisposable = vscode.commands.registerCommand('toggle-xdebug.enableXdebug', async () => {
        let phpVersion = await vscode.window.showQuickPick(['8.2', '8.3'], { placeHolder: 'Select PHP version' });
		if (!phpVersion) {
			vscode.window.showErrorMessage('PHP version is required');
			return;
		}

		// Remove the dot from the version
		phpVersion = phpVersion.replace('.', '');
		
		// Determine the path to the php.ini file
		let phpIniPath = '/Users/plevesque/Library/Application Support/Herd/config/php/' + phpVersion + '/php.ini';
		
		// The lines to check
		let configLines = [
			'xdebug.mode=debug,develop',
			'xdebug.start_with_request=yes',
			'xdebug.start_upon_error=yes'
		];

		let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-' + phpVersion + '-arm64.so';

        // Read the file
        fs.readFile(phpIniPath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage('Could not find php.ini file');
                return;
            }

			// Check if the extension is already enabled
			if (!data.includes(';' + extensionLine) && data.includes(extensionLine)) {
			// if (!data.includes(';zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-82-arm64.so') && data.includes('zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-82-arm64.so')) {
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

				// // Create a new terminal
				// let terminal = vscode.window.createTerminal();

				// // Execute the "herd restart" command
				// terminal.sendText('herd restart');
			
				// // Show the terminal
				// terminal.show();
            });
        });
    });

    let disableDisposable = vscode.commands.registerCommand('toggle-xdebug.disableXdebug', () => {
        // The code you place here will be executed every time your command is executed

        // Determine the path to the php.ini file
		// let phpIniPath = path.join(vscode.workspace., 'php.ini');
		let phpIniPath = '/Users/plevesque/Library/Application Support/Herd/config/php/82/php.ini';

		let extensionLine = 'zend_extension=/Applications/Herd.app/Contents/Resources/xdebug/xdebug-82-arm64.so';

        // Read the file
        fs.readFile(phpIniPath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage('Could not find php.ini file');
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

				// // Create a new terminal
				// let terminal = vscode.window.createTerminal();

				// // Execute the "herd restart" command
				// terminal.sendText('herd restart');
			
				// // Show the terminal
				// terminal.show();
            });
        });
    });

    context.subscriptions.push(enableDisposable);
    context.subscriptions.push(disableDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
