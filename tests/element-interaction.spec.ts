import { classToPlain, plainToClass } from 'class-transformer';
import { ElementInteraction } from '../src/content-script/crawler/ElementInteraction';
import { assertElementInteractionsAreEqual } from './util/assertions';
import { createValidElementInteraction } from './util/util';
describe('Element Interaction', () => {
	it('serializes element interaction object correctly', async () => {
		const elementInteraction = createValidElementInteraction();

		const json = classToPlain(elementInteraction);

		const deserializedElementInteraction = plainToClass(ElementInteraction, json);

		assertElementInteractionsAreEqual(elementInteraction, deserializedElementInteraction);
	});

	it('serializes element interaction object correctly if feature property is a reference string', async () => {
		const elementInteraction = createValidElementInteraction(undefined, 'feature-reference');

		const json = classToPlain(elementInteraction);

		const deserializedElementInteraction = plainToClass(ElementInteraction, json);

		assertElementInteractionsAreEqual(elementInteraction, deserializedElementInteraction);
	});
});
