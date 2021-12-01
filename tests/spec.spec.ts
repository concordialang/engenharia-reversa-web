import {
	createElement,
	createValidSpec,
	createValidUIElement,
	createValidVariant,
} from './util/util';
import { classToPlain, plainToClass } from 'class-transformer';
import {
	assertFeaturesAreEqual,
	assertSpecsAreEqual,
	assertVariantsAreEqual,
} from './util/assertions';
import { Variant } from '../src/content-script/spec-analyser/Variant';
import { Spec } from '../src/content-script/spec-analyser/Spec';

describe('Spec', () => {
	it('serializes spec object correctly', async () => {
		const spec = createValidSpec();

		const json = classToPlain(spec);

		const deserializedSpec = plainToClass(Spec, json);

		assertSpecsAreEqual(spec, deserializedSpec);
	});
});
