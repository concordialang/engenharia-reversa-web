import { ElementInteractionGraph } from '../src/crawler/ElementInteractionGraph';
import { ElementInteraction } from '../src/crawler/ElementInteraction';
import Mutex from '../src/mutex/Mutex';
import { ElementInteractionStorage } from '../src/storage/ElementInteractionStorage';
import { GraphStorage } from '../src/storage/GraphStorage';
import { LocalStorageMock } from './util/LocalStorageMock';
import { ElementAnalysisStatus } from '../src/crawler/ElementAnalysisStatus';
import { ElementAnalysisStorage } from '../src/storage/ElementAnalysisStorage';
import { HTMLEventType } from '../src/enums/HTMLEventType';
import { HTMLElementType } from '../src/enums/HTMLElementType';
import { ElementAnalysis } from '../src/crawler/ElementAnalysis';

describe('ElementInteractionGraph', () => {
	const url1: URL = new URL('https://www.google.com');
	const url2: URL = new URL('https://www.facebook.com');
	const url3: URL = new URL('https://www.twitter.com');

	let interactionA: ElementInteraction<HTMLElement>;
	let interactionB: ElementInteraction<HTMLElement>;
	let interactionC: ElementInteraction<HTMLElement>;
	let interactionD: ElementInteraction<HTMLElement>;
	let interactionE: ElementInteraction<HTMLElement>;
	let interactionF: ElementInteraction<HTMLElement>;
	let interactionG: ElementInteraction<HTMLElement>;
	let interactionH: ElementInteraction<HTMLElement>;
	let interactionI: ElementInteraction<HTMLElement>;

	let elementInteractionGraph: ElementInteractionGraph;

	let elementAnalysisStorage: ElementAnalysisStorage;

	it('finds interaction of element with analysis in progress', async () => {
		const path = await elementInteractionGraph.pathToInteraction(
			interactionI,
			true,
			null,
			true
		);
		expect(path.length).toBe(4);
		expect(path[0].getId()).toBe(interactionI.getId());
		expect(path[1].getId()).toBe(interactionH.getId());
		expect(path[2].getId()).toBe(interactionG.getId());
		expect(path[3].getId()).toBe(interactionF.getId());
	});

	it('returns correct path searching for closest on same URL', async () => {
		const path = await elementInteractionGraph.pathToInteraction(interactionI, true, {
			interactionUrl: interactionI.getPageUrl(),
			isEqual: true,
		});
		expect(path.length).toBe(2);
		expect(path[0].getId()).toBe(interactionI.getId());
		expect(path[1].getId()).toBe(interactionH.getId());
	});

	it('returns correct path searching for closest interaction from unanalyzed element', async () => {
		const path = await elementInteractionGraph.pathToInteraction(
			interactionE,
			true,
			null,
			false
		);
		expect(path.length).toBe(4);
		expect(path[0].getId()).toBe(interactionE.getId());
		expect(path[1].getId()).toBe(interactionD.getId());
		expect(path[2].getId()).toBe(interactionC.getId());
		expect(path[3].getId()).toBe(interactionB.getId());
	});

	beforeAll(async () => {
		const storage = new LocalStorageMock();
		elementAnalysisStorage = new ElementAnalysisStorage(storage, document);
		const elementInteractionStorage = new ElementInteractionStorage(storage, document);
		const graphStorage = new GraphStorage(storage);

		const mutex = new Mutex('test-graph');

		elementInteractionGraph = new ElementInteractionGraph(
			'graph',
			elementInteractionStorage,
			elementAnalysisStorage,
			graphStorage,
			mutex
		);

		interactionA = await createElementInteraction('elementA', HTMLEventType.Click, url1);
		await elementInteractionGraph.addElementInteractionToGraph(interactionA);

		interactionB = await createElementInteraction(
			'elementB',
			HTMLEventType.Click,
			url1,
			HTMLElementType.BUTTON
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionB);

		interactionC = await createElementInteraction(
			'elementC',
			HTMLEventType.Change,
			url2,
			HTMLElementType.INPUT,
			ElementAnalysisStatus.Done
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionC);

		interactionD = await createElementInteraction(
			'elementD',
			HTMLEventType.Change,
			url2,
			HTMLElementType.INPUT,
			ElementAnalysisStatus.Done
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionD);

		interactionE = await createElementInteraction(
			'elementE',
			HTMLEventType.Change,
			url2,
			HTMLElementType.INPUT,
			ElementAnalysisStatus.Done
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionE);

		interactionF = await createElementInteraction(
			'elementF',
			HTMLEventType.Click,
			url1,
			HTMLElementType.BUTTON,
			ElementAnalysisStatus.InProgress
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionF);

		interactionG = await createElementInteraction(
			'elementG',
			HTMLEventType.Change,
			url1,
			HTMLElementType.INPUT
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionG);

		interactionH = await createElementInteraction(
			'elementH',
			HTMLEventType.Click,
			url3,
			HTMLElementType.INPUT
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionH);

		interactionI = await createElementInteraction(
			'elementI',
			HTMLEventType.Change,
			url3,
			HTMLElementType.INPUT
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionI);
	});

	async function createElementInteraction(
		elementId: string,
		eventType: HTMLEventType,
		url: URL,
		elementType: HTMLElementType = HTMLElementType.INPUT,
		analysisStatus: ElementAnalysisStatus = ElementAnalysisStatus.Pending
	) {
		const element = document.createElement(elementType);
		element.setAttribute('id', elementId);
		const elementInteraction = new ElementInteraction<HTMLElement>(element, eventType, url);
		const elementAnalysis = new ElementAnalysis(element, url, analysisStatus);
		await elementAnalysisStorage.set(elementAnalysis.getId(), elementAnalysis);
		return elementInteraction;
	}
});
