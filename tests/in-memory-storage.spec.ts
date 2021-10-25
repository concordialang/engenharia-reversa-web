import { ChromeCommunicationChannel } from '../src/shared/comm/ChromeCommunicationChannel';
import { InMemoryStorage } from '../src/content-script/storage/InMemoryStorage';
import { ChromeExtension } from '../src/background-script/extension/ChromeExtension';
import { ExtensionManager } from '../src/background-script/extension/ExtensionManager';
import { InMemoryDatabase } from '../src/background-script/extension/InMemoryDatabase';
import { Variant } from '../src/content-script/spec-analyser/Variant';
import { ChromeMock } from './util/ChromeMock';
import { assertVariantsAreEqual, assertVariantSentencesAreEqual } from './util/assertions';
import { createElement, createValidUIElement, createValidVariant } from './util/util';

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

		const element = createElement(document, 'div', (element) => {
			element.setAttribute('id', 'element-1');
		});
		const uiElement = createValidUIElement(element);
		const variant = createValidVariant(uiElement);

		if (variant) {
			const key = 'key';

			await storage.set(key, variant);

			const retrievedVariant = await storage.get(key);

			expect(retrievedVariant).not.toBeNull();
			if (retrievedVariant) {
				assertVariantsAreEqual(variant, retrievedVariant);
			}
		}
	});

	it('removes value correctly', async () => {
		const database = new InMemoryDatabase();

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		await database.set(key, value);
		await database.remove(key);

		const retrievedValue = database.get(key);

		expect(retrievedValue).toBeUndefined();
	});
});
