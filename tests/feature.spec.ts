import { createValidFeature } from './util/util';
import { classToPlain, plainToClass } from 'class-transformer';
import { Feature } from '../src/spec-analyser/Feature';
import { assertFeaturesAreEqual } from './util/assertions';
describe('Feature', () => {
	it('serializes feature object correctly', async () => {
		const feature = createValidFeature();

		const json = classToPlain(feature);

		const deserializedFeature = plainToClass(Feature, json);

		assertFeaturesAreEqual(feature, deserializedFeature);
	});
});
