import { classToPlain, plainToClass } from 'class-transformer';
import { assertElementAnalysisAreEqual } from './util/assertions';
import { createValidElementAnalysis } from './util/util';
import { ElementAnalysis } from '../src/content-script/crawler/ElementAnalysis';
describe('Element Analysis', () => {
	it('serializes element analysis object correctly', async () => {
		const elementAnalysis = createValidElementAnalysis();

		const json = classToPlain(elementAnalysis);

		const deserializedElementAnalysis = plainToClass(ElementAnalysis, json);

		assertElementAnalysisAreEqual(elementAnalysis, deserializedElementAnalysis);
	});
});
