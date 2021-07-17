import { UIElementGenerator } from './UIElementGenerator';
import { VariantSentencesGenerator } from './VariantSentencesGenerator';
import { Feature } from './Feature';
import { Scenario } from './Scenario';
import { UIElement } from './UIElement';
import { Variant } from './Variant';
import { VariantSentence } from './VariantSentence';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { Spec } from './Spec';

export class FeatureUtil {
	private uiElementGenerator: UIElementGenerator = new UIElementGenerator();
	private variantSentencesGenerator: VariantSentencesGenerator = new VariantSentencesGenerator();

	createFeatureFromElement(f: HTMLElement): Feature {
		const title: HTMLElement | null = this.titleBeforeElemente(f);

		const feature = new Feature();

		if (title) {
			feature.setName(title.innerHTML);
		}

		return feature;
	}

	createScenario(feature: Feature): Scenario {
		const scenario = new Scenario();
		scenario.setName(feature.getName() + ' - Scenario 1');

		return scenario;
	}

	createUiElment(
		elm: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement
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

	createMutationVariantSentence(mutation: MutationRecord): VariantSentence | null {
		return this.variantSentencesGenerator.generateVariantSentenceFromMutations(mutation);
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

	//TODO
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
