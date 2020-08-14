import { v4 as uuid } from 'uuid';

import { Spec } from '../analysis/Spec';
import { SpecAnalyzer } from '../analysis/SpecAnalyzer';
import { Command } from '../comm/Command';
import { CommunicationChannel } from '../comm/CommunicationChannel';
import { Message } from '../comm/Message';
import { Graph } from '../graph/Graph';
import { GraphStorage } from '../graph/GraphStorage';
import { Mutex } from '../mutex/Mutex';
import { FeatureStorage } from './FeatureStorage';
import { UrlListStorage } from './UrlListStorage';

//classe deve ser refatorada
export class Crawler {
	private communicationChannel: CommunicationChannel;
	private graphStorage: GraphStorage;
	private crawledUrlsStorage: UrlListStorage;
	private featureStorage: FeatureStorage;
	private specAnalyzer: SpecAnalyzer;
	//abstrair mutex em classe
	private mutex: Mutex;
	private graphKey: string;
	private crawledUrlsKey: string;

	//aux variables
	private closeWindow = false;

	constructor(
		communicationChannel: CommunicationChannel,
		graphStorage: GraphStorage,
		crawledUrlsStorage: UrlListStorage,
		featureStorage: FeatureStorage,
		specAnalyzer: SpecAnalyzer,
		graphKey: string,
		crawledUrlsKey: string,
		mutex: Mutex
	) {
		this.graphStorage = graphStorage;
		this.crawledUrlsStorage = crawledUrlsStorage;
		this.featureStorage = featureStorage;
		this.mutex = mutex;
		this.graphKey = graphKey;
		this.crawledUrlsKey = crawledUrlsKey;
		this.communicationChannel = communicationChannel;
		this.specAnalyzer = specAnalyzer;
	}

	public crawl() {
		const pageUrl: URL = new URL(window.location.href);
		this.addUrlToGraph(pageUrl);
		const links: HTMLCollectionOf<HTMLAnchorElement> = this.searchForLinks();
		let foundUrl: URL;
		for (const link of links) {
			try {
				foundUrl = new URL(link.href);
			} catch (_) {
				continue;
			}
			this.addUrlToGraph(foundUrl);
			this.addUrlsLinkToGraph(pageUrl, foundUrl);
			if (
				this.sameHostname(foundUrl, pageUrl) &&
				!this.wasUrlAlreadyCrawled(foundUrl)
			) {
				this.crawledUrlsStorage.add(
					this.crawledUrlsKey,
					new URL(foundUrl.href)
				);
				const message: Message = new Message([Command.OpenNewTab], {
					url: foundUrl.href,
				});
				this.communicationChannel.sendMessageToAll(message);
			}
		}
		//ANÁLISE
		const spec = new Spec('pt-br');
		const specAnalyzed = this.specAnalyzer.analyze(document.body, spec);
		for (const feature of specAnalyzed.features) {
			const id: string = uuid();
			const key = pageUrl.href + ':' + id;
			this.featureStorage.save(key, feature);
			//temporario
			console.log(this.featureStorage.get(key));
		}

		this.closeWindow = true;
	}

	private searchForLinks(): HTMLCollectionOf<HTMLAnchorElement> {
		return document.getElementsByTagName('a');
	}

	//refatorar função
	private addUrlToGraph(url: URL): void {
		//mutex deveria ficar dentro de GraphStorage ou em Crawler ?
		this.mutex
			.lock()
			.then(() => {
				let graph: Graph = this.graphStorage.get(this.graphKey);
				graph.addNode(url.toString());
				this.graphStorage.save(this.graphKey, graph);
				return this.mutex.unlock();
			})
			.then(() => {
				if (this.closeWindow === true) window.close();
			});
	}

	//refatorar função
	private addUrlsLinkToGraph(urlFrom: URL, urlTo: URL): void {
		//mutex deveria ficar dentro de GraphStorage ou em Crawler ?
		this.mutex
			.lock()
			.then(() => {
				let graph: Graph = this.graphStorage.get(this.graphKey);
				graph.addEdge(urlFrom.toString(), urlTo.toString());
				this.graphStorage.save(this.graphKey, graph);
				return this.mutex.unlock();
			})
			.then(() => {
				if (this.closeWindow === true) window.close();
			});
	}

	private wasUrlAlreadyCrawled(url: URL): boolean {
		return this.crawledUrlsStorage.isUrlInList(this.crawledUrlsKey, url);
	}

	private sameHostname(url1: URL, url2: URL): boolean {
		return url1.hostname === url2.hostname;
	}
}
