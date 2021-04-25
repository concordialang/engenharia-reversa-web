import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionManager } from './ElementInteractionManager';
import { InputInteractor } from './InputInteractor';
import { Spec } from '../analysis/Spec';
import { FeatureAnalyzer } from '../analysis/FeatureAnalyzer';
import { MutationObserverCreator } from '../mutationobserver/MutationObserverCreator';
import { InteractionResult } from './InteractionResult';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"
export class FormFiller {
	private radioGroupsAlreadyFilled: string[];
	private elementInteractionManager: ElementInteractionManager;
	private pageUrl: URL;
	private spec: Spec;

	constructor(elementInteractionManager: ElementInteractionManager, pageUrl: URL, spec: Spec) {
		this.radioGroupsAlreadyFilled = [];
		this.elementInteractionManager = elementInteractionManager;
		this.pageUrl = pageUrl;
		this.spec = spec;
	}

	public async fill(form: HTMLFormElement) {
		const featureAnalyzer = new FeatureAnalyzer();

		// add observer on form
		let observer = new MutationObserverCreator(form);

		// start feature analysis
		const feature = featureAnalyzer.createFeatureFromForm(form, this.spec);
		const scenario = featureAnalyzer.createScenario(feature);
		const variant = featureAnalyzer.createVariant();

		const elements = form.elements;
		for (const element of elements) {
			// interacts with the element
			let interaction: ElementInteraction<HTMLElement> | null | undefined;
			if (element instanceof HTMLInputElement) {
				interaction = this.generateInputInteraction(element);
			} else if (element instanceof HTMLButtonElement) {
				interaction = new ElementInteraction(element, HTMLEventType.Click, this.pageUrl);
			}

			if (interaction) {
				const result = await this.elementInteractionManager.execute(interaction);
				if (result) {
					if (result.getTriggeredRedirection()) {
						break;
					}
				}
			}

			if (!interaction) continue;

			// analyzes the interaction
			const uiElment = featureAnalyzer.createUiElment(interaction.getElement());

			if (uiElment !== null && uiElment !== undefined) {
				feature.setUiElement(uiElment);

				const variantSentence = featureAnalyzer.createVariantSentence(uiElment);

				if (variantSentence !== null) {
					variant.setVariantSentence(variantSentence);
				}

				const mutations = observer.getMutations();

				if (mutations.length > 0) {
					const mutationSentences = featureAnalyzer.createMutationVariantSentences(uiElment, mutations);

					for (let sentence of mutationSentences) {
						variant.setVariantSentence(sentence);
					}

					observer.resetMutations();
				}
			}
		}

		scenario.addVariant(variant);
		feature.addScenario(scenario);
		this.spec.addFeature(feature);

		console.log('spec', this.spec);

		observer.disconnect();
		this.radioGroupsAlreadyFilled = [];
	}

	private generateInputInteraction(input: HTMLInputElement): ElementInteraction<HTMLInputElement> | null {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			return this.generateTextInputInteraction(input);
		} else if (type == HTMLInputType.Radio) {
			return this.generateRadioInputInteraction(input);
		} else if (type == HTMLInputType.Checkbox) {
			return this.generateCheckboxInputInteraction(input);
		}
		return null;
	}

	//RADIO

	private generateRadioInputInteraction(element: HTMLInputElement): ElementInteraction<HTMLInputElement> | null {
		const name = element.getAttribute('name');
		const form = element.form;
		if (name && form) {
			if (!this.radioGroupsAlreadyFilled.includes(name)) {
				const radioGroup = this.getFormInputElementsByNameAttribute(form, name);
				if (radioGroup && radioGroup.length) {
					const chosenRadio = this.chooseRadioButton(radioGroup);
					if (chosenRadio) {
						const interaction = new ElementInteraction<HTMLInputElement>(
							chosenRadio,
							HTMLEventType.Change,
							this.pageUrl,
							chosenRadio.value
						);
						this.radioGroupsAlreadyFilled.push(name);
						return interaction;
					}
				}
			}
		}
		return null;
	}

	private chooseRadioButton(radioGroup: HTMLInputElement[]): HTMLInputElement | null {
		if (radioGroup.length) {
			return radioGroup[0];
		}
		return null;
	}

	//TEXT

	private generateTextInputInteraction(element: HTMLInputElement): ElementInteraction<HTMLInputElement> {
		const interaction = new ElementInteraction<HTMLInputElement>(element, HTMLEventType.Change, this.pageUrl, 'teste');
		return interaction;
	}

	//CHECKBOX

	private generateCheckboxInputInteraction(element: HTMLInputElement): ElementInteraction<HTMLInputElement> {
		const interaction = new ElementInteraction<HTMLInputElement>(element, HTMLEventType.Change, this.pageUrl, true);
		return interaction;
	}

	private getFormInputElementsByNameAttribute(form: HTMLFormElement, name: string): HTMLInputElement[] {
		const matchedInputs: HTMLInputElement[] = [];
		const inputs = form.getElementsByTagName(HTMLElementType.Input);
		for (const input of inputs) {
			const inputNameAttr = input.getAttribute('name');
			if (inputNameAttr && inputNameAttr == name) {
				matchedInputs.push(input as HTMLInputElement);
			}
		}
		return matchedInputs;
	}

	// private getRandomInt(min : number, max : number) {
	//     min = Math.ceil(min);
	//     max = Math.floor(max);
	//     return Math.floor(Math.random() * (max - min + 1)) + min;
	// }
}
