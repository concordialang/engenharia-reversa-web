import { Variant } from '../src/spec-analyser/Variant';
import { IndexedDBObjectStorage } from '../src/storage/IndexedDBObjectStorage';
import { assertVariantsAreEqual } from './util/assertions';
import { createElement, createValidUIElement, createValidVariant } from './util/util';

describe('IndexedDBStorage', () => {
	it('saves json value correctly', async () => {
		const storage = new IndexedDBObjectStorage<{ id: string; name: string }>('foo', 'bar');

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		await storage.set(key, value);

		const retrievedValue = await storage.get(key);

		expect(retrievedValue).not.toBeFalsy();
		if (retrievedValue) {
			expect(retrievedValue.id).toBe(value.id);
			expect(retrievedValue.name).toBe(value.name);
		}
	});

	it('saves html string correctly', async () => {
		createElement(document, 'div');

		const html = document.body.outerHTML;

		const storage = new IndexedDBObjectStorage<string>('foo', 'bar');

		const key = 'key';

		await storage.set(key, html);

		const retrievedValue = await storage.get(key);

		expect(retrievedValue).toBe(html);
	});

	it('saves Variant instance correctly', async () => {
		const storage = new IndexedDBObjectStorage<Variant>('foo', 'bar', Variant);

		const element = createElement(document, 'div', (element) => {
			element.setAttribute('id', 'element-1');
		});
		const uiElement = createValidUIElement(element);
		const variant = createValidVariant(uiElement);

		if (variant) {
			const key = 'key';

			await storage.set(key, variant);

			const retrievedVariant = await storage.get(key);

			expect(retrievedVariant).not.toBeFalsy();
			if (retrievedVariant) {
				assertVariantsAreEqual(variant, retrievedVariant);
			}
		}
	});

	it('removes value correctly', async () => {
		const storage = new IndexedDBObjectStorage<{ id: string; name: string }>('foo', 'bar');

		const value = {
			id: '123',
			name: 'foo',
		};
		const key = 'key';

		await storage.set(key, value);
		await storage.remove(key);

		const retrievedValue = await storage.get(key);

		expect(retrievedValue).toBeUndefined();
	});
});
