import { CommunicationChannel } from '../src/shared/comm/CommunicationChannel';
import { BrowserContext } from '../src/content-script/crawler/BrowserContext';
import { ButtonInteractor } from '../src/content-script/crawler/ButtonInteractor';
import { Crawler } from '../src/content-script/crawler/Crawler';
import { ElementInteractionExecutor } from '../src/content-script/crawler/ElementInteractionExecutor';
import { ElementInteractionGenerator } from '../src/content-script/crawler/ElementInteractionGenerator';
import { ElementInteractionGraph } from '../src/content-script/crawler/ElementInteractionGraph';
import { InputInteractor } from '../src/content-script/crawler/InputInteractor';
import { PageAnalyzer } from '../src/content-script/crawler/PageAnalyzer';
import { VisitedURLGraph } from '../src/content-script/crawler/VisitedURLGraph';
import Mutex from '../src/content-script/mutex/Mutex';
import { FeatureUtil } from '../src/content-script/spec-analyser/FeatureUtil';
import { Spec } from '../src/content-script/spec-analyser/Spec';
import { ElementAnalysisStorage } from '../src/content-script/storage/ElementAnalysisStorage';
import { GraphStorage } from '../src/content-script/storage/GraphStorage';
import { ChromeCommunicationChannel } from '../src/shared/comm/ChromeCommunicationChannel';
import { Message } from '../src/shared/comm/Message';
import { Command } from '../src/shared/comm/Command';
import { ElementAnalysis } from '../src/content-script/crawler/ElementAnalysis';
import { FeatureManager } from '../src/content-script/spec-analyser/FeatureManager';
import { UIElementGenerator } from '../src/content-script/spec-analyser/UIElementGenerator';
import { VariantSentencesGenerator } from '../src/content-script/spec-analyser/VariantSentencesGenerator';
import { VariantGenerator } from '../src/content-script/spec-analyser/VariantGenerator';
import { ElementAnalysisStatus } from '../src/content-script/crawler/ElementAnalysisStatus';
import { IndexedDBObjectStorage } from '../src/content-script/storage/IndexedDBObjectStorage';
import { LocalObjectStorage } from '../src/content-script/storage/LocalObjectStorage';
import { ElementInteraction } from '../src/content-script/crawler/ElementInteraction';
import { TableRowInteractor } from '../src/content-script/crawler/TableRowInteractor';
import { TableColumnInteractor } from '../src/content-script/crawler/TableColumnInteractor';
import { getDictionary } from '../src/content-script/dictionary';
import { ChromeMock } from './util/ChromeMock';
import { LocalStorageMock } from './util/LocalStorageMock';
import { Feature } from '../src/content-script/spec-analyser/Feature';
import { VariantGeneratorUtil } from '../src/content-script/spec-analyser/VariantGeneratorUtil';

const chrome = new ChromeMock();

describe('Crawler', () => {
	it('opens link on new tab when its not analyzed', async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 1);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'http://www.link1.com/';

		const dom = getRootHtmlDocument();
		const innerHTML = `<div id="link1-parent"><a id="link1" href="${link1}"></a></div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;
		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div);

		document.body = dom.body;

		const crawler: Crawler = buildCrawler({
			communicationChannel: communicationChannel,
		});
		await crawler.crawl();

		expect(communicationChannel.sendMessageToAll).toHaveBeenCalledWith(
			new Message([Command.OpenNewTab], { url: link1 })
		);
	});

	it("doesn't open link on new tab when its analysis is in progress", async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 1);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'http://www.link1.com/';

		const dom = getRootHtmlDocument();
		const innerHTML = `<div id="link1-parent"><a id="link1" href="${link1}"></a></div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;
		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div);

		const link1Element = dom.getElementById('link1');
		expect(link1Element).not.toBeNull();

		if (link1Element) {
			const localStorage = new LocalStorageMock();
			const analyzedElementStorage = new ElementAnalysisStorage(localStorage);
			const analyzedElement = new ElementAnalysis(
				link1Element,
				new URL(window.location.href),
				ElementAnalysisStatus.InProgress
			);
			await analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);

			const crawler: Crawler = buildCrawler({
				communicationChannel: communicationChannel,
				analyzedElementStorage: analyzedElementStorage,
			});
			document.body = dom.body;
			await crawler.crawl();

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link1 })
			);
		}
	});

	it("doesn't open link on new tab when a link parent element its analysis is in progress", async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 1);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'www.link1.com';

		const dom = getRootHtmlDocument();
		const innerHTML = `<div id="link1-parent-parent"><div id="link1-parent"><a id="link1" href="${link1}"></a></div></div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;
		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div);

		const link1ParentElement = dom.getElementById('link1-parent');
		expect(link1ParentElement).not.toBeNull();

		if (link1ParentElement) {
			const localStorage = new LocalStorageMock();
			const analyzedElementStorage = new ElementAnalysisStorage(localStorage);
			const analyzedElement = new ElementAnalysis(
				link1ParentElement,
				new URL(window.location.href),
				ElementAnalysisStatus.InProgress
			);
			await analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);

			const crawler: Crawler = buildCrawler({
				communicationChannel: communicationChannel,
				analyzedElementStorage: analyzedElementStorage,
			});
			document.body = dom.body;
			await crawler.crawl();

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link1 })
			);
		}
	});

	it("doesn't open link on new tab when its analyzed", async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 1);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'www.link1.com';

		const dom = getRootHtmlDocument();
		const innerHTML = `<div id="link1-parent"><a id="link1" href="${link1}"></a></div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;
		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div);

		const link1Element = dom.getElementById('link1');
		expect(link1Element).not.toBeNull();

		if (link1Element) {
			const localStorage = new LocalStorageMock();
			const analyzedElementStorage = new ElementAnalysisStorage(localStorage);
			const analyzedElement = new ElementAnalysis(
				link1Element,
				new URL(window.location.href),
				ElementAnalysisStatus.Done
			);
			await analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);

			const crawler: Crawler = buildCrawler({
				communicationChannel: communicationChannel,
				analyzedElementStorage: analyzedElementStorage,
			});
			document.body = dom.body;
			await crawler.crawl();

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link1 })
			);
		}
	});

	it("doesn't open link on new tab when a link parent element is analyzed", async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 1);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'www.link1.com';

		const dom = getRootHtmlDocument();
		const innerHTML = `<div id="link1-parent-parent"><div id="link1-parent"><a id="link1" href="${link1}"></a></div></div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;
		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div);

		const link1ParentElement = dom.getElementById('link1-parent');
		expect(link1ParentElement).not.toBeNull();

		if (link1ParentElement) {
			const localStorage = new LocalStorageMock();
			const analyzedElementStorage = new ElementAnalysisStorage(localStorage);
			const analyzedElement = new ElementAnalysis(
				link1ParentElement,
				new URL(window.location.href),
				ElementAnalysisStatus.Done
			);
			await analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);

			const crawler: Crawler = buildCrawler({
				communicationChannel: communicationChannel,
				analyzedElementStorage: analyzedElementStorage,
			});
			document.body = dom.body;
			await crawler.crawl();

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link1 })
			);
		}
	});

	it("doesn't open link on new tab when a element above link parent element is analyzed", async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 1);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'www.link1.com';

		const dom = getRootHtmlDocument();
		const innerHTML = `<div id="link1-parent"><a id="link1" href="${link1}"></a></div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;

		const div2 = dom.createElement('div');
		div2.id = 'link1-parent-parent';
		div2.appendChild(div);

		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div2);

		const link1ParentParentElement = dom.getElementById('link1-parent-parent');
		expect(link1ParentParentElement).not.toBeNull();

		if (link1ParentParentElement) {
			const localStorage = new LocalStorageMock();
			const analyzedElementStorage = new ElementAnalysisStorage(localStorage);
			const analyzedElement = new ElementAnalysis(
				link1ParentParentElement,
				new URL(window.location.href),
				ElementAnalysisStatus.Done
			);
			await analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);

			const crawler: Crawler = buildCrawler({
				communicationChannel: communicationChannel,
				analyzedElementStorage: analyzedElementStorage,
			});
			document.body = dom.body;
			await crawler.crawl();

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link1 })
			);
		}
	});

	it('respects the number of available tabs when opening links in new tabs', async () => {
		const communicationChannel = new ChromeCommunicationChannel(chrome);
		const sendMessageToAll = jest.fn().mockImplementation((message: Message) => {
			if (message.includesAction(Command.GetNumberOfAvailableTabs)) {
				const message = new Message([], 2);
				return message;
			}
		});
		communicationChannel.sendMessageToAll = sendMessageToAll;

		const link1 = 'http://www.link1.com/';
		const link2 = 'http://www.link2.com/';
		const link3 = 'http://www.link3.com/';
		const link4 = 'http://www.link4.com/';

		const dom = getRootHtmlDocument();
		const innerHTML = `
		<div id="link-parent">
			<a id="link1" href="${link1}"></a>
			<a id="link2" href="${link2}"></a>
			<a id="link3" href="${link3}"></a>
			<a id="link4" href="${link4}"></a>
		</div>`;
		const div = dom.createElement('div');
		div.innerHTML = innerHTML;

		const div2 = dom.createElement('div');
		div2.id = 'link-parent-parent';
		div2.appendChild(div);

		const body = dom.getElementsByTagName('body')[0];
		body.appendChild(div2);

		const linkParentParentElement = dom.getElementById('link-parent-parent');
		expect(linkParentParentElement).not.toBeNull();

		if (linkParentParentElement) {
			const crawler: Crawler = buildCrawler({
				communicationChannel: communicationChannel,
			});
			document.body = dom.body;
			await crawler.crawl();

			expect(communicationChannel.sendMessageToAll).toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link1 })
			);

			expect(communicationChannel.sendMessageToAll).toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link2 })
			);

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link3 })
			);

			expect(communicationChannel.sendMessageToAll).not.toHaveBeenCalledWith(
				new Message([Command.OpenNewTab], { url: link4 })
			);
		}
	});

	function getRootHtmlDocument(): HTMLDocument {
		const dom = document.implementation.createHTMLDocument('Fake document');
		return dom;
	}

	function buildCrawler(
		options:
			| {
					communicationChannel?: CommunicationChannel;
					analyzedElementStorage?: ElementAnalysisStorage;
			  }
			| undefined = {}
	): Crawler {
		const localStorage = new LocalStorageMock();

		const tabId = 'tab-test';

		const visitedPagesGraphMutex: Mutex = new Mutex('visited-pages-graph-mutex');

		const interactionsGraphMutex: Mutex = new Mutex('interactions-graph-mutex-' + tabId);

		const pageStorage = new IndexedDBObjectStorage<string>('engenharia-reversa-web', 'pages');

		const graphStorage: GraphStorage = new GraphStorage(window.localStorage);

		const inputInteractor = new InputInteractor();
		const buttonInteractor = new ButtonInteractor(window);
		const elementInteracationStorage = new LocalObjectStorage<ElementInteraction<HTMLElement>>(
			window.localStorage,
			ElementInteraction
		);

		const language = 'pt';
		const featureStorage = new LocalObjectStorage<Feature>(window.localStorage, Feature);
		const spec: Spec = new Spec(language, featureStorage);
		const dictionary = getDictionary(language);

		let analyzedElementStorage: ElementAnalysisStorage;
		if (options.analyzedElementStorage) {
			analyzedElementStorage = options.analyzedElementStorage;
		} else {
			analyzedElementStorage = new ElementAnalysisStorage(new LocalStorageMock());
		}

		let communicationChannel: CommunicationChannel;
		if (options.communicationChannel) {
			communicationChannel =
				options.communicationChannel ?? new ChromeCommunicationChannel(chrome);
		} else {
			communicationChannel = new ChromeCommunicationChannel(chrome);
		}

		const elementInteractionGraph = new ElementInteractionGraph(
			tabId,
			elementInteracationStorage,
			analyzedElementStorage,
			graphStorage,
			interactionsGraphMutex
		);

		const visitedURLGraph = new VisitedURLGraph(graphStorage, visitedPagesGraphMutex);

		const tableRowInteractor = new TableRowInteractor();
		const tableColumnInteractor = new TableColumnInteractor();

		const elementInteractionExecutor = new ElementInteractionExecutor(
			inputInteractor,
			buttonInteractor,
			tableRowInteractor,
			tableColumnInteractor,
			elementInteractionGraph
		);

		const pageUrl: URL = new URL(window.location.href);

		const browserContext = new BrowserContext(pageUrl, window);
		const elementInteractionGenerator = new ElementInteractionGenerator(browserContext);

		const uiElementGenerator = new UIElementGenerator();

		const variantSentencesGenerator = new VariantSentencesGenerator(uiElementGenerator);

		const featureUtil = new FeatureUtil(variantSentencesGenerator, dictionary);

		const variantGeneratorUtil = new VariantGeneratorUtil(dictionary);
		const variantGenerator: VariantGenerator = new VariantGenerator(
			elementInteractionGenerator,
			elementInteractionExecutor,
			featureUtil,
			variantGeneratorUtil
		);

		const featureManager = new FeatureManager(
			variantGenerator,
			featureUtil,
			analyzedElementStorage,
			spec
		);

		const pageAnalyzer = new PageAnalyzer(
			featureManager,
			analyzedElementStorage,
			spec,
			browserContext
		);

		const crawler: Crawler = new Crawler(
			browserContext,
			pageStorage,
			elementInteractionGraph,
			visitedURLGraph,
			pageAnalyzer,
			communicationChannel,
			analyzedElementStorage
		);

		return crawler;
	}
});
