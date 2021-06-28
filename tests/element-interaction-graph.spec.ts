import { ElementInteractionGraph } from '../src/crawler/ElementInteractionGraph';
import { AnalyzedElement } from '../src/crawler/AnalyzedElement';
import { ElementInteraction } from '../src/crawler/ElementInteraction';
import Mutex from '../src/mutex/Mutex';
import { AnalyzedElementStorage } from '../src/storage/AnalyzedElementStorage';
import { ElementInteractionStorage } from '../src/storage/ElementInteractionStorage';
import { GraphStorage } from '../src/storage/GraphStorage';
import { HTMLEventType } from '../src/html/HTMLEventType';
import { HTMLElementType } from '../src/html/HTMLElementType';
import { getPathTo } from '../src/util';
import { LocalStorageMock } from './util/LocalStorageMock';
import * as fakeIndexedDB from 'fake-indexeddb/auto';
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

	let analyzedElementStorage: AnalyzedElementStorage;

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
		analyzedElementStorage = new AnalyzedElementStorage(storage, document);
		const elementInteractionStorage = new ElementInteractionStorage(storage, document);
		const graphStorage = new GraphStorage(storage);

		const mutex = new Mutex('test-graph');

		elementInteractionGraph = new ElementInteractionGraph(
			elementInteractionStorage,
			analyzedElementStorage,
			graphStorage,
			mutex
		);

		interactionA = await createElementInteraction('elementA', HTMLEventType.Click, url1);
		await elementInteractionGraph.addElementInteractionToGraph(interactionA);

		interactionB = await createElementInteraction(
			'elementB',
			HTMLEventType.Click,
			url1,
			HTMLElementType.Button
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionB, interactionA);

		interactionC = await createElementInteraction(
			'elementC',
			HTMLEventType.Change,
			url2,
			HTMLElementType.Input,
			true
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionC, interactionB);

		interactionD = await createElementInteraction(
			'elementD',
			HTMLEventType.Change,
			url2,
			HTMLElementType.Input,
			true
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionD, interactionC);

		interactionE = await createElementInteraction(
			'elementE',
			HTMLEventType.Change,
			url2,
			HTMLElementType.Input,
			true
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionE, interactionD);

		interactionF = await createElementInteraction(
			'elementF',
			HTMLEventType.Click,
			url1,
			HTMLElementType.Button
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionF, interactionB);

		interactionG = await createElementInteraction(
			'elementG',
			HTMLEventType.Change,
			url1,
			HTMLElementType.Input
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionG, interactionF);

		interactionH = await createElementInteraction(
			'elementH',
			HTMLEventType.Click,
			url3,
			HTMLElementType.Input
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionH, interactionG);

		interactionI = await createElementInteraction(
			'elementI',
			HTMLEventType.Change,
			url3,
			HTMLElementType.Input
		);
		await elementInteractionGraph.addElementInteractionToGraph(interactionI, interactionH);
	});

	async function createElementInteraction(
		elementId: string,
		eventType: HTMLEventType,
		url: URL,
		elementType: HTMLElementType = HTMLElementType.Input,
		elementAnalyzed: boolean = false
	) {
		const element = document.createElement(elementType);
		element.setAttribute('id', elementId);
		const elementInteraction = new ElementInteraction<HTMLElement>(element, eventType, url);
		if (elementAnalyzed) {
			const analyzedElement = new AnalyzedElement(element, url);
			await analyzedElementStorage.set(
				analyzedElement.getId(),
				new AnalyzedElement(element, url)
			);
		}
		return elementInteraction;
	}
});
