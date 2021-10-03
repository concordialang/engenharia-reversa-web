import { VariantSentencesGenerator } from './VariantSentencesGenerator';
import { Feature } from './Feature';
import { Scenario } from './Scenario';
import { Variant } from './Variant';
import { VariantSentence } from './VariantSentence';
import { HTMLElementType } from '../enums/HTMLElementType';
import { formatToFirstCapitalLetter } from '../util';

export class FeatureUtil {
	constructor(private variantSentencesGenerator: VariantSentencesGenerator) {}

	createFeatureFromElement(f: HTMLElement, featureCount: number): Feature {
		const title: HTMLElement | null = this.titleBeforeElement(f);

		let featureName: string;
		if (title) {
			featureName = title.innerText;
		} else {
			featureName = f.id
				? formatToFirstCapitalLetter(f.id)
				: this.generateDefaultFeatureName(featureCount);
		}

		const feature = new Feature();
		feature.setName(featureName);

		return feature;
	}

	createScenario(featureName: string): Scenario {
		const scenario = new Scenario();
		scenario.setName(featureName + ' - General Scenario');

		return scenario;
	}

	createVariant(variantName, variantsCount: number): Variant {
		let id = 1 + variantsCount;
		const variant = new Variant();
		let name = variantName + ' - Variant ' + id;
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

	createThenTypeVariantSentence(featureName: string): VariantSentence {
		const thenSentence = this.variantSentencesGenerator.gerateThenTypeSentence(featureName);

		return thenSentence;
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
