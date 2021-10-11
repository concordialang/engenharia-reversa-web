import { ChromeCommunicationChannel } from '../src/comm/ChromeCommunicationChannel';
import { InMemoryStorage } from '../src/storage/InMemoryStorage';
import { ChromeExtension } from '../src/extension/ChromeExtension';
import { ExtensionManager } from '../src/extension/ExtensionManager';
import { InMemoryDatabase } from '../src/extension/InMemoryDatabase';
import { UIElement } from '../src/spec-analyser/UIElement';
import { VariantSentence } from '../src/spec-analyser/VariantSentence';
import { Variant } from '../src/spec-analyser/Variant';
import { UIProperty } from '../src/spec-analyser/UIProperty';
import { ChromeMock } from './util/ChromeMock';

describe('InMemoryStorage', () => {
	it('saves json value correctly', async () => {
		const chromeMock = new ChromeMock();

		const communicationChannel = new ChromeCommunicationChannel(chromeMock);
		const inMemoryDatabase = new InMemoryDatabase();

		const extension = new ChromeExtension(chromeMock);
		const extensionManager = new ExtensionManager(
			extension,
			communicationChannel,
			inMemoryDatabase,
			3
		);
		extensionManager.setup();

		const storage = new InMemoryStorage<{ id: string; name: string }>(communicationChannel);

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		await storage.set(key, value);

		const retrievedValue = await storage.get(key);

		expect(retrievedValue).not.toBeNull();
		if (retrievedValue) {
			expect(retrievedValue.id).toBe(value.id);
			expect(retrievedValue.name).toBe(value.name);
		}
	});

	it('saves Variant instance correctly', async () => {
		const chromeMock = new ChromeMock();

		const communicationChannel = new ChromeCommunicationChannel(chromeMock);
		const inMemoryDatabase = new InMemoryDatabase();

		const extension = new ChromeExtension(chromeMock);
		const extensionManager = new ExtensionManager(
			extension,
			communicationChannel,
			inMemoryDatabase,
			3
		);
		extensionManager.setup();

		const storage = new InMemoryStorage<Variant>(communicationChannel, Variant);

		const variant = getValidVariant();
		if (variant) {
			const key = 'key';

			await storage.set(key, variant);

			const retrievedVariant = await storage.get(key);

			expect(retrievedVariant).not.toBeNull();
			if (retrievedVariant) {
				expect(retrievedVariant.getName()).toBe(variant.getName());
				expect(retrievedVariant.last).toBe(variant.last);

				const variantSentences = variant.getSentences();
				const retrievedVariantSentences = retrievedVariant.getSentences();

				assertVariantSentencesAreEqual(variantSentences[0], retrievedVariantSentences[0]);
			}
		}
	});

	it('removes value correctly', () => {
		const database = new InMemoryDatabase();

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		database.set(key, value);
		database.remove(key);

		const retrievedValue = database.get(key);

		expect(retrievedValue).toBeUndefined();
	});

	function assertVariantSentencesAreEqual(expected: VariantSentence, actual: VariantSentence) {
		expect(actual.type).toBe(expected.type);
		expect(actual.action).toBe(expected.action);
		expect(actual.attributtes).toStrictEqual(expected.attributtes);
		expect(actual.url).not.toBeUndefined();
		if (actual.url && expected.url) {
			expect(actual.url.href).toBe(expected.url.href);
		}
		expect(actual.statePostCondition).toBe(expected.statePostCondition);
		expect(actual.uiElement).not.toBeUndefined();
		if (actual.uiElement && expected.uiElement) {
			assetUIElementsAreEqual(expected.uiElement, actual.uiElement);
		}
	}

	function assetUIElementsAreEqual(expected: UIElement, actual: UIElement) {
		expect(actual.getName()).toBe(expected.getName());
		expect(actual.getProperties()).toStrictEqual(expected.getProperties());
		expect(actual.getSourceElement()).toBe(expected.getSourceElement());
	}

	function getValidVariant(): Variant | null {
		let element: HTMLElement | null = document.createElement('div');
		element.setAttribute('id', 'element-1');
		document.body.appendChild(element);

		const uiProperty = new UIProperty('property 1', 'property value');

		element = document.getElementById('element-1');
		if (element) {
			const uiElement = new UIElement(element);
			uiElement.setName('UI Element 1');
			uiElement.setProperty(uiProperty);

			const sentence = new VariantSentence(
				'type 1',
				'action 1',
				uiElement,
				[{ property: 'property 1', value: 'value 1' }],
				new URL('https://www.google.com'),
				'state 1'
			);

			const variant = new Variant();
			variant.setName('variant 1');
			variant.setVariantSentence(sentence);
			variant.last = true;

			return variant;
		}

		return null;
	}
});
