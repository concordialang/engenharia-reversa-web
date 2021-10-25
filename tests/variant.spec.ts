import { createElement, createValidUIElement, createValidVariant } from './util/util';
import { classToPlain, plainToClass } from 'class-transformer';
import { Feature } from '../src/content-script/spec-analyser/Feature';
import { assertFeaturesAreEqual, assertVariantsAreEqual } from './util/assertions';
import { Variant } from '../src/content-script/spec-analyser/Variant';
describe('Variant', () => {
	it('serializes variant object correctly', async () => {
		const element = createElement(document, 'div');

		const uiElement = createValidUIElement(element);

		const variant = createValidVariant(uiElement);

		const json = classToPlain(variant);

		const deserializedVariant = plainToClass(Variant, json);

		assertVariantsAreEqual(variant, deserializedVariant);
	});
});
