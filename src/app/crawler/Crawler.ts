import { v4 as uuid } from 'uuid';

import { Spec } from '../analysis/Spec';
import { FeatureAnalyzer } from '../analysis/FeatureAnalyzer';
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
import  HtmlDiff from 'htmldiff-js';
import {DiffDOM} from "diff-dom"



//classe deve ser refatorada
export class Crawler {
	private document: HTMLDocument;
	private pageUrl: URL;
	private communicationChannel: CommunicationChannel;
	private graphStorage: GraphStorage;
	private crawledUrlsStorage: UrlListStorage;
	private featureStorage: FeatureStorage;
	private featureAnalyzer: FeatureAnalyzer;
	//abstrair mutex em classe
	private visitedPagesGraphMutex: Mutex;
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
		featureAnalyzer: FeatureAnalyzer,
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
		this.visitedPagesGraphMutex = mutex;
		this.graphKey = graphKey;
		this.crawledUrlsKey = crawledUrlsKey;
		this.communicationChannel = communicationChannel;
		this.featureAnalyzer = featureAnalyzer;
		this.formFiller = formFiller;
	}

	// public async crawl() {
	// 	this.addUrlToGraph(this.pageUrl);
	// 	const links: HTMLCollectionOf<HTMLAnchorElement> = this.searchForLinks();

	// 	// COMENTATO PARA TESTE
	// 	// let foundUrl: URL;
	// 	// for (const link of links) {
	// 	// 	try {
	// 	// 		foundUrl = new URL(link.href);
	// 	// 	} catch (_) {
	// 	// 		continue;
	// 	// 	}
	// 	// 	this.addUrlToGraph(foundUrl);
	// 	// 	this.addUrlsLinkToGraph(pageUrl, foundUrl);
	// 	// 	if (
	// 	// 		this.sameHostname(foundUrl, pageUrl) &&
	// 	// 		!this.wasUrlAlreadyCrawled(foundUrl)
	// 	// 	) {
	// 	// 		this.crawledUrlsStorage.add(
	// 	// 			this.crawledUrlsKey,
	// 	// 			new URL(foundUrl.href)
	// 	// 		);
	// 	// 		const message: Message = new Message([Command.OpenNewTab], {
	// 	// 			url: foundUrl.href,
	// 	// 		});
	// 	// 		this.communicationChannel.sendMessageToAll(message);
	// 	// 	}
	// 	// }
	// 	//ANÁLISE

	// 	// for (const feature of specAnalyzed.features) {
	// 	// 	const id: string = uuid();
	// 	// 	const key = this.pageUrl.href + ':' + id;
	// 	// 	this.featureStorage.save(key, feature);
	// 	// 	//temporario
	// 	// 	// console.log(this.featureStorage.get(key));
	// 	// }

	// 	// const element = document.getElementById('fname');
	// 	// if(element){
	// 	// 	const interaction = new ElementInteraction(<HTMLInputElement>element, HTMLEventType.Change, 'oaspkdaposkd');
	// 	// 	const inputInteractor = new InputInteractor();
	// 	// 	inputInteractor.execute(interaction);
	// 	// }

	// 	// const forms = this.document.getElementsByTagName('form');
	// 	// for (const form of forms) {

	// 	// 	// preenche formulario
	// 	// 	await this.formFiller.fill(form);
	// 	// }

	// 	const forms = this.document.getElementsByTagName('form');
	// 	for (const form of forms) {
	// 		// preenche formulario
	// 		await this.formFiller.fill(form);
	// 	}

	// 	//this.closeWindow = true;
	// }

	public async crawl() {
		this.addUrlToGraph(this.pageUrl);
		const links: HTMLCollectionOf<HTMLAnchorElement> = this.searchForLinks();

		const newDoc1 = document.implementation.createHTMLDocument();
		const newDoc2 = document.implementation.createHTMLDocument();

		newDoc1.body.innerHTML += 
            `<header id="menu">
				<button id="alert">Alert</button>
				<button id="confirm">Confirm</button>
				<button id="prompt">Prompt</button>
				<button id="teste">teste</button>
			</header>
		
			<section>
				<form action="" method="POST">
				<ul>
				<li>
					<label for="name">Name:</label>
					<input type="text" id="name" name="user_name">
				</li>
				<li>
					<label for="mail">E-mail:</label>
					<input type="text" id="mail" name="user_email">
				</li>
				<li>
					<label for="msg">Message:</label>
					<input type="text" id="msg" name="user_message"></input>
				</li>
				<li class="button">
					<button type="submit">Send your message</button>
					</li>
				</ul>
				</form>
			</section>
		
			<footer>
				<p>Footer<p>
			</footer>`;

		newDoc2.body.innerHTML += 
            `<header id="menu">
				<button id="alert">Alert</button>
				<button id="confirm">Confirm</button>
				<button id="prompt">Prompt</button>
				<button id="teste">teste</button>
			</header>
		
			<section>
				<form action="" method="POST" id="funcionalidade">
					<label for="fname">First name:</label><br>
					<input type="text" id="fname" name="fname"><br>
			
					<label for="lname">Last name:</label><br>
					<input type="text" id="lname" name="lname"><br><br>
			
					<button id="outro-form" type="button">Outro Formulario</button><br><br>
			
					<input type="radio" id="male" name="gender" value="male">
					<label for="male">Male</label><br>
					<input type="radio" id="female" name="gender" value="female">
					<label for="female">Female</label><br>
					<input type="radio" id="other" name="gender" value="other">
					<label for="other">Other</label><br><br>
			
					<input type="radio" id="pessoafisica" name="tipopessoa" value="1" onchange="toggleFieldTipoPessoa(1)">
					<label for="pessoafisica">Pessoa Física</label><br>
					<input type="radio" id="pessoajurifica" name="tipopessoa" value="2" onchange="toggleFieldTipoPessoa(2)">
					<label for="pessoajurifica">Pessoa Jurídica</label><br><br>
			
					<div id="divcpf" style='display: none'>
						<label for="cpf">CPF:</label><br>
						<input type="text" id="cpf" name="cpf"><br><br>
					</div>  
			
					<div id="divcnpj" style='display: none'>
						<label for="cnpj">CNPJ:</label><br>
						<input type="text" id="cnpj" name="cnpj"><br><br>
					</div>
					
					<input type="checkbox" id="vehicle1" name="vehicle1" value="Bike">
					<label for="vehicle1"> I have a bike</label><br>
					<input type="checkbox" id="vehicle2" name="vehicle2" value="Car">
					<label for="vehicle2"> I have a car</label><br>
					<input type="checkbox" id="vehicle3" name="vehicle3" value="Boat">
					<label for="vehicle3"> I have a boat</label><br><br>
			
					<input type="submit" value="Submit">
				</form>
			</section>
		
			<footer id="footer">
				<p>Footer</p>
			</footer>`;

		// PRIMEIRO TESTE - htmldiff-js
		console.log('PRIMEIRO TESTE - htmldiff-js');
		console.log("dif html", HtmlDiff.execute(newDoc1.body.innerHTML, newDoc2.body.innerHTML));

		// SEGUNDO TESTE - html-differ
		console.log('');
		console.log('');
		console.log('SEGUNDO TESTE - html-differ');
		var HtmlDiffer = require('html-differ').HtmlDiffer,
			logger = require('html-differ/lib/logger');

		var html1 = newDoc1.body.innerHTML,
			html2 = newDoc2.body.innerHTML;

		var options = {
				ignoreAttributes: [],
				compareAttributesAsJSON: [],
				ignoreWhitespaces: true,
				ignoreComments: true,
				ignoreEndTags: false,
				ignoreDuplicateAttributes: false
			};

		var htmlDiffer = new HtmlDiffer(options);

		var diff = htmlDiffer.diffHtml(html1, html2),
			isEqual = htmlDiffer.isEqual(html1, html2),
			res = logger.getDiffText(diff, { charsAroundDiff: 40 });

		console.log('diff', diff);
		console.log('isEqual',isEqual);
		console.log('res',res);

		logger.logDiffText(diff, { charsAroundDiff: 40 });

		// TERCEIRO TESTE - diff-dom
		console.log('');
		console.log('');
		console.log('TERCEIRO TESTE - diff-dom');

		var dd = new DiffDOM();

		diff = dd.diff(newDoc1.body, newDoc2.body);
		console.log("diff", diff);
		// dd.apply(html1, diff);

		// const forms = this.document.getElementsByTagName('form');
		// for (const form of forms) {
		// 	// preenche formulario
		// 	await this.formFiller.fill(form);
		// }

		//this.closeWindow = true;
	}

	private searchForLinks(): HTMLCollectionOf<HTMLAnchorElement> {
		return document.getElementsByTagName('a');
	}

	//refatorar função
	private addUrlToGraph(url: URL): void {
		//mutex deveria ficar dentro de GraphStorage ou em Crawler ?
		this.visitedPagesGraphMutex
			.lock()
			.then(() => {
				let graph: Graph = this.graphStorage.get(this.graphKey);
				graph.addNode(url.toString());
				this.graphStorage.save(this.graphKey, graph);
				return this.visitedPagesGraphMutex.unlock();
			})
			.then(() => {
				if (this.closeWindow === true) window.close();
			});
	}

	//refatorar função
	private addUrlsLinkToGraph(urlFrom: URL, urlTo: URL): void {
		//mutex deveria ficar dentro de GraphStorage ou em Crawler ?
		this.visitedPagesGraphMutex
			.lock()
			.then(() => {
				let graph: Graph = this.graphStorage.get(this.graphKey);
				graph.addEdge(urlFrom.toString(), urlTo.toString());
				this.graphStorage.save(this.graphKey, graph);
				return this.visitedPagesGraphMutex.unlock();
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
