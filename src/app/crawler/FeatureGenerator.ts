import { HTMLElementType } from '../html/HTMLElementType';
import { HTMLEventType } from '../html/HTMLEventType';
import { HTMLInputType } from '../html/HTMLInputType';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionManager } from './ElementInteractionManager';
import { InputInteractor } from './InputInteractor';
import { Spec } from '../analysis/Spec';
import { FeatureCollection } from '../analysis/FeatureCollection';
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
export class FeatureGenerator {
	private radioGroupsAlreadyFilled: string[];
	private elementInteractionManager: ElementInteractionManager;
	private pageUrl: URL;
	private spec: Spec;
	private graphStorage: GraphStorage;
	private elementInteractionStorage: ElementInteractionStorage;
	private elementInteractionGraphKey: string;
	private lastInteractionBeforeRedirectKey: string;
	private lastInteractionKey: string;
	private analyzedElementStorage: AnalyzedElementStorage;

	constructor(
		elementInteractionManager: ElementInteractionManager,
		pageUrl: URL,
		spec: Spec,
		graphStorage: GraphStorage,
		elementInteractionStorage: ElementInteractionStorage,
		elementInteractionGraphKey: string,
		lastInteractionBeforeRedirectKey: string,
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
		this.lastInteractionBeforeRedirectKey = lastInteractionBeforeRedirectKey;
		this.lastInteractionKey = lastInteractionKey;
		this.analyzedElementStorage = analyzedElementStorage;
	}

	public async analyse(contextElement: HTMLElement) {
		const xPath = Util.getPathTo(contextElement);
		if (xPath) {
			if (!this.analyzedElementStorage.isElementAnalyzed(xPath, this.pageUrl)) {
				contextElement.querySelectorAll('form').forEach(async (element) => {
					await this.generate(element as HTMLElement);
				});

				await this.generate(contextElement as HTMLElement, true);
			}
		} else {
			throw new Error('Unable to get element XPath');
		}
	}

	public async generate(contextElement: HTMLElement, ignoreFormElements: boolean = false) {
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
			const feature = featureCollection.createFeatureFromForm(contextElement, this.spec);
			const scenario = featureCollection.createScenario(feature);
			const variant = featureCollection.createVariant();

			let previousInteraction: ElementInteraction<HTMLElement> | null = null;
			const lastInteraction = this.elementInteractionStorage.get(this.lastInteractionBeforeRedirectKey);

			if (!lastInteraction) {
				const lastInteraction = this.elementInteractionStorage.get(this.lastInteractionKey);
			}

			for (const element of interactableElements) {
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
							if (!previousInteraction) {
								previousInteraction = lastInteraction;
								//pode ter problema de concorrencia
								this.elementInteractionStorage.remove(this.lastInteractionBeforeRedirectKey);
							}
							const result = await this.elementInteractionManager.execute(interaction, true, previousInteraction);
							if (result) {
								if (result.getTriggeredRedirection()) {
									//pode ter problema de concorrencia
									this.elementInteractionStorage.save(this.lastInteractionBeforeRedirectKey, interaction);
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

				if (uiElment !== null && uiElment !== undefined) {
					feature.setUiElement(uiElment);

					const variantSentence = featureCollection.createVariantSentence(uiElment);

					if (variantSentence !== null) {
						variant.setVariantSentence(variantSentence);
					}

					const mutations = observer.getMutations();

					if (mutations.length > 0) {
						const mutationSentences = featureCollection.createMutationVariantSentences(uiElment, mutations);

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

			console.log('spec', this.spec);

			this.radioGroupsAlreadyFilled = [];
		}
	}

	private getInteractableElements(element: HTMLElement): ChildNode[] {
		return Array.from(element.querySelectorAll('input, select, textarea, button'));
	}

	private getInteractableElementsIgnoringForm(element): ChildNode[] {
		let interactableElements: ChildNode[] = [];

		for (let el of element.childNodes) {
			if (el.nodeName !== NodeTypes.FORM) {
				if (
					el.nodeName === NodeTypes.INPUT ||
					el.nodeName === NodeTypes.SELECT ||
					el.nodeName === NodeTypes.TEXTAREA ||
					el.nodeName === NodeTypes.BUTTON
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
