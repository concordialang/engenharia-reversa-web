import { FeatureCollection } from '../analysis/FeatureCollection';
import { Spec } from '../analysis/Spec';
import { GraphStorage } from '../storage/GraphStorage';
import { HTMLNodeTypes } from '../html/HTMLNodeTypes';
import { MutationObserverManager } from '../mutation-observer/MutationObserverManager';
import { getFeatureElements, getPathTo } from '../util';
import { AnalyzedElement } from './AnalyzedElement';
import { AnalyzedElementStorage } from '../storage/AnalyzedElementStorage';
import { ElementInteraction } from './ElementInteraction';
import { ElementInteractionExecutor } from './ElementInteractionExecutor';
import { ElementInteractionStorage } from '../storage/ElementInteractionStorage';
import { ElementInteractionGraph } from './ElementInteractionGraph';
import { UIElement } from '../feature/UIElement';
import { Variant } from '../feature/Variant';
import { Feature } from '../feature/Feature';
import { ElementInteractionGenerator } from './ElementInteractionGenerator';
import { BrowserContext } from './BrowserContext';

//!!! Refatorar para utilizar algum tipo de padrão de projeto comportamental
//!!! Detalhar mais o disparamento de eventos, atualmente só está lançando "change"

// TODO: Refatorar construtor
// TODO: Refatorar classe

export class FeatureGenerator {
	constructor(
		private elementInteractionExecutor: ElementInteractionExecutor,
		private browserContext: BrowserContext,
		private spec: Spec,
		private elementInteractionGraph: ElementInteractionGraph,
		private analyzedElementStorage: AnalyzedElementStorage,
		private elementInteractionGenerator: ElementInteractionGenerator,
		private featureCollection: FeatureCollection
	) {}

	public async analyse(contextElement: HTMLElement) {
		let xPath = getPathTo(contextElement);
		if (xPath) {
			const analyzedContext = await this.analyzedElementStorage.isElementAnalyzed(
				xPath,
				this.browserContext.getUrl()
			);

			if (!analyzedContext) {
				await this.analyseFeatureElements(contextElement);

				if (
					contextElement.nodeName !== HTMLNodeTypes.FORM &&
					contextElement.nodeName !== HTMLNodeTypes.TABLE
				) {
					// generate feature for elements outside feature elements
					const feature = await this.generate(contextElement, true);
					if (feature) {
						this.spec.addFeature(feature);
					}
					this.elementInteractionGenerator.resetFilledRadioGroups();
				}
			}
		} else {
			// TODO - tratar excecao para nao travar o programa
			throw new Error('Unable to get element XPath');
		}
	}

	private async analyseFeatureElements(contextElement: HTMLElement) {
		if (
			contextElement.nodeName === HTMLNodeTypes.FORM ||
			contextElement.nodeName === HTMLNodeTypes.TABLE
		) {
			await this.generate(contextElement);
			return;
		}

		const featureTags: any = getFeatureElements(contextElement);
		if (featureTags.length > 0) {
			for (let featureTag of featureTags) {
				let xPathElement = getPathTo(featureTag);
				if (!xPathElement) continue;

				const analyzedElement = await this.analyzedElementStorage.isElementAnalyzed(
					xPathElement,
					this.browserContext.getUrl()
				);

				if (!analyzedElement) {
					await this.generate(featureTag);
				}
			}
		}
	}

	//FIXME FeatureGenerator não retorna uma Feature
	private async generate(
		contextElement: HTMLElement,
		ignoreFormElements: boolean = false
	): Promise<Feature | null> {
		let interactableElements: ChildNode[] = ignoreFormElements
			? this.getInteractableElementsIgnoringForm(contextElement)
			: this.getInteractableElements(contextElement);

		if (interactableElements.length <= 0) {
			return null;
		}

		// add observer on form
		let observer = new MutationObserverManager(contextElement);

		// start feature analysis
		const feature = this.featureCollection.createFeatureFromElement(contextElement, this.spec);
		const scenario = this.featureCollection.createScenario(feature);
		const variant = await this.buildVariant(
			feature,
			<HTMLElement[]>interactableElements,
			observer
		);

		scenario.addVariant(variant);
		feature.addScenario(scenario);
		observer.disconnect();

		let analyzedElement: AnalyzedElement = new AnalyzedElement(
			contextElement,
			this.browserContext.getUrl()
		);
		await this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);

		if (interactableElements.length > 0) {
			for (let element of interactableElements) {
				//o que acontece nos casos onde ocorre um clique fora do formulário durante a análise do formuĺário?
				// aquele elemento não ficará marcado como analisado
				analyzedElement = new AnalyzedElement(
					<HTMLElement>element,
					this.browserContext.getUrl()
				);
				await this.analyzedElementStorage.set(analyzedElement.getId(), analyzedElement);
			}
		}

		return feature;
	}

	private async buildVariant(
		feature: Feature,
		interactableElements: HTMLElement[],
		observer: MutationObserverManager
	): Promise<Variant> {
		const variant = this.featureCollection.createVariant();

		let previousInteraction: ElementInteraction<
			HTMLElement
		> | null = await this.elementInteractionGraph.getLastInteraction();

		for (const element of interactableElements) {
			const interaction = await this.interactWithElement(element, previousInteraction);

			if (!interaction) continue;

			previousInteraction = interaction;

			const interactionElement = interaction.getElement();

			let uiElement: UIElement | null = null;

			// analyzes the interaction
			if (
				interactionElement instanceof HTMLInputElement ||
				interactionElement instanceof HTMLSelectElement ||
				interactionElement instanceof HTMLButtonElement
			) {
				uiElement = this.featureCollection.createUiElment(interactionElement);
			}

			if (!uiElement) {
				continue;
			}

			feature.addUiElement(uiElement);

			const variantSentence = this.featureCollection.createVariantSentence(uiElement);

			if (variantSentence !== null) {
				variant.setVariantSentence(variantSentence);
			}

			const mutations = observer.getMutations();

			if (mutations.length > 0) {
				const mutationSentences = this.featureCollection.createMutationVariantSentences(
					uiElement,
					mutations
				);

				for (let sentence of mutationSentences) {
					variant.setVariantSentence(sentence);
				}

				observer.resetMutations();
			}
		}

		return variant;
	}

	private async interactWithElement(
		element: HTMLElement,
		previousInteraction: ElementInteraction<HTMLElement> | null
	): Promise<ElementInteraction<HTMLElement> | null> {
		// interacts with the element
		const interaction = this.elementInteractionGenerator.generate(element);

		if (!interaction) {
			return null;
		}

		const interactionGraph = await new GraphStorage(window.localStorage).get(
			'interactions-graph'
		);

		let edges: [];
		edges = interactionGraph ? interactionGraph.serialize()['links'] : [];

		const redirectsToAnotherUrl = await this.redirectsToAnotherUrl(
			element,
			this.browserContext.getUrl(),
			edges
		);

		if (!redirectsToAnotherUrl) {
			await this.elementInteractionExecutor.execute(interaction, true, previousInteraction);
		}

		return interaction;
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
