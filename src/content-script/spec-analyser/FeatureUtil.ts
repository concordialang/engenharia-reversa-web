import { VariantSentencesGenerator } from './VariantSentencesGenerator';
import { Feature } from './Feature';
import { Scenario } from './Scenario';
import { Variant } from './Variant';
import { VariantSentence } from './VariantSentence';
import { HTMLElementType } from '../enums/HTMLElementType';
import { formatToFirstCapitalLetter } from '../util';

export class FeatureUtil {
	constructor(private variantSentencesGenerator: VariantSentencesGenerator, private dictionary) {}

	createFeatureFromElement(f: HTMLElement, featureCount: number, url: URL): Feature {
		const title: HTMLElement | null = this.titleBeforeElement(f);

		let featureName: string;
		if (title) {
			featureName = title.innerText;
		} else {
			featureName = f.id && typeof f.id === 'string'
				? formatToFirstCapitalLetter(f.id)
				: this.generateDefaultFeatureName(featureCount);
		}

		const feature = new Feature();
		feature.setName(featureName);
		feature.url = url;

		const scenario = this.createScenario();
		feature.addScenario(scenario);

		return feature;
	}

	createScenario(): Scenario {
		const scenario = new Scenario(this.dictionary.scenarioDefaultName);

		return scenario;
	}

	createVariant(variantName, variantsCount: number): Variant {
		let id = 1 + variantsCount;
		let name = id + ' - ' + variantName;

		const variant = new Variant();
		variant.setName(name);

		return variant;
	}

	createVariantSentence(
		element: HTMLElement,
		whenSentenceCreated: boolean = false,
	): VariantSentence | null {
		return this.variantSentencesGenerator.gerate(element, whenSentenceCreated);
	}

	createGivenTypeVariantSentence(): VariantSentence | null {
		return this.variantSentencesGenerator.gerateGivenTypeSentence();
	}

	createMutationVariantSentences(mutation: MutationRecord): VariantSentence[] | null {
		return this.variantSentencesGenerator.gerateFromMutations(mutation);
	}

	createThenTypeVariantSentence(
		featureName: string,
		lastClicableInteracted: HTMLButtonElement | HTMLInputElement | HTMLAnchorElement | null
	): VariantSentence {
		return this.variantSentencesGenerator.gerateThenTypeSentence(
			featureName,
			lastClicableInteracted
		);
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

		return this.dictionary.feature + ' ' + id;
	}
}
