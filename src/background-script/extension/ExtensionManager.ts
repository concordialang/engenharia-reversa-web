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
import { ElementInteractionStorage } from '../../background-script/storage/ElementInteractionStorage';
import { ChromeCommunicationChannel } from '../../shared/comm/ChromeCommunicationChannel';
import { InMemoryStorage } from '../../background-script/storage/InMemoryStorage';
import { Variant } from '../../content-script/spec-analyser/Variant';
import { ElementAnalysisStorage } from '../../content-script/storage/ElementAnalysisStorage';
import { GraphStorage } from '../../background-script/storage/GraphStorage';
import { ElementInteractionGraph } from '../graph/ElementInteractionGraph';
import { ElementInteraction } from '../../content-script/crawler/ElementInteraction';
import { Graph } from '../../content-script/graph/Graph';
import { sleep } from '../../content-script/util';

export class ExtensionManager {
	private openedTabs: Array<Tab>;
	private openedTabsCounter: number;
	private extension: Extension;
	private communicationChannel: CommunicationChannel;
	private urlQueue: Array<URL>;
	private openedTabsLimit: number;
	private extensionIsEnabled: boolean;
	private inMemoryDatabase: InMemoryDatabase;
	private tabLocked: Map<string, boolean>;

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
		this.tabLocked = new Map<string, boolean>();
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

		this.communicationChannel.setMessageListener(async function (
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
					let value = _this.inMemoryDatabase.get(key);
					if (responseCallback) {
						if(value instanceof Graph){
							value = value.serialize();
						}
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
						if(value instanceof Graph){
							graphs[key] = value.serialize();
						} else {
							graphs[key] = JSON.parse(value);
						}
						
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
						const url = sender.getURL();
						if(url){
							console.log(url.href);
						}
						console.log("graph:");
						let graph = _this.inMemoryDatabase.get('interactions-graph-tab-'+sender.getId());
						if(graph instanceof Graph){
							graph = graph.serialize();
						}
						if(graph){
							console.log(graph);
							if(graph.links){
								console.log("size links:");
								console.log(graph.links.length);
							}
							if(graph.nodes){
								console.log("size:");
								console.log(graph.nodes.length);
								for(let node of graph.nodes){
									console.log(node);
								}
							}							
						}
						while(_this.tabLocked.get(sender.getId())){
							await sleep(5);
						}
						_this.sendOrderToCrawlTab(sender);
					} else if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
						if (responseCallback)
							responseCallback(
								new Message([], _this.openedTabsLimit - _this.openedTabsCounter)
							);
					} else if (message.includesAction(AppEvent.Finished)) {
						// const specStorage = JSON.parse(message.getExtra());
						const specObj = _this.inMemoryDatabase.get(Spec.getStorageKey());
						const spec = plainToClass(Spec, specObj);
						// const specStorage = JSON.parse(message.getExtra());
						// const specObj = JSON.parse(specStorage.localStorage.Spec);
						// const spec = plainToClass(Spec, specObj);

						const concordiaFiles = new ConcordiaFiles();
						concordiaFiles.gerate(spec);

						_this.extensionIsEnabled = false;
					} else if (message.includesAction(Command.AddElementInteractionToGraph)) {
						_this.tabLocked.set(sender.getId(), true);
						const id = sender.getId();
						console.log(id);
						const communicationChannel = new ChromeCommunicationChannel(chrome);
						const featureStorage = new InMemoryStorage<Feature>(_this.inMemoryDatabase);
						const variantStorage = new InMemoryStorage<Variant>(_this.inMemoryDatabase);
						const elementInteractionStorage = new ElementInteractionStorage(_this.inMemoryDatabase, featureStorage, variantStorage);
						const elementAnalysisStorage = new ElementAnalysisStorage(communicationChannel);
						const graphStorage = new GraphStorage(_this.inMemoryDatabase);
						const elementInteractionGraph = new ElementInteractionGraph('tab-' + id, elementInteractionStorage, elementAnalysisStorage, graphStorage);
						//const interactionJson = message.getExtra();
						//interactionJson.elementSelector = interactionJson.element;
						//interactionJson.element = null;
						try{
							const interaction = plainToClass(ElementInteraction, message.getExtra());
							//@ts-ignore
							console.log(interaction.getElementSelector());
							console.log(_this.inMemoryDatabase.keys());
							//@ts-ignore
							await elementInteractionGraph.addElementInteractionToGraph(interaction);
							//@ts-ignore
							console.log(_this.inMemoryDatabase.size());
						} catch (e){
							console.log(e);
						}
						_this.tabLocked.set(sender.getId(), false);
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
