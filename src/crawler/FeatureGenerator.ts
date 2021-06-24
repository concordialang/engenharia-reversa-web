import { FeatureCollection } from '../analysis/FeatureCollection';
import { Spec } from '../analysis/Spec';
import { GraphStorage } from '../storage/GraphStorage';
import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { getPathTo } from '../util';
import { AnalyzedElement } from './AnalyzedElement';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionManager } from './ElementInteractionManager';
import { ElementInteractionStorage } from '../storage/ElementInteractionStorage';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"

// TODO: Refatorar construtor
// TODO: Refatorar classe

export class FeatureGenerator {
	private radioGroupsAlreadyFilled: string[];

	constructor(
		private elementInteractionManager: ElementInteractionManager,
		private pageUrl: URL,
		private spec: Spec,
		private graphStorage: GraphStorage,
		private elementInteractionStorage: ElementInteractionStorage,
		private elementInteractionGraphKey: string,
		private lastInteractionBeforeRedirectKey: string,
		private lastInteractionKey: string,
		private analyzedElementStorage: AnalyzedElementStorage
	) {
		this.radioGroupsAlreadyFilled = [];
	}

	public async analyse(contextElement: HTMLElement) {
		const xPath = getPathTo(contextElement);
		if (xPath) {
			const analyzedContext = await this.analyzedElementStorage.isElementAnalyzed(
				xPath,
				this.pageUrl
			);

			if (!analyzedContext) {
				const forms = contextElement.querySelectorAll('form');
				this.analyseForms(forms);

				// generate feature for elements outside of forms
				await this.generate(contextElement, true);
			}
		} else {
			throw new Error('Unable to get element XPath');
		}
	}

	private async analyseForms(forms) {
		for (let form of forms) {
			let xPathElement = getPathTo(form);

			if (!xPathElement) continue;

			const analyzedElement = await this.analyzedElementStorage.isElementAnalyzed(
				xPathElement,
				this.pageUrl
			);

			if (!analyzedElement) {
				await this.generate(form);
			}
		}
	}

	public async generate(
		contextElement: HTMLElement,
		ignoreFormElements: boolean = false
	): Promise<void> {
		const _this = this;

		let interactableElements: ChildNode[] = [];
		if (ignoreFormElements) {
			interactableElements = this.getInteractableElementsIgnoringForm(contextElement);
		} else {
			interactableElements = this.getInteractableElements(contextElement);
		}

		if (interactableElements.length > 0) {
			const featureCollection = new FeatureCollection();

			// add observer on form
			let observer = new MutationObserverManager(contextElement);

			// start feature analysis
			const feature = featureCollection.createFeatureFromElement(contextElement, this.spec);
			const scenario = featureCollection.createScenario(feature);
			const variant = featureCollection.createVariant();

			let previousInteraction: ElementInteraction<HTMLElement> | null = null;
			let lastInteraction: ElementInteraction<HTMLElement> | null = null;

			lastInteraction = await this.elementInteractionStorage.get(
				this.lastInteractionBeforeRedirectKey
			);

			if (!lastInteraction) {
				lastInteraction = await this.elementInteractionStorage.get(this.lastInteractionKey);
			}

			for (const element of interactableElements) {
				// interacts with the element
				let interaction: ElementInteraction<HTMLElement> | null | undefined;
				if (element instanceof HTMLInputElement) {
					interaction = this.generateInputInteraction(element);
				} else if (element instanceof HTMLButtonElement) {
					interaction = new ElementInteraction(
						element,
						HTMLEventType.Click,
						this.pageUrl
					);
				}

				if (element instanceof HTMLElement) {
					const interactionGraph = await new GraphStorage(window.localStorage).get(
						'interactions-graph'
					);
					let edges: [];
					if (interactionGraph) {
						edges = interactionGraph.serialize()['links'];
					} else {
						edges = [];
					}
					const redirectsToAnotherUrl = await this.redirectsToAnotherUrl(
						element,
						this.pageUrl,
						edges
					);
					if (!redirectsToAnotherUrl) {
						if (interaction) {
							if (!previousInteraction) {
								previousInteraction = lastInteraction;
								//pode ter problema de concorrencia
								await this.elementInteractionStorage.remove(
									this.lastInteractionBeforeRedirectKey
								);
							}
							const result = await this.elementInteractionManager.execute(
								interaction,
								true,
								previousInteraction
							);
							if (result) {
								if (result.getTriggeredRedirection()) {
									//pode ter problema de concorrencia
									await this.elementInteractionStorage.set(
										this.lastInteractionBeforeRedirectKey,
										interaction
									);
									break;
								}
							}
							previousInteraction = interaction;
						}
					}
				}

				if (!interaction) continue;

				// analyzes the interaction
				const uiElment = featureCollection.createUiElment(interaction.getElement());

				if (uiElment) {
					feature.setUiElement(uiElment);

					const variantSentence = featureCollection.createVariantSentence(uiElment);

					if (variantSentence !== null) {
						variant.setVariantSentence(variantSentence);
					}

					const mutations = observer.getMutations();

					if (mutations.length > 0) {
						const mutationSentences = featureCollection.createMutationVariantSentences(
							uiElment,
							mutations
						);

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

			observer.disconnect();

			this.radioGroupsAlreadyFilled = [];

			let analyzedElement: AnalyzedElement = new AnalyzedElement(
				contextElement,
				this.pageUrl
			);
			await this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
			for (let element of interactableElements) {
				//o que acontece nos casos onde ocorre um clique fora do formulário durante a análise do formuĺário? aquele elemento não ficará marcado como analisado
				analyzedElement = new AnalyzedElement(<HTMLElement>element, this.pageUrl);
				await this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
			}
		}
	}

	private getInteractableElements(element: HTMLElement): ChildNode[] {
		return Array.from(element.querySelectorAll('input, select, textarea, button'));
	}

	private getInteractableElementsIgnoringForm(element): ChildNode[] {
		let interactableElements: ChildNode[] = [];

		for (let el of element.childNodes) {
			if (el.nodeName !== HTMLNodeTypes.FORM) {
				if (
					el.nodeName === HTMLNodeTypes.INPUT ||
					el.nodeName === HTMLNodeTypes.SELECT ||
					el.nodeName === HTMLNodeTypes.TEXTAREA ||
					el.nodeName === HTMLNodeTypes.BUTTON
				) {
					interactableElements.push(el);
				}

				if (el.childNodes.length !== 0) {
					this.getInteractableElementsIgnoringForm(el);
				}
			}
		}

		return interactableElements;
	}

	private generateInputInteraction(
		input: HTMLInputElement
	): ElementInteraction<HTMLInputElement> | null {
		const type = input.getAttribute('type');
		if (type == HTMLInputType.Text) {
			return this.generateTextInputInteraction(input);
		} else if (type == HTMLInputType.Email) {
			return this.generateRadioInputInteraction(input);
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

	private generateRadioInputInteraction(
		element: HTMLInputElement
	): ElementInteraction<HTMLInputElement> | null {
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

	private generateTextInputInteraction(
		element: HTMLInputElement
	): ElementInteraction<HTMLInputElement> {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.pageUrl,
			'teste'
		);
		return interaction;
	}

	//CHECKBOX

	private generateCheckboxInputInteraction(
		element: HTMLInputElement
	): ElementInteraction<HTMLInputElement> {
		const interaction = new ElementInteraction<HTMLInputElement>(
			element,
			HTMLEventType.Change,
			this.pageUrl,
			true
		);
		return interaction;
	}

	private getFormInputElementsByNameAttribute(
		form: HTMLFormElement,
		name: string
	): HTMLInputElement[] {
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

	// FIXME Fazer com que essa função chame a função pathToInteraction de ElementInteractionGraph
	private async redirectsToAnotherUrl(element, url, edges): Promise<boolean> {
		const storage = new ElementInteractionStorage(window.localStorage, document);
		for (let edge of edges) {
			const sourceInteraction = await storage.get(edge.source);
			if (sourceInteraction) {
				if (sourceInteraction.getPageUrl().href == url.href) {
					const path = getPathTo(element);
					const path2 = getPathTo(sourceInteraction.getElement());
					if (path == path2) {
						const targetInteraction = await storage.get(edge.target);
						if (targetInteraction) {
							if (
								targetInteraction.getPageUrl().href !=
								sourceInteraction.getPageUrl().href
							) {
								return true;
							}
						}
					}
				}
			}
		}
		return false;
	}
}
