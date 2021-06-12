import { UIElementGenerator } from '../feature-generators/UIElementGenerator';
import { VariantSentencesGenerator } from '../feature-generators/VariantSentencesGenerator';
import { Feature } from '../feature-structure/Feature';
import { Scenario } from '../feature-structure/Scenario';
import { UIElement } from '../feature-structure/UIElement';
import { Variant } from '../feature-structure/Variant';
import { VariantSentence } from '../feature-structure/VariantSentence';
import { NodeTypes } from '../node/NodeTypes';
import { Spec } from './Spec';

export class FeatureAnalyzer {
	private uiElementGenerator: UIElementGenerator;
	private variantSentencesGenerator: VariantSentencesGenerator;

	constructor() {
		this.uiElementGenerator = new UIElementGenerator();
		this.variantSentencesGenerator = new VariantSentencesGenerator();
	}

	createFeatureFromElement(f: HTMLElement, spec: Spec): Feature {
		const title: HTMLElement | null = this.titleBeforeElemente(f);

		const feature = new Feature();
		feature.setName(title ? title.innerHTML : this.generateFeatureName(spec.getFeatures().length, spec.language));

		return feature;
	}

	createScenario(feature: Feature): Scenario {
		const scenario = new Scenario();
		scenario.setName(feature.getName() + ' - Scenario 1');

		return scenario;
	}

	createUiElment(element: Element): UIElement | null {
		let uiElement: UIElement | null = null;

		if (element instanceof HTMLInputElement) {
			uiElement = this.uiElementGenerator.createUIElementFromInput(element);
		} else if (element instanceof HTMLButtonElement) {
			uiElement = this.uiElementGenerator.createUIElementFromButton(element);
		}

		return uiElement;
	}

	createVariant(): Variant {
		const variant = new Variant();
		variant.setName('General Variant');

		return variant;
	}

	createVariantSentence(uiElment: UIElement) {
		const sentence = this.variantSentencesGenerator.generateVariantSentenceFromUIElement(uiElment);

		return sentence;
	}

	createMutationVariantSentences(uiElment: UIElement, mutations: MutationRecord[]): VariantSentence[] {
		const mutationSentences = this.variantSentencesGenerator.generateVariantSentencesFromMutations(uiElment, mutations);

		return mutationSentences;
	}

	private titleBeforeElemente(f: HTMLElement): HTMLElement | null {
		if (
			f.previousElementSibling?.nodeName === NodeTypes.H1 ||
			f.previousElementSibling?.nodeName === NodeTypes.H2 ||
			f.previousElementSibling?.nodeName === NodeTypes.H3 ||
			f.previousElementSibling?.nodeName === NodeTypes.LEGEND
		) {
			return f.previousElementSibling as HTMLElement;
		}

		return null;
	}

	private generateFeatureName(featureCount: number, language: string): string {
		const id = 1 + featureCount;
		switch (language) {
			case 'pt-br':
				return 'Funcionalidade ' + id;
			default:
				return 'Feature ' + id;
		}
	}
}
