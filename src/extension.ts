/* eslint-disable */

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const provider = new SpectraCodeProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SpectraCodeProvider.viewType, provider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('spectraCode.clearColor', () => {
			vscode.window.showInformationMessage("Cleared workbench's custom colors");

			const configuration = vscode.workspace.getConfiguration('workbench');
			//get settings for workbench where colorCustomizations is present

			configuration.update('colorCustomizations', {
				"activityBar.background": null, "notifications.background": null,
				"activityBar.inactiveForeground": null, "activityBar.foreground": null, "notifications.foreground": null
			});
		}));
}

class SpectraCodeProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'spectraCode.colorsView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

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
			vscode.window.showInformationMessage(message.text);

			const configuration = vscode.workspace.getConfiguration('workbench');
			//get settings for workbench where colorCustomizations is present

			configuration.update('colorCustomizations', {
				"activityBar.background": message.colorBackground, "notifications.background": message.colorBackground,
				"activityBar.inactiveForeground": message.colorForeground + 'AA', "activityBar.foreground": message.colorForeground, "notifications.foreground": message.colorForeground
			});

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
