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
import { DiffDomManipulator } from "../analysis/DiffDomManipulator";



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
		formFiller: FormFiller,
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

	public async crawl() {
		this.addUrlToGraph(this.pageUrl);
		const links: HTMLCollectionOf<HTMLAnchorElement> = this.searchForLinks();

		const previousDoc = document.implementation.createHTMLDocument();
		previousDoc.body.innerHTML += 
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

		const currentDoc = document.implementation.createHTMLDocument();
		currentDoc.body.innerHTML += 
            `<header id="menu">
				<button id="alert">Alert</button>
				<button id="confirm">Confirm</button>
				<button id="prompt">Prompt</button>
				<button id="teste">teste</button>
			</header>
		
			<section>
				<form method="POST" 	action="">
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

		console.log("previousDoc body", previousDoc.body);
		console.log("currentDoc body", currentDoc.body);
		let diffDomManipulator = new DiffDomManipulator(previousDoc.body, currentDoc.body);
		let parentElementDiff = diffDomManipulator.getFirstElementDiffParent();
		console.log("parent", parentElementDiff);
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
