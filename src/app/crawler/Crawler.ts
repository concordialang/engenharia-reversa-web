import { v4 as uuid } from 'uuid';

import { Spec } from '../analysis/Spec';
import { SpecAnalyzer } from '../analysis/SpecAnalyzer';
import { Command } from '../comm/Command';
import { CommunicationChannel } from '../comm/CommunicationChannel';
import { Message } from '../comm/Message';
import { Graph } from '../graph/Graph';
import { GraphStorage } from '../graph/GraphStorage';
import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { Mutex } from '../mutex/Mutex';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionManager } from './ElementInteractionManager';
import { FeatureStorage } from './FeatureStorage';
import { FormFiller } from './FormFiller';
import { InputInteractor } from './InputInteractor';
import { UrlListStorage } from './UrlListStorage';

//classe deve ser refatorada
export class Crawler {
	private document: HTMLDocument;
	private pageUrl: URL;
	private communicationChannel: CommunicationChannel;
	private graphStorage: GraphStorage;
	private crawledUrlsStorage: UrlListStorage;
	private featureStorage: FeatureStorage;
	private specAnalyzer: SpecAnalyzer;
	//abstrair mutex em classe
	private mutex: Mutex;
	private graphKey: string;
	private crawledUrlsKey: string;
	private formFiller: FormFiller;

	//aux variables
	private closeWindow = false;

	constructor(
		document: HTMLDocument,
		pageUrl: URL,
		communicationChannel: CommunicationChannel,
		graphStorage: GraphStorage,
		crawledUrlsStorage: UrlListStorage,
		featureStorage: FeatureStorage,
		specAnalyzer: SpecAnalyzer,
		graphKey: string,
		crawledUrlsKey: string,
		mutex: Mutex,
		formFiller: FormFiller
	) {
		this.document = document;
		this.pageUrl = pageUrl;
		this.graphStorage = graphStorage;
		this.crawledUrlsStorage = crawledUrlsStorage;
		this.featureStorage = featureStorage;
		this.mutex = mutex;
		this.graphKey = graphKey;
		this.crawledUrlsKey = crawledUrlsKey;
		this.communicationChannel = communicationChannel;
		this.specAnalyzer = specAnalyzer;
		this.formFiller = formFiller;
	}

	public crawl() {
		this.addUrlToGraph(this.pageUrl);
		const links: HTMLCollectionOf<HTMLAnchorElement> = this.searchForLinks();
		// COMENTATO PARA TESTE
		// let foundUrl: URL;
		// for (const link of links) {
		// 	try {
		// 		foundUrl = new URL(link.href);
		// 	} catch (_) {
		// 		continue;
		// 	}
		// 	this.addUrlToGraph(foundUrl);
		// 	this.addUrlsLinkToGraph(pageUrl, foundUrl);
		// 	if (
		// 		this.sameHostname(foundUrl, pageUrl) &&
		// 		!this.wasUrlAlreadyCrawled(foundUrl)
		// 	) {
		// 		this.crawledUrlsStorage.add(
		// 			this.crawledUrlsKey,
		// 			new URL(foundUrl.href)
		// 		);
		// 		const message: Message = new Message([Command.OpenNewTab], {
		// 			url: foundUrl.href,
		// 		});
		// 		this.communicationChannel.sendMessageToAll(message);
		// 	}
		// }
		//ANÁLISE
		const spec = new Spec('pt-br');
		const specAnalyzed = this.specAnalyzer.analyze(document.body, spec);
		for (const feature of specAnalyzed.features) {
			const id: string = uuid();
			const key = this.pageUrl.href + ':' + id;
			this.featureStorage.save(key, feature);
			//temporario
			//console.log(this.featureStorage.get(key));
		}

		// const element = document.getElementById('fname');
		// if(element){
		// 	const interaction = new ElementInteraction(<HTMLInputElement>element, HTMLEventType.Change, 'oaspkdaposkd');
		// 	const inputInteractor = new InputInteractor();
		// 	inputInteractor.execute(interaction);
		// }

		const forms = this.document.getElementsByTagName('form');
		for (const form of forms) {
			this.formFiller.fill(form);
		}

		//this.closeWindow = true;
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
