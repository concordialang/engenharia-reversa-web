import { VariantSentencesGenerator } from './VariantSentencesGenerator';
import { Feature } from './Feature';
import { Scenario } from './Scenario';
import { Variant } from './Variant';
import { VariantSentence } from './VariantSentence';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';

function formatName(name: string): string {
	name = name.replace(':', '');
	name = name.charAt(0).toUpperCase() + name.slice(1);
	return name;
}

export class FeatureUtil {
	constructor(private variantSentencesGenerator: VariantSentencesGenerator) {}

	createFeatureFromElement(f: HTMLElement, featureCount: number): Feature {
		const title: HTMLElement | null = this.titleBeforeElement(f);

		let featureName: string;
		if (title) {
			featureName = title.innerHTML;
		} else {
			featureName = f.id ? formatName(f.id) : this.generateDefaultFeatureName(featureCount);
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

	createVariantSentence(element: HTMLElement): VariantSentence | null {
		return this.variantSentencesGenerator.gerate(element);
	}

	createMutationVariantSentence(mutation: MutationRecord): VariantSentence[] | null {
		return this.variantSentencesGenerator.gerateFromMutations(mutation);
	}

	private titleBeforeElement(f: HTMLElement): HTMLElement | null {
		if (
			f.previousElementSibling?.nodeName === HTMLNodeTypes.H1 ||
			f.previousElementSibling?.nodeName === HTMLNodeTypes.H2 ||
			f.previousElementSibling?.nodeName === HTMLNodeTypes.H3 ||
			f.previousElementSibling?.nodeName === HTMLNodeTypes.LEGEND
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
