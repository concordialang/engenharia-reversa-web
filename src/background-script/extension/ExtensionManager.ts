import { AppEvent } from '../../shared/comm/AppEvent';
import { Command } from '../../shared/comm/Command';
import { CommunicationChannel } from '../../shared/comm/CommunicationChannel';
import { Message } from '../../shared/comm/Message';
import { Extension } from './Extension';
import { ExtensionBrowserAction } from './ExtensionBrowserAction';
import { InMemoryDatabase } from './InMemoryDatabase';
import { Tab } from '../../shared/comm/Tab';
import { ConcordiaFiles } from '../ConcordiaFiles';
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
import { ElementAnalysisStatus } from '../../content-script/crawler/ElementAnalysisStatus';
import { ElementAnalysisStorage as ElementAnalysisStorageBackground }  from '../../background-script/storage/ElementAnalysisStorage';
import { ElementAnalysis } from './ElementAnalysis';
import { Feature } from './Feature';
import { Spec } from './Spec';
import { SpecStorage } from './SpecStorage';
import Mutex from 'idb-mutex';
import { IndexedDBObjectStorage } from '../../shared/storage/IndexedDBObjectStorage';
import { IndexedDBDatabases } from '../../shared/storage/IndexedDBDatabases';
import { deleteDB } from 'idb';

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
	private tabFinished: Map<string, boolean>;
	private tabAjaxCalls: Map<string, string[]>;
	private specMutex: Mutex;

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
		this.tabFinished = new Map<string, boolean>();
		this.tabAjaxCalls = new Map<string, string[]>();
		this.specMutex = new Mutex('spec-mutex');
	}

	public async setup(): Promise<void> {
		let _this = this;
		await this.deleteIDBDatabases();
		this.extension.setBrowserActionListener(
			ExtensionBrowserAction.ExtensionIconClicked,
			async function (tab: Tab) {
				if (!_this.extensionIsEnabled) {
					_this.extensionIsEnabled = true;
					_this.openedTabs.push(tab);
					_this.tabFinished.set(tab.getId(), false);
					_this.openedTabsCounter++;
					console.log("still has ajax to complete");
					//console.log(_this.tabStillHasAjaxToComplete(tab));
					while(_this.tabStillHasAjaxToComplete(tab)){
						await sleep(5);
					}
					_this.sendOrderToCrawlTab(tab, true);
				} else {
					_this.extension.reload();
				}
			}
		);
		
		this.listenToAjaxCalls();

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
					console.log(_this.inMemoryDatabase);
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
					console.log(_this.inMemoryDatabase);
					const key = data.key;
					_this.inMemoryDatabase.remove(key);
					if (responseCallback) {
						responseCallback(new Message([], true));
					}
				}
			} else if (message.includesAction(Command.SetValueInBackgroundIndexedDB)) {
				const data = message.getExtra();
				if (data) {
					const key = data.key;
					const value = data.value;
					const storage = new IndexedDBObjectStorage(data.dbName, data.storeName);
					await storage.set(key, value);
					if(_this.isGraphKey(key)){
						_this.communicationChannel.sendMessageToAll(new Message([AppEvent.InteractionGraphUpdated], key));
					}
				}
			} else if (message.includesAction(Command.GetValueFromBackgroundIndexedDB)) {
				const data = message.getExtra();
				if (data) {
					const key = data.key;
					console.log(key);
					const storage = new IndexedDBObjectStorage(data.dbName, data.storeName);
					let value = await storage.get(key);
					console.log(value);
					if (responseCallback) {
						if(value instanceof Graph){
							value = value.serialize();
						}
						console.log("enviou");
						responseCallback(new Message([], value));
					}
				}
			} else if (message.includesAction(Command.RemoveValueFromBackgroundIndexedDB)) {
				const data = message.getExtra();
				if (data) {
					const key = data.key;
					const storage = new IndexedDBObjectStorage(data.dbName, data.storeName);
					await storage.remove(key);
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
						console.log("still has ajax to complete");
						console.log(_this.tabStillHasAjaxToComplete(sender));
						while(_this.tabStillHasAjaxToComplete(sender)){
							await sleep(5);
						}
						_this.sendOrderToCrawlTab(sender);
					} else if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
						if (responseCallback)
							responseCallback(
								new Message([], _this.openedTabsLimit - _this.openedTabsCounter)
							);
					} else if (message.includesAction(AppEvent.Finished)) {
						console.log("tabs:",_this.tabFinished);
						_this.tabFinished.set(sender.getId(), true);
						console.log(_this.allTabsFinished());
						if(_this.allTabsFinished()){
							// const specStorage = JSON.parse(message.getExtra());
							const specObj = _this.inMemoryDatabase.get(Spec.getStorageKey());
							let spec;
							if(!(specObj instanceof Spec)){
								spec = plainToClass(Spec, specObj);
							} else {
								spec = specObj;
							}
							spec.setMutex(_this.specMutex);
							// const specStorage = JSON.parse(message.getExtra());
							// const specObj = JSON.parse(specStorage.localStorage.Spec);
							// const spec = plainToClass(Spec, specObj);

							const concordiaFiles = new ConcordiaFiles();
							concordiaFiles.gerate(spec);

							_this.extensionIsEnabled = false;
						}
					} else if (message.includesAction(Command.ProcessUnload)) {
						_this.tabLocked.set(sender.getId(), true);

						const elementInteractionGraph = _this.getElementInteractionGraph(sender);
						const interaction = plainToClass(ElementInteraction, message.getExtra().interaction);
						//@ts-ignore
						_this.addElementInteractionToGraph(interaction, elementInteractionGraph);

						console.log(interaction);
						//@ts-ignore
						_this.setInteractionElementAsAnalyzed(interaction, sender);

						const analysisElementPath = message.getExtra().analysisElementPath;
						const feature = plainToClass(Feature, message.getExtra().feature);
						//@ts-ignore
						const url = interaction.getPageUrl();
						//@ts-ignore
						if (!feature.needNewVariants) {
							await _this.setElementAnalysisAsDone(analysisElementPath, sender, url);
						}

						//@ts-ignore
						await _this.saveFeature(feature);

						const specObj = _this.inMemoryDatabase.get(Spec.getStorageKey());
						let spec;
						if(!(specObj instanceof Spec)){
							spec = plainToClass(Spec, specObj);
						} else {
							spec = specObj;
						}
						spec.setMutex(_this.specMutex);
						const specStorage = new SpecStorage(_this.inMemoryDatabase);

						//@ts-ignore
						spec.setSpecStorage(specStorage);
						//@ts-ignore
						await _this.saveFeatureToSpec(feature, spec, url, sender);
						
						_this.tabLocked.set(sender.getId(), false);
					}	
				}
			}
			if (responseCallback) responseCallback(new Message([], null));
		});
	}

	private async addElementInteractionToGraph(interaction: ElementInteraction<HTMLElement>, graph: ElementInteractionGraph): Promise<void> {
		//@ts-ignore
		console.log(interaction.getElementSelector());
		console.log(this.inMemoryDatabase.keys());
		//@ts-ignore
		await graph.addElementInteractionToGraph(interaction);
		//@ts-ignore
		console.log(this.inMemoryDatabase.size());
	}

	private getElementInteractionGraph(sender: Tab){
		const id = sender.getId();
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const featureStorage = new IndexedDBObjectStorage<Feature>(
			IndexedDBDatabases.Features,
			IndexedDBDatabases.Features,
			Feature
		);
		const variantStorage = new InMemoryStorage<Variant>(this.inMemoryDatabase);
		const elementInteractionStorage = new ElementInteractionStorage(featureStorage, variantStorage);
		const elementAnalysisStorage = new ElementAnalysisStorage(communicationChannel);
		const graphStorage = new GraphStorage(this.inMemoryDatabase);
		return new ElementInteractionGraph('tab-' + id, elementInteractionStorage, elementAnalysisStorage, graphStorage);
	}

	private async setInteractionElementAsAnalyzed(interaction: ElementInteraction<HTMLElement>, sender: Tab): Promise<void> {
		const elementAnalysis = new ElementAnalysis(
			//@ts-ignore
			interaction.getElementSelector(),
			interaction.getPageUrl(),
			ElementAnalysisStatus.Done,
			sender.getId()
		);
		const elementAnalysisStorage = new ElementAnalysisStorageBackground(this.inMemoryDatabase);
		console.log('vai salvar como analisado');
		await elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
		console.log('salvou como analisado');
	}

	private async setElementAnalysisAsDone(elementPath: string, sender: Tab, url : URL): Promise<void> {
		const elementAnalysis = new ElementAnalysis(
			elementPath,
			url,
			ElementAnalysisStatus.Done,
			sender.getId()
		);
		const elementAnalysisStorage = new ElementAnalysisStorageBackground(this.inMemoryDatabase);
		await elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
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
				_this.tabFinished.set(tab.getId(), false);
			});
		} else {
			this.urlQueue.push(url);
		}
	}

	private async saveFeature(feature: Feature): Promise<void> {
		console.log("vai salvar a feature");

		const featureStorage = new IndexedDBObjectStorage<Feature>(
			IndexedDBDatabases.Features,
			IndexedDBDatabases.Features,
			Feature
		);
		await featureStorage.set(feature.getId(), feature);
		console.log(feature.interactedElements.length);
		console.log(feature.getId());
		console.log(feature.getName());

		console.log(feature.interactedElements[feature.interactedElements.length-1]);

		console.log("salvou a feature");
	}

	private async saveFeatureToSpec(feature: Feature, spec: Spec, url: URL, sender: Tab): Promise<void> {
		const analysisFinished = await this.isAnalysisFinished(feature);

		if (analysisFinished) {
			await this.setFeatureUiElementsAsAnalyzed(feature, url, sender);
		}
		if (spec) {
			await spec.addFeature(feature);
		}
	}

	private isAnalysisFinished(feature: Feature): boolean {
		if (!feature.needNewVariants) {
			return true;
		}
		return false;
	}

	private async setFeatureUiElementsAsAnalyzed(feature: Feature, url: URL, sender: Tab): Promise<void> {
		const uiElements = feature.getUiElements();
		for (let uiElement of uiElements) {
			const element = uiElement.getSourceElement();
			if (element) {
				const analysis = new ElementAnalysis(
					element,
					url,
					ElementAnalysisStatus.Done,
					sender.getId()
				);
				const elementAnalysisStorage = new ElementAnalysisStorageBackground(this.inMemoryDatabase);
				await elementAnalysisStorage.set(analysis.getId(), analysis);
			}
			// else {
			// 	throw new Error("UIElement source element doesn't exist");
			// }
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

	private tabStillHasAjaxToComplete(tab: Tab): boolean {
		//console.log(this.getNumberOfAjaxRequestsBeingProcessed(tab));
		return this.getNumberOfAjaxRequestsBeingProcessed(tab) > 0;
	}

	private getNumberOfAjaxRequestsBeingProcessed(tab: Tab): number {
		//@ts-ignore
		const ajaxCalls = this.tabAjaxCalls.get(tab.getId());
		console.log(this.tabAjaxCalls);
		console.log(ajaxCalls);
		if (ajaxCalls) {
			return ajaxCalls.length;
		}
		return 0;
	}

	private listenToAjaxCalls(){

		const _this = this;

		const beforeRequest = (details) => {
			const type = details.type;
			if(type === 'xmlhttprequest'){
				const tabRequests = _this.tabAjaxCalls.get(details.tabId) || [];
				tabRequests.push(details.requestId);
				_this.tabAjaxCalls.set(details.tabId.toString(), tabRequests);
				console.log(_this.tabAjaxCalls);
			}
		};

		const requestCompleted = (details) => {
			const type = details.type;
			if(type === 'xmlhttprequest'){
				const tabRequests = _this.tabAjaxCalls.get(details.tabId) || [];
				_this.removeFromArray(tabRequests, details.requestId);
				_this.tabAjaxCalls.set(details.tabId.toString(), tabRequests);
				console.log(_this.tabAjaxCalls);
			}
		};
		
		var filter = {urls: ["<all_urls>"]};
		
		chrome.webRequest.onBeforeRequest.addListener(
		    beforeRequest, filter, []
		);
		
		chrome.webRequest.onCompleted.addListener(
			requestCompleted, filter, []
		);
	}

	private removeFromArray(array: Array<any>, element: any) {
		const index = array.indexOf(element);
		if (index > -1) {
			array.splice(index, 1);
		}
	}

	private allTabsFinished(): boolean {
		for(let tab of this.openedTabs){
			if(!this.tabFinished.get(tab.getId())) return false;
		}
		return true;
	}

	private async deleteIDBDatabases(){
		for(let dbName in IndexedDBDatabases){
			console.log(IndexedDBDatabases[dbName]);
			await deleteDB(IndexedDBDatabases[dbName]);
		}
	}

}
