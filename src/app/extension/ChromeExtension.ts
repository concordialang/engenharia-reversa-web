import { Message } from '../comm/Message';
import { Extension } from './Extension';
import { ExtensionBrowserAction } from './ExtensionBrowserAction';
import { Tab } from './Tab';

export class ChromeExtension implements Extension {
	public sendMessageToTab(tabId: string, message: Message): Promise<void> {
		return new Promise(function (resolve, reject) {
			const options = new Object();
			chrome.tabs.sendMessage(
				Number(tabId),
				message,
				options,
				function () {
					resolve();
				}
			);
		});
	}

	public openNewTab(url: URL): Promise<Tab> {
		return new Promise(function (resolve, reject) {
			chrome.tabs.create(
				{
					url: url.toString(),
				},
				function (tab: chrome.tabs.Tab) {
					if (tab && tab.id) {
						resolve(new Tab(tab.id.toString()));
					} else {
						reject();
					}
				}
			);
		});
	}

	public setBrowserActionListener(
		action: ExtensionBrowserAction,
		callback: (tab: Tab) => void
	): void {
		const cb = function (tab: chrome.tabs.Tab) {
			if (tab && tab.id) {
				callback(new Tab(tab.id.toString()));
			}
		};
		const chromeAction = this.getChromeActionName(action);
		//lançar exceção caso n encontre a ação do chrome ?
		if (chromeAction) {
			chrome.browserAction[chromeAction].addListener(cb);
		}
	}

	//procurar maneira mais correta de fazer que nao envolva ifs nem switch
	private getChromeActionName(
		action: ExtensionBrowserAction
	): string | undefined {
		if (action == ExtensionBrowserAction.ExtensionIconClicked)
			return 'onClicked';
	}
}
