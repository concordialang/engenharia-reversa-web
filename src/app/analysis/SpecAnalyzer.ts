import { UIElementGenerator } from '../feature-generators/UIElementGenerator';
import { VariantsGenerator } from '../feature-generators/VariantsGenerator';
import { Feature } from '../feature-structure/Feature';
import { Scenario } from '../feature-structure/Scenario';
import { NodeTypes } from '../node/NodeTypes';
import { Spec } from './Spec';

export class SpecAnalyzer {
	analyze(e: HTMLElement, spec: Spec): Spec {
		const forms = this.findForms(e);
		for (const f of forms) {
			this.createFeatureFromForm(f, spec);
		}

		return spec;
	}

	findForms(e: HTMLElement): Array<HTMLElement> {
		return Array.from(e.querySelectorAll(NodeTypes.FORM));
	}

	createFeatureFromForm(f: HTMLElement, spec: Spec): void {
		const title: HTMLElement | null = this.titleBeforeForm(f);

		const feature = new Feature();
		feature.name = title
			? title.innerHTML
			: this.generateFeatureName(spec.features.length, spec.language);

		spec.features.push(feature);

		const uiElementsGenerator = new UIElementGenerator();
		// const scenarioGenerator = new ScenarioGenerator();
		const variantGenerator = new VariantsGenerator();

		// UIElements
		const uiElements = uiElementsGenerator.createUIElementsFromForm(f);
		feature.setUiElements(uiElements);

		// Scenario With All Elements
		const scenarioAllElm = new Scenario();
		scenarioAllElm.setName(feature.name + ' - Scenario 1');
		feature.addScenario(scenarioAllElm);

		const variantAllElm = variantGenerator.generateVariantFromUIElements(
			uiElements
		);
		variantAllElm.setName(feature.name + ' With All Elements');
		scenarioAllElm.addVariant(variantAllElm);

		// Scenario With Mandatory Elements
		const scenarioMandatoryElm = new Scenario();
		scenarioMandatoryElm.setName(feature.name + ' - Scenario 2');
		feature.addScenario(scenarioMandatoryElm);

		const variantMandatoryElm = variantGenerator.generateVariantFromUIElements(
			uiElements,
			true
		);
		variantMandatoryElm.setName(feature.name + ' With Mandatory Elements');
		scenarioMandatoryElm.addVariant(variantMandatoryElm);
	}

	titleBeforeForm(f: HTMLElement): HTMLElement | null {
		if (
			f.previousElementSibling?.nodeName === NodeTypes.H1 ||
			f.previousElementSibling?.nodeName === NodeTypes.H2 ||
			f.previousElementSibling?.nodeName === NodeTypes.LEGEND
		) {
			return f.previousElementSibling as HTMLElement;
		}

		return null;
	}

	generateFeatureName(featureCount: number, language: string): string {
		const id = 1 + featureCount;
		switch (language) {
			case 'pt-br':
				return 'Funcionalidade ' + id;
			default:
				return 'Feature ' + id;
		}
	}
}
