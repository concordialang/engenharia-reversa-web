import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionManager } from './ElementInteractionManager';
import { InputInteractor } from './InputInteractor';
import { Spec } from '../analysis/Spec';
import { FeatureAnalyzer } from '../analysis/FeatureAnalyzer';
import { InteractionResult } from './InteractionResult';
import { ElementInteractionStorage } from './ElementInteractionStorage';
import { GraphStorage } from '../graph/GraphStorage';
import { Util } from '../Util';
import { Graph } from '../graph/Graph';
import { MutationObserverManager } from '../mutationobserver/MutationObserverManager';
import { NodeTypes } from '../node/NodeTypes';
import { AnalyzedElement } from './AnalyzedElement';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { AnalyzedElementStorage } from './AnalyzedElementStorage';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"
export class FeatureCreator {
	private radioGroupsAlreadyFilled: string[];
	private elementInteractionManager: ElementInteractionManager;
	private pageUrl: URL;
	private spec: Spec;
	private graphStorage: GraphStorage;
	private elementInteractionStorage: ElementInteractionStorage;
	private elementInteractionGraphKey: string;
	private lastInteractionKey: string;
	private analyzedElementStorage: AnalyzedElementStorage;

	constructor(
		elementInteractionManager: ElementInteractionManager,
		pageUrl: URL,
		spec: Spec,
		graphStorage: GraphStorage,
		elementInteractionStorage: ElementInteractionStorage,
		elementInteractionGraphKey: string,
		lastInteractionKey: string,
		analyzedElementStorage: AnalyzedElementStorage
	) {
		this.radioGroupsAlreadyFilled = [];
		this.elementInteractionManager = elementInteractionManager;
		this.pageUrl = pageUrl;
		this.spec = spec;
		this.graphStorage = graphStorage;
		this.elementInteractionStorage = elementInteractionStorage;
		this.elementInteractionGraphKey = elementInteractionGraphKey;
		this.lastInteractionKey = lastInteractionKey;
		this.analyzedElementStorage = analyzedElementStorage;
	}

	// public async interact(
	// 	analysisElement: HTMLElement,
	// 	elementInteractionGraph: ElementInteractionGraph | null = null,
	// 	lastInteractionFromUnalyzedForm: ElementInteraction<HTMLElement> | null = null
	// ) {
	// 	if (analysisElement.nodeName == NodeTypes.FORM) {
	// 		const form = <HTMLFormElement>analysisElement;
	// 		await this.fillForm(form, elementInteractionGraph, lastInteractionFromUnalyzedForm);
	// 	}

	// 	analysisElement.querySelectorAll('*').forEach(async (node) => {

	// 	});
	// }

	// public async fillForm(
	// 	form: HTMLFormElement,
	// 	elementInteractionGraph: ElementInteractionGraph | null = null,
	// 	lastInteractionFromUnalyzedForm: ElementInteraction<HTMLElement> | null = null
	// ) {
	// 	const xPath = Util.getPathTo(form);
	// 	//se ultima interacao que não está dentro de form já analisado está nessa página e também nesse form
	// 	let previousInteractions: ElementInteraction<HTMLElement>[] = [];
	// 	if (xPath) {
	// 		if (!this.analyzedElementStorage.isElementAnalyzed(xPath, this.pageUrl)) {
	// 			const _this = this;
	// 			form.addEventListener(HTMLEventType.Submit, function () {
	// 				_this.analyzedElementStorage.save(new AnalyzedElement(form, _this.pageUrl));
	// 				this.setFormChildElementsAsAnalyzed(form);
	// 			});

	// 			if (lastInteractionFromUnalyzedForm && lastInteractionFromUnalyzedForm.getPageUrl().href == this.pageUrl.href) {
	// 				const urlCriteria = { interactionUrl: this.pageUrl, isEqual: true };
	// 				previousInteractions =
	// 					elementInteractionGraph
	// 						?.pathToInteraction(lastInteractionFromUnalyzedForm, false, urlCriteria, null, false)
	// 						.reverse() || [];
	// 				//previousInteractions = Util.getPreviousInteractions(this.interactionStorage,edges,lastUnanalyzed,this.pageUrl,form);
	// 				/*pega todas interações que foram feitas antes dessa ultima interação dentro desse form
	// 				e preenche o formulário, sem salvar no grafo, pois essas interações já foram salvas previamente
	// 				*/
	// 			}
	// 		} else {
	// 			return null;
	// 		}
	// 	} else {
	// 		throw new Error('Unable to get element XPath');
	// 	}

	// 	const interactionGraph = new GraphStorage().get('interactions-graph');
	// 	const edges = interactionGraph.serialize()['links'];

	// 	let previousInteraction: ElementInteraction<HTMLElement> | null = null;

	// 	for (let interaction of previousInteractions) {
	// 		if (!this.redirectsToAnotherUrl(interaction.getElement(), this.pageUrl, edges)) {
	// 			await this.elementInteractionManager.execute(interaction, false);
	// 		}
	// 	}

	// 	if (previousInteractions.length > 0) {
	// 		previousInteraction = previousInteractions[previousInteractions.length - 1];
	// 	}

	// 	const featureAnalyzer = new FeatureAnalyzer();

	// 	// add observer on form
	// 	let observer = new MutationObserverManager(form);

	// 	// start feature analysis
	// 	const feature = featureAnalyzer.createFeatureFromForm(form, this.spec);
	// 	const scenario = featureAnalyzer.createScenario(feature);
	// 	const variant = featureAnalyzer.createVariant();

	// 	const elements = this.getElements(form, previousInteractions);
	// 	for (const element of elements) {
	// 		// interacts with the element
	// 		let interaction: ElementInteraction<HTMLElement> | null | undefined;
	// 		if (element instanceof HTMLInputElement) {
	// 			interaction = this.generateInputInteraction(element);
	// 		} else if (element instanceof HTMLButtonElement) {
	// 			interaction = new ElementInteraction(element, HTMLEventType.Click, this.pageUrl);
	// 		}

	// 		if (element instanceof HTMLElement) {
	// 			const interactionGraph = new GraphStorage().get('interactions-graph');
	// 			const edges = interactionGraph.serialize()['links'];
	// 			if (!this.redirectsToAnotherUrl(element, this.pageUrl, edges)) {
	// 				if (interaction) {
	// 					let result: InteractionResult | null;
	// 					if (!previousInteraction) {
	// 						result = await this.elementInteractionManager.execute(
	// 							interaction,
	// 							true,
	// 							this.elementInteractionStorage.get(this.lastInteractionKey)
	// 						);
	// 					} else {
	// 						result = await this.elementInteractionManager.execute(interaction, true, previousInteraction);
	// 						previousInteraction = null;
	// 					}
	// 					if (result) {
	// 						if (result.getTriggeredRedirection()) {
	// 							break;
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}

	// 		if (!interaction) continue;

	// 		// analyzes the interaction
	// 		const uiElment = featureAnalyzer.createUiElment(interaction.getElement());

	// 		if (uiElment !== null && uiElment !== undefined) {
	// 			feature.setUiElement(uiElment);

	// 			const variantSentence = featureAnalyzer.createVariantSentence(uiElment);

	// 			if (variantSentence !== null) {
	// 				variant.setVariantSentence(variantSentence);
	// 			}

	// 			const mutations = observer.getMutations();

	// 			if (mutations.length > 0) {
	// 				const mutationSentences = featureAnalyzer.createMutationVariantSentences(uiElment, mutations);

	// 				for (let sentence of mutationSentences) {
	// 					variant.setVariantSentence(sentence);
	// 				}

	// 				observer.resetMutations();
	// 			}
	// 		}
	// 	}

	// 	scenario.addVariant(variant);
	// 	feature.addScenario(scenario);
	// 	this.spec.addFeature(feature);

	// 	//console.log('spec', this.spec);

	// 	observer.disconnect();

	// 	this.radioGroupsAlreadyFilled = [];

	// 	//flags form element as analyzed in case it doesn't trigger the submit event
	// 	this.analyzedElementStorage.save(new AnalyzedElement(form, this.pageUrl));
	// 	this.setFormChildElementsAsAnalyzed(form);
	// }

	// private getElements(form: HTMLFormElement, previousInteractions?: ElementInteraction<HTMLElement>[]): HTMLElement[] {
	// 	const elements: HTMLElement[] = [];
	// 	if (!previousInteractions || previousInteractions.length == 0) {
	// 		for (let element of form.elements) {
	// 			elements.push(<HTMLElement>element);
	// 		}
	// 		return elements;
	// 	} else {
	// 		const lastInteraction = previousInteractions[previousInteractions.length - 1];
	// 		for (let i = form.elements.length - 1; i >= 0; i--) {
	// 			const element = <HTMLElement>form.elements[i];
	// 			if (Util.getPathTo(element) == Util.getPathTo(lastInteraction.getElement())) break;
	// 			elements.unshift(element);
	// 		}
	// 		return elements;
	// 	}
	// }

	// private generateInputInteraction(input: HTMLInputElement): ElementInteraction<HTMLInputElement> | null {
	// 	const type = input.getAttribute('type');
	// 	if (type == HTMLInputType.Text) {
	// 		return this.generateTextInputInteraction(input);
	// 	} else if (type == HTMLInputType.Radio) {
	// 		return this.generateRadioInputInteraction(input);
	// 	} else if (type == HTMLInputType.Checkbox) {
	// 		return this.generateCheckboxInputInteraction(input);
	// 	} else if (type == HTMLInputType.Submit) {
	// 		return new ElementInteraction(input, HTMLEventType.Click, this.pageUrl);
	// 	}
	// 	return null;
	// }

	// //RADIO

	// private generateRadioInputInteraction(element: HTMLInputElement): ElementInteraction<HTMLInputElement> | null {
	// 	const name = element.getAttribute('name');
	// 	const form = element.form;
	// 	if (name && form) {
	// 		if (!this.radioGroupsAlreadyFilled.includes(name)) {
	// 			const radioGroup = this.getFormInputElementsByNameAttribute(form, name);
	// 			if (radioGroup && radioGroup.length) {
	// 				const chosenRadio = this.chooseRadioButton(radioGroup);
	// 				if (chosenRadio) {
	// 					const interaction = new ElementInteraction<HTMLInputElement>(
	// 						chosenRadio,
	// 						HTMLEventType.Change,
	// 						this.pageUrl,
	// 						chosenRadio.value
	// 					);
	// 					this.radioGroupsAlreadyFilled.push(name);
	// 					return interaction;
	// 				}
	// 			}
	// 		}
	// 	}
	// 	return null;
	// }

	// private chooseRadioButton(radioGroup: HTMLInputElement[]): HTMLInputElement | null {
	// 	if (radioGroup.length) {
	// 		return radioGroup[0];
	// 	}
	// 	return null;
	// }

	// //TEXT

	// private generateTextInputInteraction(element: HTMLInputElement): ElementInteraction<HTMLInputElement> {
	// 	const interaction = new ElementInteraction<HTMLInputElement>(element, HTMLEventType.Change, this.pageUrl, 'teste');
	// 	return interaction;
	// }

	// //CHECKBOX

	// private generateCheckboxInputInteraction(element: HTMLInputElement): ElementInteraction<HTMLInputElement> {
	// 	const interaction = new ElementInteraction<HTMLInputElement>(element, HTMLEventType.Change, this.pageUrl, true);
	// 	return interaction;
	// }

	// private getFormInputElementsByNameAttribute(form: HTMLFormElement, name: string): HTMLInputElement[] {
	// 	const matchedInputs: HTMLInputElement[] = [];
	// 	const inputs = form.getElementsByTagName(HTMLElementType.Input);
	// 	for (const input of inputs) {
	// 		const inputNameAttr = input.getAttribute('name');
	// 		if (inputNameAttr && inputNameAttr == name) {
	// 			matchedInputs.push(input as HTMLInputElement);
	// 		}
	// 	}
	// 	return matchedInputs;
	// }

	// private redirectsToAnotherUrl(element, url, edges) {
	// 	const storage = new ElementInteractionStorage(document);
	// 	for (let edge of edges) {
	// 		const sourceInteraction = storage.get(edge.source);
	// 		if (sourceInteraction) {
	// 			if (sourceInteraction.getPageUrl().href == url.href) {
	// 				const path = Util.getPathTo(element);
	// 				const path2 = Util.getPathTo(sourceInteraction.getElement());
	// 				if (path == path2) {
	// 					const targetInteraction = storage.get(edge.target);
	// 					if (targetInteraction) {
	// 						if (targetInteraction.getPageUrl().href != sourceInteraction.getPageUrl().href) {
	// 							return true;
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}
	// }

	// private setFormChildElementsAsAnalyzed(form) {
	// 	for (let element of form.querySelectorAll('input,textarea,select,button')) {
	// 		//o que acontece nos casos onde ocorre um clique fora do formulário durante a análise do formuĺário? aquele elemento não ficará marcado como analisado
	// 		this.analyzedElementStorage.save(new AnalyzedElement(element, this.pageUrl));
	// 	}
	// }

	public async interact(
		analysisElement: HTMLElement,
		elementInteractionGraph: ElementInteractionGraph | null = null,
		lastInteractionFromUnalyzedForm: ElementInteraction<HTMLElement> | null = null
	) {
		await this.fillForm(analysisElement, elementInteractionGraph, lastInteractionFromUnalyzedForm);

		// analysisElement.querySelectorAll('*').forEach(async (node) => {

		// });
	}

	public async fillForm(
		context: HTMLElement,
		elementInteractionGraph: ElementInteractionGraph | null = null,
		lastInteractionFromUnalyzedForm: ElementInteraction<HTMLElement> | null = null
	) {
		const xPath = Util.getPathTo(context);
		//se ultima interacao que não está dentro de form já analisado está nessa página e também nesse form
		let previousInteractions: ElementInteraction<HTMLElement>[] = [];
		if (xPath) {
			if (!this.analyzedElementStorage.isElementAnalyzed(xPath, this.pageUrl)) {
				const _this = this;
				context.addEventListener(HTMLEventType.Submit, function () {
					_this.analyzedElementStorage.save(new AnalyzedElement(context, _this.pageUrl));
					this.setFormChildElementsAsAnalyzed(context);
				});

				if (lastInteractionFromUnalyzedForm && lastInteractionFromUnalyzedForm.getPageUrl().href == this.pageUrl.href) {
					const urlCriteria = { interactionUrl: this.pageUrl, isEqual: true };
					previousInteractions =
						elementInteractionGraph
							?.pathToInteraction(lastInteractionFromUnalyzedForm, false, urlCriteria, null, false)
							.reverse() || [];
					//previousInteractions = Util.getPreviousInteractions(this.interactionStorage,edges,lastUnanalyzed,this.pageUrl,form);
					/*pega todas interações que foram feitas antes dessa ultima interação dentro desse form
					e preenche o formulário, sem salvar no grafo, pois essas interações já foram salvas previamente
					*/
				}
			} else {
				return null;
			}
		} else {
			throw new Error('Unable to get element XPath');
		}

		const interactionGraph = new GraphStorage().get('interactions-graph');
		const edges = interactionGraph.serialize()['links'];

		let previousInteraction: ElementInteraction<HTMLElement> | null = null;

		for (let interaction of previousInteractions) {
			if (!this.redirectsToAnotherUrl(interaction.getElement(), this.pageUrl, edges)) {
				await this.elementInteractionManager.execute(interaction, false);
			}
		}

		if (previousInteractions.length > 0) {
			previousInteraction = previousInteractions[previousInteractions.length - 1];
		}

		const featureAnalyzer = new FeatureAnalyzer();

		// add observer on form
		let observer = new MutationObserverManager(context);

		// start feature analysis
		const feature = featureAnalyzer.createFeatureFromForm(context, this.spec);
		const scenario = featureAnalyzer.createScenario(feature);
		const variant = featureAnalyzer.createVariant();

		const elements = this.getElements(context, previousInteractions);
		for (const element of elements) {
			// interacts with the element
			let interaction: ElementInteraction<HTMLElement> | null | undefined;
			if (element instanceof HTMLInputElement) {
				interaction = this.generateInputInteraction(element);
			} else if (element instanceof HTMLButtonElement) {
				interaction = new ElementInteraction(element, HTMLEventType.Click, this.pageUrl);
			}

			if (element instanceof HTMLElement) {
				const interactionGraph = new GraphStorage().get('interactions-graph');
				const edges = interactionGraph.serialize()['links'];
				if (!this.redirectsToAnotherUrl(element, this.pageUrl, edges)) {
					if (interaction) {
						let result: InteractionResult | null;
						if (!previousInteraction) {
							result = await this.elementInteractionManager.execute(
								interaction,
								true,
								this.elementInteractionStorage.get(this.lastInteractionKey)
							);
						} else {
							result = await this.elementInteractionManager.execute(interaction, true, previousInteraction);
							previousInteraction = null;
						}
						if (result) {
							if (result.getTriggeredRedirection()) {
								break;
							}
						}
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

		//console.log('spec', this.spec);

		observer.disconnect();

		this.radioGroupsAlreadyFilled = [];

		//flags form element as analyzed in case it doesn't trigger the submit event
		this.analyzedElementStorage.save(new AnalyzedElement(context, this.pageUrl));
		this.setFormChildElementsAsAnalyzed(context);
	}

	private getElements(form: HTMLElement, previousInteractions?: ElementInteraction<HTMLElement>[]): HTMLElement[] {
		const elements: HTMLElement[] = [];
		if (!previousInteractions || previousInteractions.length == 0) {
			for (let element of form.elements) {
				elements.push(<HTMLElement>element);
			}
			return elements;
		} else {
			const lastInteraction = previousInteractions[previousInteractions.length - 1];
			for (let i = form.elements.length - 1; i >= 0; i--) {
				const element = <HTMLElement>form.elements[i];
				if (Util.getPathTo(element) == Util.getPathTo(lastInteraction.getElement())) break;
				elements.unshift(element);
			}
			return elements;
		}
	}

	private generateInputInteraction(input: HTMLInputElement): ElementInteraction<HTMLInputElement> | null {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			return this.generateTextInputInteraction(input);
		} else if (type == HTMLInputType.Radio) {
			return this.generateRadioInputInteraction(input);
		} else if (type == HTMLInputType.Checkbox) {
			return this.generateCheckboxInputInteraction(input);
		} else if (type == HTMLInputType.Submit) {
			return new ElementInteraction(input, HTMLEventType.Click, this.pageUrl);
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

	private redirectsToAnotherUrl(element, url, edges) {
		const storage = new ElementInteractionStorage(document);
		for (let edge of edges) {
			const sourceInteraction = storage.get(edge.source);
			if (sourceInteraction) {
				if (sourceInteraction.getPageUrl().href == url.href) {
					const path = Util.getPathTo(element);
					const path2 = Util.getPathTo(sourceInteraction.getElement());
					if (path == path2) {
						const targetInteraction = storage.get(edge.target);
						if (targetInteraction) {
							if (targetInteraction.getPageUrl().href != sourceInteraction.getPageUrl().href) {
								return true;
							}
						}
					}
				}
			}
		}
	}

	private setFormChildElementsAsAnalyzed(form) {
		for (let element of form.querySelectorAll('input,textarea,select,button')) {
			//o que acontece nos casos onde ocorre um clique fora do formulário durante a análise do formuĺário? aquele elemento não ficará marcado como analisado
			this.analyzedElementStorage.save(new AnalyzedElement(element, this.pageUrl));
		}
	}
}
