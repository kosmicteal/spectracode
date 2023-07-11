/* eslint-disable */

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const provider = new SpectraCodeProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SpectraCodeProvider.viewType, provider, { webviewOptions: { retainContextWhenHidden: true } })
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('spectraCode.clearColor', () => {
			// vscode.window.showInformationMessage("Cleared workbench's custom colors");
			updateColorScheme(null, null);
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('spectraCode.sendTestNotification', () => {
			vscode.window.showInformationMessage("This is a notification to test out Spectracode. You can clear this one!");
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('spectraCode.hexColor', async () => {
			let valid = false;
			let manualHexCodeInput = await vscode.window.showInputBox({
				placeHolder: 'Insert your custom HEX colour',
				validateInput: text => {
					if (validateHEX(text)) {
						return null
					} else {
						return 'This is not a valid color!'
					}
				}
			});
			if (manualHexCodeInput !== 'undefined' && manualHexCodeInput !== '') {
				if (manualHexCodeInput?.charAt(0) !== '#') {
					manualHexCodeInput = '#' + manualHexCodeInput;
				}
				provider.getIconColor(manualHexCodeInput!);
			}

		}));
}


class SpectraCodeProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'spectraCode.colorsView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public getIconColor(stringInput: string) {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'getIconColor', color: stringInput });
		}
	}


	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(message => {
			// vscode.window.showInformationMessage(message.text);
			updateColorScheme(message.colorBackground, message.colorForeground);
			return;
		});

	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', './js/scripts.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', './css/reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', './css/vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', './css/main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>		
				  <div id="picker"></div>
				<script nonce="${nonce}" src="${scriptsUri}"></script>
			</body>
			</html>`;
	}
}

function updateColorScheme(backgroundColor: string | null, foregroundColor: string | null) {
	//get settings for workbench where colorCustomizations is present
	const configuration = vscode.workspace.getConfiguration('workbench');

	// get opacity color when foreground is valid
	let foregroundColorOpacity = null
	if (foregroundColor !== null){
		foregroundColorOpacity = foregroundColor + 'AA'
	}

	configuration.update('colorCustomizations', {
		"activityBar.background": backgroundColor, "notifications.background": backgroundColor,
		"activityBar.inactiveForeground": foregroundColorOpacity, "activityBar.foreground": foregroundColor, "notifications.foreground": foregroundColor
	});
}

function validateHEX(text: string) {
	let valid = true;
	if ((!text.includes('#') && text.length == 6) || (text.includes('#') && text.length == 7)) {
		const notValidCharacters = 'GHIJKLMNOPQRSTUVWXYZ';
		let iterator = 0;
		while (iterator < notValidCharacters.length - 1 && valid) {
			if (text.includes(notValidCharacters.charAt(iterator))) {
				valid = false;
			}
			iterator++;
		}
	} else {
		valid = false;
	}
	console.log(valid)
	return valid;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// This method is called when your extension is deactivated
export function deactivate() { }
