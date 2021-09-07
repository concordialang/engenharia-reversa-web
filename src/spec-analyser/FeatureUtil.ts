import { VariantSentencesGenerator } from './VariantSentencesGenerator';
import { Feature } from './Feature';
import { Scenario } from './Scenario';
import { Variant } from './Variant';
import { VariantSentence } from './VariantSentence';
import { HTMLElementType } from '../types/HTMLElementType';
import { formatToFirstCapitalLetter } from '../util';

export class FeatureUtil {
	constructor(private variantSentencesGenerator: VariantSentencesGenerator) {}

	createFeatureFromElement(f: HTMLElement, featureCount: number): Feature {
		const title: HTMLElement | null = this.titleBeforeElement(f);

		let featureName: string;
		if (title) {
			featureName = title.innerHTML;
		} else {
			featureName = f.id
				? formatToFirstCapitalLetter(f.id)
				: this.generateDefaultFeatureName(featureCount);
		}

		const feature = new Feature();
		feature.setName(featureName);

		return feature;
	}

	createScenario(feature: Feature): Scenario {
		const scenario = new Scenario();
		scenario.setName(feature.getName() + ' - Scenario 1');

		return scenario;
	}

	createVariant(variantName = ''): Variant {
		const variant = new Variant();
		let name = variantName !== '' ? variantName : 'General Variant';
		variant.setName(name);

		return variant;
	}

	createVariantSentence(
		element: HTMLElement,
		firstAnalyzedSentence: boolean = false
	): VariantSentence | null {
		return this.variantSentencesGenerator.gerate(element, firstAnalyzedSentence);
	}

	createGivenTypeVariantSentence(url: URL): VariantSentence | null {
		return this.variantSentencesGenerator.gerateGivenTypeSentence(url);
	}

	createMutationVariantSentences(mutation: MutationRecord): VariantSentence[] | null {
		return this.variantSentencesGenerator.gerateFromMutations(mutation);
	}

	createThenTypeVariantSentence(variant: Variant): Variant {
		const sentences = variant.getSentences();

		const lastSentenceIndex = sentences.length - 1;

		const lastSentence = sentences[lastSentenceIndex];

		const lastSentenceThen = this.variantSentencesGenerator.gerateThenTypeSentence(
			lastSentence
		);

		variant.getSentences()[lastSentenceIndex] = lastSentenceThen;

		return variant;
	}

	private titleBeforeElement(f: HTMLElement): HTMLElement | null {
		if (
			f.previousElementSibling?.nodeName === HTMLElementType.H1 ||
			f.previousElementSibling?.nodeName === HTMLElementType.H2 ||
			f.previousElementSibling?.nodeName === HTMLElementType.H3 ||
			f.previousElementSibling?.nodeName === HTMLElementType.LEGEND
		) {
			return f.previousElementSibling as HTMLElement;
		}

		return null;
	}

	private generateDefaultFeatureName(featureCount: number, language?: string): string {
		const id = 1 + featureCount;
		switch (language) {
			case 'pt-br':
				return 'Funcionalidade ' + id;
			default:
				return 'Feature ' + id;
		}
	}
}
