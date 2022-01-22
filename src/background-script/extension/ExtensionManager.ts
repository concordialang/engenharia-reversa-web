import { AppEvent } from '../../shared/comm/AppEvent';
import { Command } from '../../shared/comm/Command';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { Message } from '../../shared/comm/Message';
import { Extension } from './Extension';
import { ExtensionBrowserAction } from './ExtensionBrowserAction';
import { InMemoryDatabase } from './InMemoryDatabase';
import { Tab } from '../../shared/comm/Tab';
import { ConcordiaFiles } from '../ConcordiaFiles';
import { Spec } from '../../content-script/spec-analyser/Spec';
import { Feature } from '../../content-script/spec-analyser/Feature';
import { plainToClass } from 'class-transformer';

export class ExtensionManager {
	private openedTabs: Array<Tab>;
	private openedTabsCounter: number;
	private extension: Extension;
	private communicationChannel: CommunicationChannel;
	private urlQueue: Array<URL>;
	private openedTabsLimit: number;
	private extensionIsEnabled: boolean;
	private inMemoryDatabase: InMemoryDatabase;

	constructor(
		extension: Extension,
		communicationChannel: CommunicationChannel,
		inMemoryDatabase: InMemoryDatabase,
		openedTabsLimit: number
	) {
		this.openedTabs = [];
		this.extension = extension;
		this.communicationChannel = communicationChannel;
		this.openedTabsCounter = 0;
		this.urlQueue = [];
		this.openedTabsLimit = openedTabsLimit;
		this.extensionIsEnabled = false;
		this.inMemoryDatabase = inMemoryDatabase;
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
					_this.extension.reload();
				}
			}
		);

		this.communicationChannel.setMessageListener(function (
			message: Message,
			sender?: Tab,
			responseCallback?: (response?: any) => void
		) {
			if (
				sender instanceof Tab &&
				sender.getId() &&
				message.includesAction(Command.GetTabId)
			) {
				if (responseCallback) responseCallback(new Message([], sender.getId()));
			}

			if (message.includesAction(Command.SetValueInMemoryDatabase)) {
				const data = message.getExtra();
				if (data) {
					const key = data.key;
					const value = data.value;
					_this.inMemoryDatabase.set(key, value);
					if(_this.isGraphKey(key)){
						_this.communicationChannel.sendMessageToAll(new Message([AppEvent.InteractionGraphUpdated], key));
					}
				}
			} else if (message.includesAction(Command.GetValueFromMemoryDatabase)) {
				const data = message.getExtra();
				if (data) {
					const key = data.key;
					const value = _this.inMemoryDatabase.get(key);
					if (responseCallback) {
						responseCallback(new Message([], value));
					}
				}
			} else if (message.includesAction(Command.RemoveValueFromMemoryDatabase)) {
				const data = message.getExtra();
				if (data) {
					const key = data.key;
					_this.inMemoryDatabase.remove(key);
					if (responseCallback) {
						responseCallback(new Message([], true));
					}
				}
			} else if (message.includesAction(Command.GetInteractionsGraphs)) {
				const graphs = {};
				for(let [key, value] of _this.inMemoryDatabase.entries()) {
					if(_this.isGraphKey(key)){
						graphs[key] = JSON.parse(value);
					}
				}
				if (responseCallback) {
					responseCallback(new Message([], graphs));
				}
			}

			if (_this.extensionIsEnabled) {
				if (message.includesAction(Command.OpenNewTab)) {
					const extra = message.getExtra();
					if (extra && extra.url) _this.openNewTab(new URL(extra.url));
				} else if (
					sender instanceof Tab &&
					sender.getId() &&
					_this.tabWasOpenedByThisExtension(sender)
				) {
					if (message.includesAction(AppEvent.Loaded)) {
						_this.sendOrderToCrawlTab(sender);
					} else if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
						if (responseCallback)
							responseCallback(
								new Message([], _this.openedTabsLimit - _this.openedTabsCounter)
							);
					} else if (message.includesAction(AppEvent.Finished)) {
						const specStorage = JSON.parse(message.getExtra());
						const specObj = JSON.parse(specStorage.localStorage.Spec);
						const spec = plainToClass(Spec, specObj);

						const concordiaFiles = new ConcordiaFiles();
						concordiaFiles.gerate(spec);

						_this.extensionIsEnabled = false;
					}
				}
			}
			if (responseCallback) responseCallback(new Message([], null));
		});
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

	private isGraphKey(key: string): boolean {
		const regexp = /interactions-graph-tab-[0-9]+/;
		return regexp.test(key);
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
		for (let openedTab of this.openedTabs) {
			if (openedTab.getId() == tab.getId()) {
				return true;
			}
		}
		return false;
	}
}
