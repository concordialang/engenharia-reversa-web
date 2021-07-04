import { UIElementGenerator } from '../generator/UIElementGenerator';
import { VariantSentencesGenerator } from '../generator/VariantSentencesGenerator';
import { Feature } from '../feature/Feature';
import { Scenario } from '../feature/Scenario';
import { UIElement } from '../feature/UIElement';
import { Variant } from '../feature/Variant';
import { VariantSentence } from '../feature/VariantSentence';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Spec } from './Spec';

//FIXME FeatureCollection na verdade é uma FeatureUtil
export class FeatureCollection {
	constructor(
		private uiElementGenerator: UIElementGenerator,
		private variantSentencesGenerator: VariantSentencesGenerator
	) {}

	createFeatureFromElement(f: HTMLElement, spec: Spec): Feature {
		const title: HTMLElement | null = this.titleBeforeElemente(f);

		const feature = new Feature();
		feature.setName(
			title
				? title.innerHTML
				: this.generateFeatureName(spec.getFeatures().length, spec.language)
		);

		return feature;
	}

	createScenario(feature: Feature): Scenario {
		const scenario = new Scenario();
		scenario.setName(feature.getName() + ' - Scenario 1');

		return scenario;
	}

	createUiElment(
		elm: HTMLInputElement | HTMLSelectElement | HTMLButtonElement
	): UIElement | null {
		let uiElement: UIElement | null = null;

		if (
			elm instanceof HTMLButtonElement ||
			(elm instanceof HTMLInputElement &&
				(elm.type === 'button' || elm.type === 'submit' || elm.type === 'reset'))
		) {
			uiElement = this.uiElementGenerator.createUIElementForButton(elm);
		} else {
			uiElement = this.uiElementGenerator.createUIElement(elm);
		}

		return uiElement;
	}

	createVariant(): Variant {
		const variant = new Variant();
		variant.setName('General Variant');

		return variant;
	}

	createVariantSentence(uiElment: UIElement): VariantSentence | null {
		return this.variantSentencesGenerator.generateVariantSentenceFromUIElement(uiElment);
	}

	createMutationVariantSentences(
		uiElment: UIElement,
		mutations: MutationRecord[]
	): VariantSentence[] {
		return this.variantSentencesGenerator.generateVariantSentencesFromMutations(
			uiElment,
			mutations
		);
	}

	private titleBeforeElemente(f: HTMLElement): HTMLElement | null {
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
