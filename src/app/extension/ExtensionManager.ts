import { AppEvent } from '../comm/AppEvent';
import { Command } from '../comm/Command';
import { CommunicationChannel } from '../comm/CommunicationChannel';
import { Message } from '../comm/Message';
import { Extension } from './Extension';
import { ExtensionBrowserAction } from './ExtensionBrowserAction';
import { Tab } from './Tab';

export class ExtensionManager {
	private openedTabs: Array<Tab>;
	private openedTabsCounter: number;
	private extension: Extension;
	private communicationChannel: CommunicationChannel;
	private urlQueue: Array<URL>;
	private openedTabsLimit: number;
	private extensionIsEnabled: boolean;

	private lastModifiedDate : Date|null;

	constructor(
		extension: Extension,
		communicationChannel: CommunicationChannel,
		openedTabsLimit: number
	) {
		this.openedTabs = [];
		this.extension = extension;
		this.communicationChannel = communicationChannel;
		this.openedTabsCounter = 0;
		this.urlQueue = [];
		this.openedTabsLimit = openedTabsLimit;
		this.extensionIsEnabled = false;
		this.lastModifiedDate = null;
	}

	public setup(): void {
		let _this = this;
		this.extension.setBrowserActionListener(
			ExtensionBrowserAction.ExtensionIconClicked,
			function (tab: Tab) {
				if (!_this.extensionIsEnabled) {
					_this.extensionIsEnabled = true;
					_this.openedTabs.push(tab);
					_this.openedTabsCounter++;
					_this.sendOrderToCrawlTab(tab, true);
				} else {
					_this.extensionIsEnabled = false;
				}
			}
		);

		this.communicationChannel.setMessageListener(function (
			message: Message,
			sender?: Tab
		) {
			if (_this.extensionIsEnabled) {
				if (message.includesAction(Command.OpenNewTab)) {
					const extra = message.getExtra();
					if (extra && extra.url)
						_this.openNewTab(new URL(extra.url));
				} else if (
					message.includesAction(AppEvent.Loaded) &&
					sender instanceof Tab &&
					sender.getId() &&
					_this.tabWasOpenedByThisExtension(sender)
				) {
					_this.sendOrderToCrawlTab(sender);
				}
			}
		});

		function checkForReload(){
			chrome.runtime.getPackageDirectoryEntry (function(dir){
				dir.getFile("reload",{},function(file){
					console.log(file.getMetadata(function(metadata){
						if(!_this.lastModifiedDate){
							_this.lastModifiedDate = metadata.modificationTime;
						} else if(metadata.modificationTime > _this.lastModifiedDate){
							chrome.runtime.reload();
							for(let tab of _this.openedTabs){
								chrome.tabs.reload (Number(tab.getId()))
							}
						}
						checkForReload();
					}))
				});
			});
		}

		chrome.management.getSelf (self => {
			if (self.installType === 'development') {
				checkForReload();
			}
		})

	}

	public openNewTab(url: URL): void {
		if (this.openedTabsCounter < this.openedTabsLimit) {
			const promise: Promise<Tab> = this.extension.openNewTab(url);
			const _this = this;
			this.openedTabsCounter++;
			promise.catch(function () {
				_this.openedTabsCounter--;
			});
			promise.then(function (tab: Tab) {
				_this.openedTabs.push(tab);
			});
		} else {
			this.urlQueue.push(url);
		}
	}

	//temporaria
	public sendOrderToCrawlTab(tab: Tab, firstCrawl: Boolean = false) {
		let commands: Array<Command> = [Command.Crawl];
		if (firstCrawl) {
			commands.push(Command.CleanGraph);
		}
		let idTab = tab.getId() ?? 0;
		const promise: Promise<void> = this.extension.sendMessageToTab(
			idTab.toString(),
			new Message(commands)
		);
		const _this = this;
		// promise.then(function () {
		// 	_this.removeTab(tab);
		// });
	}

	//teoricamente pode dar problema de concorrência
	private removeTab(tab: Tab) {
		for (let i: number = 0; i < this.openedTabs.length; i++) {
			let openedTab: Tab = this.openedTabs[i];
			if (openedTab.getId() == tab.getId()) {
				this.openedTabs.splice(i, 1);
			}
		}
		this.openedTabsCounter--;
		const url: URL | undefined = this.urlQueue.shift();
		if (url) this.openNewTab(url);
	}

	//temporaria
	public tabWasOpenedByThisExtension(tab: Tab) {
		for (let i: number = 0; i < this.openedTabs.length; i++) {
			let openedTab: Tab = this.openedTabs[i];
			if (openedTab.getId() == tab.getId()) {
				return true;
			}
		}
		return false;
	}
}
